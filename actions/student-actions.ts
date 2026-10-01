"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getBackend } from "@/lib/db";
import { hashPassword, passwordPolicy, verifyPassword } from "@/lib/password";
import {
  getSessionPayload,
  requireStudent,
  setSessionCookie,
  createSessionPayload,
} from "@/lib/session";
import { changePasswordSchema, profileSchema } from "@/lib/validation";

export interface StudentActionState {
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

export async function updateProfileAction(
  _prev: StudentActionState,
  formData: FormData,
): Promise<StudentActionState> {
  const student = await requireStudent();

  const raw = {
    fullName: String(formData.get("fullName") ?? "").trim(),
    gender: String(formData.get("gender") ?? ""),
    dob: String(formData.get("dob") ?? ""),
    parentName: String(formData.get("parentName") ?? "").trim() || undefined,
    parentPhone: String(formData.get("parentPhone") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim() || undefined,
    healthNote: String(formData.get("healthNote") ?? "").trim() || undefined,
    photoUrl: String(formData.get("photoUrl") ?? "").trim() || undefined,
  };

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  }

  try {
    const backend = getBackend();
    const patch = { ...parsed.data };

    if (patch.photoUrl?.startsWith("data:image/")) {
      const { saveAvatar } = await import("@/lib/storage");
      patch.photoUrl = await saveAvatar(student.memberCode, patch.photoUrl);
    }

    await backend.updateStudent(student.id, patch);
    revalidatePath("/tai-khoan");
    return { ok: true };
  } catch (error) {
    if (isRedirect(error)) throw error;
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Không lưu được thay đổi.",
    };
  }
}

export async function changePasswordAction(
  _prev: StudentActionState,
  formData: FormData,
): Promise<StudentActionState> {
  const student = await requireStudent();

  const raw = {
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };

  const parsed = changePasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  }

  const policy = passwordPolicy(raw.newPassword);
  if (!policy.ok) {
    return { ok: false, fieldErrors: { newPassword: policy.message } };
  }

  try {
    const backend = getBackend();
    const full = await backend.getStudentWithPasswordByMemberCode(
      student.memberCode,
    );
    if (!full || !verifyPassword(raw.currentPassword, full.passwordHash)) {
      return {
        ok: false,
        fieldErrors: { currentPassword: "Mật khẩu hiện tại không đúng." },
      };
    }

    await backend.updateStudentPassword(
      student.id,
      hashPassword(raw.newPassword),
      false,
    );

    const payload = await getSessionPayload();
    if (payload) {
      await setSessionCookie(createSessionPayload(student.id, "STUDENT"));
    }

    revalidatePath("/", "layout");
    redirect("/tai-khoan");
  } catch (error) {
    if (isRedirect(error)) throw error;
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Không đổi được mật khẩu.",
    };
  }
}

function snapshotOf(s: {
  memberCode: string;
  fullName: string;
  gender: string;
  dob: string;
  parentName: string | null;
  parentPhone: string;
  address: string | null;
  healthNote: string | null;
}): Record<string, string> {
  return {
    "Mã số": s.memberCode,
    "Họ và tên": s.fullName,
    "Giới tính": s.gender,
    "Ngày sinh": s.dob,
    "Phụ huynh": s.parentName ?? "",
    "SĐT phụ huynh": s.parentPhone,
    "Địa chỉ": s.address ?? "",
    "Sức khoẻ": s.healthNote ?? "",
  };
}

export async function enrollAction(
  _prev: StudentActionState,
  formData: FormData,
): Promise<StudentActionState> {
  const student = await requireStudent();
  const sessionId = String(formData.get("sessionId") ?? "");

  try {
    const backend = getBackend();
    const session = await backend.getSessionById(sessionId);
    if (!session) {
      return { ok: false, error: "Không tìm thấy đợt học." };
    }
    if (!session.registrationOpen) {
      return { ok: false, error: "Đợt học này chưa mở đăng ký." };
    }
    if (session.status === "CLOSED") {
      return { ok: false, error: "Đợt học đã kết thúc." };
    }

    const existing = await backend.getRegistration(student.id, session.id);
    if (existing && existing.status !== "CANCELLED") {
      return { ok: false, error: "Bạn đã đăng ký đợt học này rồi." };
    }

    const full = await backend.getStudentWithPasswordByMemberCode(
      student.memberCode,
    );

    if (existing && existing.status === "CANCELLED") {
      await backend.updateRegistrationStatus(existing.id, "REGISTERED");
    } else {
      await backend.createRegistration(
        student.id,
        session.id,
        snapshotOf(full ?? student),
      );
    }

    revalidatePath("/dang-ky-tham-gia");
    revalidatePath("/lich-su");
    return { ok: true };
  } catch (error) {
    if (isRedirect(error)) throw error;
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Không đăng ký được.",
    };
  }
}

export async function cancelEnrollAction(
  _prev: StudentActionState,
  formData: FormData,
): Promise<StudentActionState> {
  const student = await requireStudent();
  const sessionId = String(formData.get("sessionId") ?? "");

  try {
    const backend = getBackend();
    const registration = await backend.getRegistration(student.id, sessionId);
    if (!registration) return { ok: false, error: "Chưa có phiếu đăng ký." };

    const session = await backend.getSessionById(sessionId);
    if (session && session.status !== "UPCOMING") {
      return { ok: false, error: "Đợt học đã bắt đầu, không thể huỷ." };
    }

    await backend.deleteRegistration(registration.id);
    revalidatePath("/dang-ky-tham-gia");
    revalidatePath("/lich-su");
    return { ok: true };
  } catch (error) {
    if (isRedirect(error)) throw error;
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Không huỷ được đăng ký.",
    };
  }
}
