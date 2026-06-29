import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "biji-dev-secret-change-in-production-2026"
);
const COOKIE_NAME = "biji-token";
const TOKEN_EXPIRE = "7d";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

// ---- 密码 ----
export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 12);
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

// ---- JWT ----
export async function signToken(user: AuthUser): Promise<string> {
  return new SignJWT({ sub: user.id, email: user.email, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(TOKEN_EXPIRE)
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

// ---- Cookie 操作 ----
export async function setAuthCookie(token: string) {
  const ck = await cookies();
  ck.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function getAuthCookie(): Promise<string | undefined> {
  const ck = await cookies();
  return ck.get(COOKIE_NAME)?.value;
}

export async function clearAuthCookie() {
  const ck = await cookies();
  ck.delete(COOKIE_NAME);
}

// ---- 获取当前用户 ----
export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getAuthCookie();
  if (!token) return null;
  return verifyToken(token);
}
