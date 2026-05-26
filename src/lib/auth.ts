import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

// ==================== Types ====================

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: "OWNER" | "ADMIN" | "EMPLOYEE";
  expiresAt: Date;
  [key: string]: unknown;
}

// ==================== Constants ====================

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET || "fallback-secret-change-me",
);
const SESSION_COOKIE = "ab_session";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// ==================== Password helpers ====================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hashed: string,
): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}

// ==================== Session (JWT) ====================

export async function createSession(user: {
  id: string;
  email: string;
  name: string;
  role: "OWNER" | "ADMIN" | "EMPLOYEE";
}) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  const payload: SessionPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    expiresAt,
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify<SessionPayload>(token, secret);
    // Check expiry manually (jose already does, but double-check)
    if (new Date(payload.expiresAt) < new Date()) {
      await destroySession();
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

// ==================== Role guards ====================

export async function requireAuth() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireRole(
  allowedRoles: ("OWNER" | "ADMIN" | "EMPLOYEE")[],
) {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.role)) {
    // Redirect to appropriate dashboard based on role
    if (session.role === "EMPLOYEE") redirect("/employee");
    if (session.role === "ADMIN") redirect("/admin");
    redirect("/");
  }
  return session;
}

// ==================== Authentication action helpers ====================

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Invalid email or password");

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) throw new Error("Invalid email or password");

  await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  // Redirect based on role
  if (user.role === "EMPLOYEE") return "/employee";
  return "/";
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
