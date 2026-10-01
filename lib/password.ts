import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Băm mật khẩu bằng scrypt (có sẵn trong Node, không cần thư viện ngoài).
 * Định dạng lưu: scrypt$N$r$p$salt(base64url)$hash(base64url)
 */
const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;
const MAXMEM = 64 * 1024 * 1024;

function scrypt(password: string, salt: Buffer): Buffer {
  return scryptSync(password.normalize("NFKC"), salt, KEYLEN, {
    N,
    r: R,
    p: P,
    maxmem: MAXMEM,
  });
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scrypt(password, salt);
  return [
    "scrypt",
    N,
    R,
    P,
    salt.toString("base64url"),
    hash.toString("base64url"),
  ].join("$");
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const salt = Buffer.from(parts[4] ?? "", "base64url");
  const expected = Buffer.from(parts[5] ?? "", "base64url");
  if (salt.length === 0 || expected.length === 0) return false;
  const actual = scrypt(password, salt);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

/** Mật khẩu mặc định = số điện thoại phụ huynh (theo yêu cầu nghiệp vụ). */
export function defaultPasswordFromPhone(phone: string): string {
  return phone.replace(/\s+/g, "");
}

export type PolicyResult = { ok: true } | { ok: false; message: string };

/**
 * Kiểm tra mật khẩu do người dùng tự đặt:
 * tối thiểu 8 ký tự và phải có ít nhất 2 nhóm ký tự
 * (chữ thường / chữ hoa / chữ số / ký tự đặc biệt).
 */
export function passwordPolicy(password: string): PolicyResult {
  if (password.length < 8) {
    return { ok: false, message: "Mật khẩu cần ít nhất 8 ký tự." };
  }
  const groups = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) =>
    re.test(password),
  ).length;
  if (groups < 2) {
    return {
      ok: false,
      message:
        "Mật khẩu cần gồm ít nhất 2 nhóm: chữ thường, chữ hoa, chữ số hoặc ký tự đặc biệt.",
    };
  }
  return { ok: true };
}
