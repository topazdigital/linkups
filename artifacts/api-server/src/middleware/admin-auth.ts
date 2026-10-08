import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import type { RowDataPacket } from "mysql2/promise";
import { executeSql, selectRows } from "../lib/mysql";
import {
  AdminLoginBody,
  AdminLoginResponse,
  AdminLogoutResponse,
  GetAdminSessionResponse,
} from "@workspace/api-zod";
import { Router, type IRouter } from "express";

const SESSION_COOKIE = "linkups_admin_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

interface AdminSessionRow extends RowDataPacket {
  id: string;
  userId: number | string;
  email: string;
}

interface AdminUserRow extends RowDataPacket {
  id: number | string;
  role: "customer" | "admin";
  isActive: number | boolean;
}

export interface AdminIdentity {
  userId: number | string;
  email: string;
}

const router: IRouter = Router();
const failedLogins = new Map<string, { count: number; expiresAt: number }>();
const MAX_FAILED_LOGINS = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

declare global {
  namespace Express {
    interface Request {
      adminIdentity?: AdminIdentity;
    }
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function equalSecret(candidate: string, expected: string): boolean {
  const candidateBytes = Buffer.from(candidate);
  const expectedBytes = Buffer.from(expected);
  return (
    candidateBytes.length === expectedBytes.length &&
    candidateBytes.length > 0 &&
    timingSafeEqual(candidateBytes, expectedBytes)
  );
}

function cookieOptions(req: Request) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || req.secure,
    sameSite: "strict" as const,
    path: "/",
    maxAge: SESSION_TTL_MS,
  };
}

export async function createAdminSession(
  req: Request,
  res: Response,
  email: string,
  password: string,
): Promise<boolean> {
  const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (!configuredEmail || !configuredPassword) {
    res.status(503).json({
      error: "Admin credentials have not been configured on the server.",
    });
    return false;
  }

  if (
    !equalSecret(email.trim().toLowerCase(), configuredEmail) ||
    !equalSecret(password, configuredPassword)
  ) {
    return false;
  }

  const admins = await selectRows<AdminUserRow>(
    `SELECT id, role, is_active AS isActive
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [configuredEmail],
  );

  let userId: number | string;
  if (admins.length === 0) {
    const created = await executeSql(
      `INSERT INTO users (name, email, password_hash, role, is_active)
       VALUES (?, ?, ?, 'admin', TRUE)`,
      [
        process.env.ADMIN_NAME?.trim() || "LinkUps Admin",
        configuredEmail,
        `environment-managed:${randomBytes(32).toString("hex")}`,
      ],
    );
    userId = created.insertId;
  } else {
    const admin = admins[0];
    if (admin.role !== "admin" || !Boolean(admin.isActive)) {
      res.status(403).json({
        error: "This account is not an active administrator.",
      });
      return true;
    }
    userId = admin.id;
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await executeSql("DELETE FROM sessions WHERE expires_at <= NOW()");
  await executeSql(
    `INSERT INTO sessions (id, user_id, expires_at, token_hash)
     VALUES (?, ?, ?, ?)`,
    [randomUUID(), userId, expiresAt, hashToken(token)],
  );

  res.cookie(SESSION_COOKIE, token, cookieOptions(req));
  return true;
}

export async function findAdminIdentity(
  req: Request,
): Promise<AdminIdentity | null> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token || typeof token !== "string") return null;

  const sessions = await selectRows<AdminSessionRow>(
    `SELECT s.id, s.user_id AS userId, u.email
     FROM sessions s
     INNER JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ?
       AND s.expires_at > NOW()
       AND u.role = 'admin'
       AND u.is_active = TRUE
     LIMIT 1`,
    [hashToken(token)],
  );

  const session = sessions[0];
  return session
    ? { userId: session.userId, email: session.email }
    : null;
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const identity = await findAdminIdentity(req);
    if (!identity) {
      res.status(401).json({ error: "Admin sign-in is required." });
      return;
    }
    req.adminIdentity = identity;
    next();
  } catch (error) {
    next(error);
  }
}

export async function destroyAdminSession(req: Request): Promise<void> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token || typeof token !== "string") return;

  await executeSql("DELETE FROM sessions WHERE token_hash = ?", [
    hashToken(token),
  ]);
}

export function clearAdminSessionCookie(req: Request, res: Response): void {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || req.secure,
    sameSite: "strict",
    path: "/",
  });
}

function loginKey(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function isRateLimited(req: Request): boolean {
  const current = failedLogins.get(loginKey(req));
  if (!current) return false;
  if (current.expiresAt <= Date.now()) {
    failedLogins.delete(loginKey(req));
    return false;
  }
  return current.count >= MAX_FAILED_LOGINS;
}

function recordFailedLogin(req: Request): void {
  const key = loginKey(req);
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

router.get("/admin/session", async (req, res): Promise<void> => {
  const identity = await findAdminIdentity(req);
  res.json(
    GetAdminSessionResponse.parse({
      authenticated: Boolean(identity),
      email: identity?.email ?? null,
    }),
  );
});

router.post("/admin/login", async (req, res): Promise<void> => {
  if (isRateLimited(req)) {
    res.status(429).json({
      error: "Too many sign-in attempts. Try again in 15 minutes.",
    });
    return;
  }

  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    recordFailedLogin(req);
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const authenticated = await createAdminSession(
    req,
    res,
    parsed.data.email,
    parsed.data.password,
  );
  if (res.headersSent) return;
  if (!authenticated) {
    recordFailedLogin(req);
    res.status(401).json({ error: "Email or password is incorrect." });
    return;
  }

  failedLogins.delete(loginKey(req));
  const response = AdminLoginResponse.parse({
    authenticated: true,
    email: parsed.data.email.trim().toLowerCase(),
  });
  res.json(response);
});

router.post("/admin/logout", async (req, res): Promise<void> => {
  clearAdminSessionCookie(req, res);
  await destroyAdminSession(req);
  AdminLogoutResponse.parse(undefined);
  res.status(204).end();
});

export default router;
