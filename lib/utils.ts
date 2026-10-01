import type { ClassSession, Gender, RegistrationStatus, SessionStatus } from "@/lib/types";

/** Ghép class name có điều kiện (thay cho thư viện clsx). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function normalizeMemberCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

export function normalizePhone(input: string): string {
  return input.replace(/[^\d+]/g, "");
}

const DATE_FMT = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
});

const DATETIME_FMT = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Ho_Chi_Minh",
});

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return DATE_FMT.format(d);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return DATETIME_FMT.format(d);
}

export function calcAge(dob: string): number | null {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age;
}

export const GENDER_LABEL: Record<Gender, string> = {
  NAM: "Nam",
  NU: "Nữ",
};

export const SESSION_STATUS_LABEL: Record<SessionStatus, string> = {
  UPCOMING: "Sắp diễn ra",
  ONGOING: "Đang diễn ra",
  CLOSED: "Đã kết thúc",
};

export const REGISTRATION_STATUS_LABEL: Record<RegistrationStatus, string> = {
  REGISTERED: "Đã đăng ký",
  ATTENDED: "Có mặt",
  ABSENT: "Vắng",
  CANCELLED: "Đã huỷ",
};

/** Nhãn hiển thị dùng chung cho trạng thái đợt học. */
export function describeSession(session: ClassSession): string {
  if (session.registrationOpen && session.status !== "CLOSED") {
    return "Đang mở đăng ký";
  }
  return SESSION_STATUS_LABEL[session.status];
}

export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

/** Sinh CSV kèm BOM để Excel đọc đúng tiếng Việt. */
export function toCsv(rows: Array<Array<string | number | null | undefined>>): string {
  const escape = (value: string | number | null | undefined) => {
    const s = value === null || value === undefined ? "" : String(value);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "\uFEFF" + rows.map((row) => row.map(escape).join(",")).join("\r\n");
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
