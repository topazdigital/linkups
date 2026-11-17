import {
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import {
  AdminLoginBody,
  AdminLoginResponse,
  AdminLogoutResponse,
  GetAdminSessionResponse,
} from "@workspace/api-zod";
import { Router, type IRouter } from "express";
import {
  clearCustomerSessionCookie,
} from "./user-auth";

const SESSION_COOKIE = "linkups_admin_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export interface AdminIdentity {
  userId: number | string | null;
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

function signingKey(): Buffer | null {
  const sessionSecret = process.env.SESSION_SECRET;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!sessionSecret || !adminPassword) return null;

  return createHmac("sha256", sessionSecret)
    .update(`linkups-admin-session:${adminPassword}`)
    .digest();
}

function encodeSession(email: string, expiresAt: number, key: Buffer): string {
  const payload = Buffer.from(
    JSON.stringify({
      email,
      expiresAt,
      nonce: randomBytes(16).toString("base64url"),
    }),
  ).toString("base64url");
  const signature = createHmac("sha256", key)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

function decodeSession(token: string, key: Buffer): { email: string } | null {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined) return null;

  const expected = createHmac("sha256", key).update(payload).digest();
  let received: Buffer;
  try {
    received = Buffer.from(signature, "base64url");
  } catch {
    return null;
  }
  if (
    received.length !== expected.length ||
    !timingSafeEqual(received, expected)
  ) {
    return null;
  }

  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { email?: unknown; expiresAt?: unknown };
    if (
      typeof session.email !== "string" ||
      typeof session.expiresAt !== "number" ||
      session.expiresAt <= Date.now()
    ) {
      return null;
    }
    return { email: session.email };
  } catch {
    return null;
  }
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
  const key = signingKey();

  if (!configuredEmail || !configuredPassword || !key) {
    res.status(503).json({
      error: "Admin sign-in has not been configured on the server.",
    });
    return false;
  }

  if (
    !equalSecret(email.trim().toLowerCase(), configuredEmail) ||
    !equalSecret(password, configuredPassword)
  ) {
    return false;
  }

  clearCustomerSessionCookie(req, res);
  const token = encodeSession(
    configuredEmail,
    Date.now() + SESSION_TTL_MS,
    key,
  );

  res.cookie(SESSION_COOKIE, token, cookieOptions(req));
  return true;
}

export async function findAdminIdentity(
  req: Request,
): Promise<AdminIdentity | null> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token || typeof token !== "string") return null;

  const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const key = signingKey();
  if (!configuredEmail || !key) return null;

  const session = decodeSession(token, key);
  if (!session || session.email !== configuredEmail) return null;
  return { userId: null, email: configuredEmail };
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
  void req;
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
