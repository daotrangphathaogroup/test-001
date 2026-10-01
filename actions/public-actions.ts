"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getBackend } from "@/lib/db";
import { rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { hashPassword, passwordPolicy, verifyPassword } from "@/lib/password";
import {
  createSessionPayload,
  setSessionCookie,
  clearSessionCookie,
} from "@/lib/session";
import { loginSchema, registerSchema } from "@/lib/validation";

export interface PublicActionState {
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

async function clientKey(prefix: string): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";
  return `${prefix}:${ip}`;
}

/** Ném lỗi nếu vượt giới hạn thử (chống dò mật khẩu). */
function guard(key: string, limit = 8, windowMs = 5 * 60_000): void {
  const result = rateLimit(key, limit, windowMs);
  if (!result.allowed) {
    throw new Error(
      `Thử quá nhiều lần. Vui lòng thử lại sau ${result.retryAfterSeconds} giây.`,
    );
  }
}

function isRedirect(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (error as { digest?: string }).digest?.startsWith("NEXT_REDIRECT") === true;
}

export async function registerAction(
  _prev: PublicActionState,
  formData: FormData,
): Promise<PublicActionState> {
  const raw = {
    fullName: String(formData.get("fullName") ?? "").trim(),
    gender: String(formData.get("gender") ?? ""),
    dob: String(formData.get("dob") ?? ""),
    parentName: String(formData.get("parentName") ?? "").trim() || undefined,
    parentPhone: String(formData.get("parentPhone") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim() || undefined,
    healthNote: String(formData.get("healthNote") ?? "").trim() || undefined,
    photoUrl: String(formData.get("photoUrl") ?? "").trim() || undefined,
    password: String(formData.get("password") ?? ""),
    password2: String(formData.get("password2") ?? ""),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  }

  const policy = passwordPolicy(raw.password);
  if (!policy.ok) return { ok: false, fieldErrors: { password: policy.message } };
  if (raw.password !== raw.password2) {
    return { ok: false, fieldErrors: { password2: "Mật khẩu nhập lại không khớp." } };
  }

  try {
    guard(await clientKey("register"), 6, 15 * 60_000);
    const backend = getBackend();
    const student = await backend.createStudent({
      fullName: parsed.data.fullName,
      gender: parsed.data.gender,
      dob: parsed.data.dob,
      parentName: parsed.data.parentName,
      parentPhone: parsed.data.parentPhone,
      address: parsed.data.address,
      healthNote: parsed.data.healthNote,
      photoUrl: parsed.data.photoUrl,
      passwordHash: hashPassword(raw.password),
    });
    resetRateLimit(await clientKey("register"));
    revalidatePath("/", "layout");
    redirect(`/dang-ky/thanh-cong?code=${encodeURIComponent(student.memberCode)}`);
  } catch (error) {
    if (isRedirect(error)) throw error;
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Không đăng ký được. Vui lòng thử lại.",
    };
  }
}

export async function loginAction(
  _prev: PublicActionState,
  formData: FormData,
): Promise<PublicActionState> {
  const raw = {
    memberCode: String(formData.get("memberCode") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  }

  try {
    const key = await clientKey("login");
    guard(key, 8, 5 * 60_000);

    const backend = getBackend();
    const student = await backend.getStudentWithPasswordByMemberCode(
      parsed.data.memberCode,
    );
    const valid =
      student !== null && verifyPassword(raw.password, student.passwordHash);

    if (!valid) {
      return { ok: false, error: "Mã số học viên hoặc mật khẩu không đúng." };
    }

    resetRateLimit(key);
    await backend.touchStudentLogin(student.id);
    await setSessionCookie(
      createSessionPayload(
        student.id,
        "STUDENT",
        student.mustChangePassword ? true : undefined,
      ),
    );

    revalidatePath("/", "layout");
    redirect(
      student.mustChangePassword ? "/tai-khoan/doi-mat-khau" : "/tai-khoan",
    );
  } catch (error) {
    if (isRedirect(error)) throw error;
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Đăng nhập không thành công.",
    };
  }
}

export async function uploadAvatarAction(formData: FormData): Promise<{
  ok: boolean;
  url?: string;
  error?: string;
}> {
  try {
    const photo = String(formData.get("photo") ?? "");
    if (!photo) return { ok: false, error: "Vui lòng chọn ảnh." };
    const { saveAvatar } = await import("@/lib/storage");
    const url = await saveAvatar(`pending-${Date.now()}`, photo);
    return { ok: true, url: url ?? undefined };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Không tải được ảnh lên.",
    };
  }
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  revalidatePath("/", "layout");
  redirect("/dang-nhap");
}

/**
 * Đặt lại mật khẩu khi học viên quên: khớp mã số cá nhân + số điện thoại
 * phụ huynh → đặt lại mật khẩu tạm = số điện thoại, buộc đổi ở lần đăng nhập sau.
 */
export async function forgotPasswordAction(
  _prev: PublicActionState,
  formData: FormData,
): Promise<PublicActionState> {
  const raw = {
    memberCode: String(formData.get("memberCode") ?? "").trim(),
    parentPhone: String(formData.get("parentPhone") ?? "").replace(/[^\d]/g, ""),
  };

  if (!raw.memberCode || !/^0\d{9}$/.test(raw.parentPhone)) {
    return {
      ok: false,
      error: "Vui lòng nhập mã số cá nhân và số điện thoại phụ huynh (10 chữ số).",
    };
  }

  try {
    const key = await clientKey("forgot");
    guard(key, 5, 15 * 60_000);

    const backend = getBackend();
    const student = await backend.getStudentWithPasswordByMemberCode(
      raw.memberCode,
    );
    if (!student || student.parentPhone !== raw.parentPhone) {
      return {
        ok: false,
        error: "Mã số cá nhân hoặc số điện thoại phụ huynh không khớp.",
      };
    }

    const { defaultPasswordFromPhone } = await import("@/lib/password");
    const temporary = defaultPasswordFromPhone(student.parentPhone);
    await backend.updateStudentPassword(
      student.id,
      hashPassword(temporary),
      true,
    );
    await setSessionCookie(
      createSessionPayload(student.id, "STUDENT", true),
    );

    resetRateLimit(key);
    revalidatePath("/", "layout");
    redirect("/tai-khoan/doi-mat-khau?reset=1");
  } catch (error) {
    if (isRedirect(error)) throw error;
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Không đặt lại được mật khẩu.",
    };
  }
}
