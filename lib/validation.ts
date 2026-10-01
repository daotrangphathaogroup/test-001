import { z } from "zod";

export const GENDER_VALUES = ["NAM", "NU"] as const;
export const REGISTRATION_STATUS_VALUES = [
  "REGISTERED",
  "ATTENDED",
  "ABSENT",
  "CANCELLED",
] as const;
export const SESSION_STATUS_VALUES = ["UPCOMING", "ONGOING", "CLOSED"] as const;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Không được vượt quá ${max} ký tự`)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null));

const dateString = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ (định dạng yyyy-mm-dd)");

const phone = z
  .string()
  .trim()
  .transform((value) => value.replace(/[^\d]/g, ""))
  .refine((value) => /^0\d{9}$/.test(value), {
    message: "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0",
  });

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Vui lòng nhập họ và tên")
    .max(80, "Họ tên quá dài"),
  gender: z.enum(GENDER_VALUES, { message: "Vui lòng chọn giới tính" }),
  dob: dateString,
  parentName: optionalText(80),
  parentPhone: phone,
  address: optionalText(200),
  healthNote: optionalText(300),
  photoUrl: z.string().optional().transform((v) => v ?? null),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Vui lòng nhập họ và tên").max(80),
  gender: z.enum(GENDER_VALUES, { message: "Vui lòng chọn giới tính" }),
  dob: dateString,
  parentName: optionalText(80),
  parentPhone: phone,
  address: optionalText(200),
  healthNote: optionalText(300),
  photoUrl: z.string().optional().transform((v) => v ?? null),
});

export const loginSchema = z.object({
  memberCode: z.string().trim().min(3, "Vui lòng nhập mã số cá nhân"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

export const adminLoginSchema = z.object({
  username: z.string().trim().min(3, "Vui lòng nhập tên đăng nhập"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: z.string().min(6, "Mật khẩu mới tối thiểu 6 ký tự"),
    confirmPassword: z.string().min(6, "Vui lòng xác nhận mật khẩu mới"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Xác nhận mật khẩu không khớp",
  });

export const lookupSchema = z.object({
  memberCode: z.string().trim().min(3, "Vui lòng nhập mã số học viên"),
  dob: dateString,
});

export const sessionSchema = z.object({
  name: z.string().trim().min(3, "Vui lòng nhập tên khoá học").max(80),
  startDate: dateString,
  classTime: optionalText(80),
  location: optionalText(120),
  content: optionalText(500),
  leaderName: optionalText(80),
  status: z.enum(SESSION_STATUS_VALUES),
  registrationOpen: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
    .optional()
    .transform((value) => value === "on" || value === "true"),
});

export const adminAccountSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Tên đăng nhập tối thiểu 3 ký tự")
    .max(40)
    .regex(/^[a-zA-Z0-9._-]+$/, "Chỉ dùng chữ, số, dấu chấm, gạch ngang"),
  fullName: optionalText(80),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  role: z.enum(["SECRETARY", "SUPERADMIN"]),
});

export function failedMessage(error: z.ZodError): {
  message: string;
  fieldErrors: Record<string, string>;
} {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "form";
    if (!fieldErrors[path]) fieldErrors[path] = issue.message;
  }
  const first = error.issues[0]?.message ?? "Dữ liệu không hợp lệ";
  return { message: first, fieldErrors };
}

/** Đọc giá trị chuỗi từ FormData. */
export function str(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}
