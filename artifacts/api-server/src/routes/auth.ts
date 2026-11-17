import { Router, type IRouter, type Request } from "express";
import type { RowDataPacket } from "mysql2/promise";
import {
  GetAuthSessionResponse,
  LoginBody,
  LoginResponse,
  RegisterBody,
  RegisterResponse,
} from "@workspace/api-zod";
import { executeSql, selectRows } from "../lib/mysql";
import {
  clearAdminSessionCookie,
  createAdminSession,
  destroyAdminSession,
  findAdminIdentity,
} from "../middleware/admin-auth";
import {
  clearCustomerSessionCookie,
  createCustomerSession,
  destroyCustomerSession,
  findCustomerIdentity,
  hashCustomerPassword,
  verifyCustomerPassword,
} from "../middleware/user-auth";

const router: IRouter = Router();
const failedLogins = new Map<string, { count: number; expiresAt: number }>();
const MAX_FAILED_LOGINS = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

interface CustomerRow extends RowDataPacket {
  id: number | string;
  name: string;
  email: string;
  phone: string | null;
  passwordHash: string;
  isActive: number | boolean;
}

interface ExistingUserRow extends RowDataPacket {
  id: number | string;
}

function loginKey(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function isRateLimited(key: string): boolean {
  const current = failedLogins.get(key);
  if (!current) return false;
  if (current.expiresAt <= Date.now()) {
    failedLogins.delete(key);
    return false;
  }
  return current.count >= MAX_FAILED_LOGINS;
}

function recordFailedLogin(key: string): void {
  const current = failedLogins.get(key);
  if (!current || current.expiresAt <= Date.now()) {
    failedLogins.set(key, {
      count: 1,
      expiresAt: Date.now() + LOGIN_WINDOW_MS,
    });
    return;
  }
  current.count += 1;
}

router.get("/auth/session", async (req, res): Promise<void> => {
  const admin = await findAdminIdentity(req);
  if (admin) {
    res.json(
      GetAuthSessionResponse.parse({
        authenticated: true,
        role: "admin",
        email: admin.email,
        name: "LinkUps Admin",
      }),
    );
    return;
  }

  const customer = await findCustomerIdentity(req);
  res.json(
    GetAuthSessionResponse.parse(
      customer
        ? {
            authenticated: true,
            role: "customer",
            email: customer.email,
            name: customer.name,
          }
        : { authenticated: false, role: null, email: null, name: null },
    ),
  );
});

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const name = parsed.data.name.trim();
  const email = parsed.data.email.trim().toLowerCase();
  if (!name) {
    res.status(400).json({ error: "Name is required." });
    return;
  }

  const existing = await selectRows<ExistingUserRow>(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    [email],
  );
  if (existing.length > 0) {
    res.status(409).json({ error: "An account with this email already exists." });
    return;
  }

  const passwordHash = await hashCustomerPassword(parsed.data.password);
  let result;
  try {
    result = await executeSql(
      `INSERT INTO users (name, email, phone, password_hash, role, is_active)
       VALUES (?, ?, ?, ?, 'customer', TRUE)`,
      [name, email, parsed.data.phone?.trim() || null, passwordHash],
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ER_DUP_ENTRY"
    ) {
      res.status(409).json({
        error: "An account with this email already exists.",
      });
      return;
    }
    throw error;
  }
  const identity = {
    userId: result.insertId,
    email,
    name,
    phone: parsed.data.phone?.trim() || null,
  };
  await destroyAdminSession(req);
  clearAdminSessionCookie(req, res);
  await createCustomerSession(req, res, identity);
  res.status(201).json(
    RegisterResponse.parse({
      authenticated: true,
      role: "customer",
      email,
      name,
    }),
  );
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const key = loginKey(req);
  if (isRateLimited(key)) {
    res.status(429).json({
      error: "Too many sign-in attempts. Try again in 15 minutes.",
    });
    return;
  }

  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    recordFailedLogin(key);
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();
  const configuredAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (configuredAdminEmail && email === configuredAdminEmail) {
    const authenticated = await createAdminSession(
      req,
      res,
      parsed.data.email,
      parsed.data.password,
    );
    if (res.headersSent) return;
    if (authenticated) {
      failedLogins.delete(key);
      res.json(
        LoginResponse.parse({
          authenticated: true,
          role: "admin",
          email,
          name: "LinkUps Admin",
        }),
      );
      return;
    }
    recordFailedLogin(key);
    res.status(401).json({ error: "Email or password is incorrect." });
    return;
  }

  const customers = await selectRows<CustomerRow>(
    `SELECT id, name, email, phone, password_hash AS passwordHash,
            is_active AS isActive
     FROM users
     WHERE email = ? AND role = 'customer'
     LIMIT 1`,
    [email],
  );
  const customer = customers[0];
  if (
    !customer ||
    !Boolean(customer.isActive) ||
    !(await verifyCustomerPassword(parsed.data.password, customer.passwordHash))
  ) {
    recordFailedLogin(key);
    res.status(401).json({ error: "Email or password is incorrect." });
    return;
  }

  failedLogins.delete(key);
  await destroyAdminSession(req);
  clearAdminSessionCookie(req, res);
  await createCustomerSession(req, res, {
    userId: customer.id,
    email: customer.email,
    name: customer.name,
    phone: customer.phone,
  });
  res.json(
    LoginResponse.parse({
      authenticated: true,
      role: "customer",
      email: customer.email,
      name: customer.name,
    }),
  );
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  clearAdminSessionCookie(req, res);
  clearCustomerSessionCookie(req, res);
  await Promise.all([
    destroyAdminSession(req),
    destroyCustomerSession(req),
  ]);
  res.status(204).end();
});

export default router;
