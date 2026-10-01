import type { Metadata } from "next";
import Link from "next/link";

import { AdminShell } from "@/components/admin-shell";
import { Alert, Badge, Card, inputClass, StatCard } from "@/components/primitives";
import { PrintButton } from "@/components/print-button";
import { getBackend } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { calcAge, formatDate, GENDER_LABEL } from "@/lib/utils";
import type { Registration, Student } from "@/lib/types";

export const metadata: Metadata = {
  title: "Danh sách học viên · Quản trị TLDD",
};

export const dynamic = "force-dynamic";

export default async function StudentsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const admin = await requireAdmin();
  const { q = "" } = await searchParams;
  const keyword = q.trim().toLowerCase();

  let students: Student[] = [];
  let registrations: Registration[] = [];
  let error: string | null = null;

  try {
    const backend = getBackend();
    const [stu, reg] = await Promise.all([
      backend.listStudents(),
      backend.listRegistrations(),
    ]);
    students = stu;
    registrations = reg;
  } catch (e) {
    error = e instanceof Error ? e.message : null;
  }

  const countByStudent = new Map<string, number>();
  for (const r of registrations) {
    if (r.status === "CANCELLED") continue;
    countByStudent.set(
      r.studentId,
      (countByStudent.get(r.studentId) ?? 0) + 1,
    );
  }

  const filtered = keyword
    ? students.filter(
        (s) =>
          s.fullName.toLowerCase().includes(keyword) ||
          s.memberCode.toLowerCase().includes(keyword) ||
          s.parentPhone.includes(keyword),
      )
    : students;

  const nam = students.filter((s) => s.gender === "NAM").length;
  const nu = students.length - nam;

  return (
    <AdminShell admin={admin}>
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <form method="get" className="flex items-center gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Tìm theo tên, mã số, SĐT…"
            className={`${inputClass} w-64`}
          />
          <button
            type="submit"
            className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-900"
          >
            Tìm
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          <PrintButton />
          <a
            href="/api/export?type=students"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Xuất CSV
          </a>
        </div>
      </div>

      {error ? <Alert tone="error" className="mb-5">{error}</Alert> : null}

      <div className="mb-5 grid gap-4 sm:grid-cols-3 no-print">
        <StatCard label="Tổng học viên" value={students.length} accent="sky" />
        <StatCard label="Nam" value={nam} accent="amber" />
        <StatCard label="Nữ" value={nu} accent="rose" />
      </div>

      <div className="mb-4 hidden text-center print:block">
        <h1 className="text-lg font-bold">DANH SÁCH HỌC VIÊN</h1>
        <p className="text-xs">Tổng: {students.length} học viên</p>
      </div>

      <Card className="overflow-x-auto p-0">
        {filtered.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">Không tìm thấy học viên.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-3">#</th>
                <th className="px-3 py-3">Mã số</th>
                <th className="px-3 py-3">Họ tên</th>
                <th className="px-3 py-3">GT</th>
                <th className="px-3 py-3">Tuổi</th>
                <th className="px-3 py-3">SĐT phụ huynh</th>
                <th className="px-3 py-3">Đã tham gia</th>
                <th className="px-3 py-3 no-print">Hồ sơ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((student, index) => {
                const age = calcAge(student.dob);
                return (
                  <tr key={student.id}>
                    <td className="px-3 py-3 text-slate-400">{index + 1}</td>
                    <td className="px-3 py-3 font-mono text-xs text-slate-600">
                      {student.memberCode}
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-900">
                      {student.fullName}
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={student.gender === "NAM" ? "sky" : "rose"}>
                        {GENDER_LABEL[student.gender]}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {age ?? "—"}
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {student.parentPhone}
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      {countByStudent.get(student.id) ?? 0} đợt
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500 no-print">
                      Tạo {formatDate(student.createdAt)}
                      {student.mustChangePassword ? " · chưa đổi MK" : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      <p className="no-print mt-4 text-xs text-slate-400">
        Không tìm thấy?{" "}
        <Link href="/dang-ky" className="underline">
          Đăng ký học viên mới
        </Link>
        .
      </p>
    </AdminShell>
  );
}
