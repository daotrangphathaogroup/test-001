/** Định dạng mã số cá nhân học viên: TLDD-<năm>-<4 chữ số>. */
export const MEMBER_CODE_PREFIX = "TLDD";

export function formatMemberCode(
  sequence: number,
  year: number = new Date().getFullYear(),
): string {
  return `${MEMBER_CODE_PREFIX}-${year}-${String(sequence).padStart(4, "0")}`;
}

export function isMemberCode(value: string): boolean {
  return /^TLDD-\d{4}-\d{4}$/.test(value.trim().toUpperCase());
}
