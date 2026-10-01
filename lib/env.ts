/**
 * Cấu hình môi trường.
 *
 * Ứng dụng chạy ở 2 chế độ:
 *  1. SUPABASE  – khi có NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *  2. DEMO OFFLINE – khi chưa cấu hình Supabase; dữ liệu lưu tại .data/db.json
 *     (chỉ dùng cho môi trường phát triển, không dùng được trên Vercel serverless)
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
export const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
export const SUPABASE_AVATAR_BUCKET =
  process.env.SUPABASE_AVATAR_BUCKET?.trim() || "avatars";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";

export const HOTLINE = process.env.NEXT_PUBLIC_HOTLINE?.trim() || "0900 000 000";

export const ORG_NAME =
  process.env.NEXT_PUBLIC_ORG_NAME?.trim() || "Lớp Tâm Lí Đạo Đức";

/** Bí mật ký cookie phiên đăng nhập. */
export const AUTH_SECRET =
  process.env.AUTH_SECRET?.trim() || "tldd-demo-secret-doi-truoc-khi-len-production";

/** Bí mật mặc định chỉ được dùng ở môi trường phát triển. */
export const USING_DEFAULT_AUTH_SECRET = !process.env.AUTH_SECRET?.trim();

export const IS_PRODUCTION = process.env.NODE_ENV === "production";

/** Có đủ khoá Supabase hay chưa. */
export function hasSupabaseConfig(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

/** Chế độ DEMO OFFLINE chỉ cho phép khi phát triển hoặc khi bật cờ TLDD_LOCAL_DEMO=1. */
export function localDemoAllowed(): boolean {
  return !IS_PRODUCTION || process.env.TLDD_LOCAL_DEMO === "1";
}
