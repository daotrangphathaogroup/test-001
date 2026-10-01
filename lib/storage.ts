import {
  SUPABASE_AVATAR_BUCKET,
  hasSupabaseConfig,
} from "@/lib/env";
import { getServiceClient } from "@/lib/supabase-client";

/** Kích thước tối đa của ảnh (đã được nén ở trình duyệt trước khi gửi lên). */
const MAX_DATA_URL_LENGTH = 700_000;

let bucketChecked = false;

async function ensureBucket(): Promise<void> {
  if (bucketChecked) return;
  const client = getServiceClient();
  const { error } = await client.storage.getBucket(SUPABASE_AVATAR_BUCKET);
  if (error) {
    const created = await client.storage.createBucket(SUPABASE_AVATAR_BUCKET, {
      public: true,
    });
    if (created.error && !/already exists/i.test(created.error.message)) {
      throw new Error(`Không tạo được bucket ảnh: ${created.error.message}`);
    }
  }
  bucketChecked = true;
}

/**
 * Lưu ảnh đại diện.
 * - Có Supabase Storage: upload lên bucket và trả về URL công khai.
 * - Chế độ demo offline: trả về chính data URL để lưu trong file JSON.
 */
export async function saveAvatar(
  memberCode: string,
  photo: string | null,
): Promise<string | null> {
  if (!photo) return null;
  if (!photo.startsWith("data:image/")) return photo; // đã là URL
  if (photo.length > MAX_DATA_URL_LENGTH) {
    throw new Error("Ảnh quá lớn, vui lòng chọn ảnh nhỏ hơn.");
  }
  if (!hasSupabaseConfig()) return photo; // lưu thẳng data URL (demo)

  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/.exec(photo);
  if (!match) throw new Error("Định dạng ảnh không hợp lệ.");

  const contentType = match[1] ?? "image/jpeg";
  const bytes = Buffer.from(match[2] ?? "", "base64");
  const extension = contentType.includes("png")
    ? "png"
    : contentType.includes("webp")
      ? "webp"
      : "jpg";
  const path = `${new Date().getFullYear()}/${memberCode}-${Date.now()}.${extension}`;

  await ensureBucket();
  const client = getServiceClient();
  const { error } = await client.storage
    .from(SUPABASE_AVATAR_BUCKET)
    .upload(path, bytes, { contentType, upsert: true });
  if (error) throw new Error(`Không tải được ảnh lên: ${error.message}`);

  return client.storage.from(SUPABASE_AVATAR_BUCKET).getPublicUrl(path).data
    .publicUrl;
}
