import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getBackend } from "@/lib/db";
import { AUTH_SECRET } from "@/lib/env";
import type { AdminUser, Student } from "@/lib/types";

export const SESSION_COOKIE = "tldd_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 ngày

export type SessionRole = "STUDENT" | "SECRETARY" | "SUPERADMIN";

export interface SessionPayload {
  sub: string;
  role: SessionRole;
  /** Bắt buộc đổi mật khẩu ở lần đăng nhập đầu. */
  mustChange?: boolean;
  iat: number;
  exp: number;
}

function base64url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function sign(payload: SessionPayload): string {
  const body = base64url(JSON.stringify(payload));
  const signature = createHmac("sha256", AUTH_SECRET)
    .update(body)
    .digest("base64url");
  return `${body}.${signature}`;
}

function verify(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = createHmac("sha256", AUTH_SECRET)
    .update(body)
    .digest("base64url");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as SessionPayload;
    if (!payload.sub || !payload.role) return null;
    if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function createSessionPayload(
  sub: string,
  role: SessionRole,
  mustChange?: boolean,
): SessionPayload {
  const now = Math.floor(Date.now() / 1000);
  return {
    sub,
    role,
    mustChange,
    iat: now,
    exp: now + MAX_AGE_SECONDS,
  };
}

/** Ghi cookie phiên — chỉ gọi được trong Server Action / Route Handler. */
export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, sign(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionPayload(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verify(store.get(SESSION_COOKIE)?.value);
}

export async function getCurrentStudent(): Promise<Student | null> {
  const payload = await getSessionPayload();
  if (!payload || payload.role !== "STUDENT") return null;
  return getBackend().getStudentById(payload.sub);
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const payload = await getSessionPayload();
  if (!payload || payload.role === "STUDENT") return null;
  return getBackend().getAdminById(payload.sub);
}

export async function requireStudent(): Promise<Student> {
  const student = await getCurrentStudent();
  if (!student) redirect("/dang-nhap");
  return student;
}

/**
 * Yêu cầu đăng nhập VÀ đã đổi mật khẩu mặc định.
 * Dùng cho các trang của học viên (trừ trang đổi mật khẩu).
 */
export async function requireStudentReady(): Promise<Student> {
  const student = await requireStudent();
  if (student.mustChangePassword) redirect("/tai-khoan/doi-mat-khau");
  return student;
}

export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function requireSuperAdmin(): Promise<AdminUser> {
  const admin = await requireAdmin();
  if (admin.role !== "SUPERADMIN") redirect("/admin");
  return admin;
}
