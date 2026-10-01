"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getBackend } from "@/lib/db";
import { rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { hashPassword, passwordPolicy, verifyPassword } from "@/lib/password";
import {
  clearSessionCookie,
  createSessionPayload,
  requireAdmin,
  requireSuperAdmin,
  setSessionCookie,
} from "@/lib/session";
import {
  adminAccountSchema,
  adminLoginSchema,
  sessionSchema,
} from "@/lib/validation";
import type { RegistrationStatus, SessionStatus } from "@/lib/types";

export interface AdminActionState {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

function toFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString() ?? "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

function isRedirect(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (error as { digest?: string }).digest?.startsWith("NEXT_REDIRECT") === true;
}

function guard(key: string, limit = 8, windowMs = 5 * 60_000): void {
  const result = rateLimit(key, limit, windowMs);
  if (!result.allowed) {
    throw new Error(
      `Thử quá nhiều lần. Vui lòng thử lại sau ${result.retryAfterSeconds} giây.`,
    );
  }
}

export async function adminLoginAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const raw = {
    username: String(formData.get("username") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = adminLoginSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };

  try {
    const key = `admin-login:${parsed.data.username}`;
    guard(key);

    const backend = getBackend();
    const admin = await backend.getAdminByUsername(parsed.data.username);
    if (!admin || !verifyPassword(raw.password, admin.passwordHash)) {
      return { ok: false, error: "Tên đăng nhập hoặc mật khẩu không đúng." };
    }

    resetRateLimit(key);
    await setSessionCookie(createSessionPayload(admin.id, admin.role));
    revalidatePath("/", "layout");
    redirect("/admin");
  } catch (error) {
    if (isRedirect(error)) throw error;
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Đăng nhập thất bại.",
    };
  }
}

export async function adminLogoutAction(): Promise<void> {
  await clearSessionCookie();
  revalidatePath("/", "layout");
  redirect("/admin/login");
}

/**
 * Tạo tài khoản thư ký đầu tiên — chỉ chạy khi bảng admin_users còn trống
 * (điều kiện bảo mật; nếu đã có tài khoản sẽ bị từ chối).
 */
export async function createFirstAdminAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const raw = {
    username: String(formData.get("username") ?? "").trim(),
    fullName: String(formData.get("fullName") ?? "").trim() || undefined,
    password: String(formData.get("password") ?? ""),
    password2: String(formData.get("password2") ?? ""),
    role: "SUPERADMIN",
  };

  const parsed = adminAccountSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };

  const policy = passwordPolicy(raw.password);
  if (!policy.ok) return { ok: false, fieldErrors: { password: policy.message } };
  if (raw.password !== raw.password2) {
    return { ok: false, fieldErrors: { password2: "Xác nhận mật khẩu không khớp." } };
  }

  try {
    const backend = getBackend();
    if ((await backend.countAdmins()) > 0) {
      return { ok: false, error: "Đã có tài khoản thư ký. Hãy đăng nhập." };
    }
    await backend.createAdmin({
      username: parsed.data.username,
      fullName: parsed.data.fullName ?? null,
      passwordHash: hashPassword(raw.password),
      role: "SUPERADMIN",
    });
    revalidatePath("/", "layout");
    redirect("/admin/login");
  } catch (error) {
    if (isRedirect(error)) throw error;
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Không tạo được tài khoản.",
    };
  }
}

export async function saveSessionAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const raw = {
    name: String(formData.get("name") ?? "").trim(),
    startDate: String(formData.get("startDate") ?? "").trim(),
    classTime: String(formData.get("classTime") ?? "").trim() || undefined,
    location: String(formData.get("location") ?? "").trim() || undefined,
    content: String(formData.get("content") ?? "").trim() || undefined,
    leaderName: String(formData.get("leaderName") ?? "").trim() || undefined,
    status: String(formData.get("status") ?? "UPCOMING"),
    registrationOpen: String(formData.get("registrationOpen") ?? ""),
  };

  const parsed = sessionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };

  try {
    const backend = getBackend();
    const payload = {
      name: parsed.data.name,
      startDate: parsed.data.startDate,
      classTime: parsed.data.classTime,
      location: parsed.data.location,
      content: parsed.data.content,
      leaderName: parsed.data.leaderName,
      status: parsed.data.status as SessionStatus,
      registrationOpen: parsed.data.registrationOpen,
    };

    if (id) {
      await backend.updateSession(id, payload);
    } else {
      await backend.createSession(payload);
    }

    revalidatePath("/admin/dot-hoc");
    revalidatePath("/", "layout");
    redirect("/admin/dot-hoc");
  } catch (error) {
    if (isRedirect(error)) throw error;
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Không lưu được đợt học.",
    };
  }
}

export async function deleteSessionAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) {
    const backend = getBackend();
    await backend.deleteSession(id);
    revalidatePath("/admin/dot-hoc");
    revalidatePath("/", "layout");
  }
}

export async function toggleRegistrationOpenAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const next = String(formData.get("next") ?? "") === "true";
  if (id) {
    const backend = getBackend();
    await backend.updateSession(id, { registrationOpen: next });
    revalidatePath("/admin/dot-hoc");
    revalidatePath("/dang-ky-tham-gia");
  }
}

export async function updateRegistrationStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("registrationId") ?? "");
  const status = String(formData.get("status") ?? "") as RegistrationStatus;
  const allowed: RegistrationStatus[] = ["REGISTERED", "ATTENDED", "ABSENT", "CANCELLED"];
  if (id && allowed.includes(status)) {
    const backend = getBackend();
    await backend.updateRegistrationStatus(id, status);
    revalidatePath("/admin/dang-ky");
    revalidatePath("/", "layout");
  }
}

export async function createAdminAccountAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireSuperAdmin();

  const raw = {
    username: String(formData.get("username") ?? "").trim(),
    fullName: String(formData.get("fullName") ?? "").trim() || undefined,
    password: String(formData.get("password") ?? ""),
    role: String(formData.get("role") ?? "SECRETARY"),
  };

  const parsed = adminAccountSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };

  const policy = passwordPolicy(raw.password);
  if (!policy.ok) return { ok: false, fieldErrors: { password: policy.message } };

  try {
    const backend = getBackend();
    await backend.createAdmin({
      username: parsed.data.username,
      fullName: parsed.data.fullName ?? null,
      passwordHash: hashPassword(raw.password),
      role: parsed.data.role as "SECRETARY" | "SUPERADMIN",
    });
    revalidatePath("/admin/tai-khoan");
    return { ok: true };
  } catch (error) {
    if (isRedirect(error)) throw error;
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Không tạo được tài khoản.",
    };
  }
}

export async function resetAdminPasswordAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireSuperAdmin();
  const adminId = String(formData.get("adminId") ?? "");
  const password = String(formData.get("password") ?? "");
  const policy = passwordPolicy(password);
  if (!policy.ok) return { ok: false, fieldErrors: { password: policy.message } };

  try {
    const backend = getBackend();
    await backend.updateAdminPassword(adminId, hashPassword(password));
    revalidatePath("/admin/tai-khoan");
    return { ok: true };
  } catch (error) {
    if (isRedirect(error)) throw error;
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Không đổi được mật khẩu.",
    };
  }
}

export async function deleteAdminAccountAction(formData: FormData): Promise<void> {
  const current = await requireSuperAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id || id === current.id) return;
  const backend = getBackend();
  await backend.deleteAdmin(id);
  revalidatePath("/admin/tai-khoan");
}
