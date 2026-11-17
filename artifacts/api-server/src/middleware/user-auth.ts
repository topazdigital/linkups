import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import type { RowDataPacket } from "mysql2/promise";
import { executeSql, selectRows } from "../lib/mysql";

const SESSION_COOKIE = "linkups_user_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const PASSWORD_KEY_LENGTH = 64;

interface CustomerSessionRow extends RowDataPacket {
  userId: number | string;
  email: string;
  name: string;
  phone: string | null;
}

export interface CustomerIdentity {
  userId: number | string;
  email: string;
  name: string;
  phone: string | null;
}

declare global {
  namespace Express {
    interface Request {
      customerIdentity?: CustomerIdentity;
    }
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function derivePasswordKey(
  password: string,
  salt: Buffer,
  keyLength = PASSWORD_KEY_LENGTH,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keyLength, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(derivedKey);
    });
  });
}

export async function hashCustomerPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derivePasswordKey(password, salt);
  return `scrypt$v1$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export async function verifyCustomerPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [algorithm, version, saltText, keyText] = storedHash.split("$");
  if (algorithm !== "scrypt" || version !== "v1" || !saltText || !keyText) {
    return false;
  }

  try {
    const salt = Buffer.from(saltText, "base64url");
    const expected = Buffer.from(keyText, "base64url");
    if (salt.length !== 16 || expected.length !== PASSWORD_KEY_LENGTH) {
      return false;
    }
    const actual = await derivePasswordKey(password, salt, expected.length);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
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

export async function createCustomerSession(
  req: Request,
  res: Response,
  identity: CustomerIdentity,
): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await executeSql("DELETE FROM sessions WHERE expires_at <= NOW()");
  await executeSql(
    `INSERT INTO sessions (id, user_id, expires_at, token_hash)
     VALUES (?, ?, ?, ?)`,
    [randomUUID(), identity.userId, expiresAt, hashToken(token)],
  );
  res.cookie(SESSION_COOKIE, token, cookieOptions(req));
}

export async function findCustomerIdentity(
  req: Request,
): Promise<CustomerIdentity | null> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token || typeof token !== "string") return null;

  const sessions = await selectRows<CustomerSessionRow>(
    `SELECT s.user_id AS userId, u.email, u.name, u.phone
     FROM sessions s
     INNER JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ?
       AND s.expires_at > NOW()
       AND u.role = 'customer'
       AND u.is_active = TRUE
     LIMIT 1`,
    [hashToken(token)],
  );

  const session = sessions[0];
  return session
    ? {
        userId: session.userId,
        email: session.email,
        name: session.name,
        phone: session.phone,
      }
    : null;
}

export async function destroyCustomerSession(req: Request): Promise<void> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token || typeof token !== "string") return;
  await executeSql("DELETE FROM sessions WHERE token_hash = ?", [
    hashToken(token),
  ]);
}

export function clearCustomerSessionCookie(
  req: Request,
  res: Response,
): void {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || req.secure,
    sameSite: "strict",
    path: "/",
  });
}

export async function requireCustomer(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const identity = await findCustomerIdentity(req);
    if (!identity) {
      res.status(401).json({ error: "Customer sign-in is required." });
      return;
    }
    req.customerIdentity = identity;
    next();
  } catch (error) {
    next(error);
  }
}
