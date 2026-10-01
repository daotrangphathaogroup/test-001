import { createLocalBackend } from "@/lib/db/local";
import { createSupabaseBackend } from "@/lib/db/supabase";
import { hasSupabaseConfig, localDemoAllowed } from "@/lib/env";
import type { Backend } from "@/lib/types";

let cached: Backend | null = null;

/**
 * Trả về backend dữ liệu hiện hành:
 *  - Supabase (Postgres) khi đã cấu hình khoá.
 *  - Local (file .data/db.json) khi chưa cấu hình — chỉ cho phép chạy ở môi trường dev.
 */
export function getBackend(): Backend {
  if (cached) return cached;

  if (hasSupabaseConfig() && process.env.TLDD_FORCE_LOCAL !== "1") {
    cached = createSupabaseBackend();
    return cached;
  }

  if (!localDemoAllowed()) {
    throw new Error(
      "Chưa cấu hình Supabase. Hãy thêm NEXT_PUBLIC_SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY trong biến môi trường (Vercel → Settings → Environment Variables).",
    );
  }

  cached = createLocalBackend();
  return cached;
}

/** Đang chạy ở chế độ demo offline (chưa kết nối Supabase). */
export function isOfflineDemo(): boolean {
  return getBackend().name === "local";
}

/** Đã cấu hình Supabase chưa (dùng để hiện hướng dẫn cấu hình). */
export function isSupabaseConfigured(): boolean {
  return hasSupabaseConfig();
}
