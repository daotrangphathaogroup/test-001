import type { Metadata } from "next";
import Link from "next/link";

import { AdminShell } from "@/components/admin-shell";
import { Alert, Badge, Card, StatCard } from "@/components/primitives";
import { PrintButton } from "@/components/print-button";
import { updateRegistrationStatusAction } from "@/actions/admin-actions";
import { getBackend } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { computeSessionStats } from "@/lib/stats";
import {
  REGISTRATION_STATUS_LABEL,
  cn,
  describeSession,
  formatDate,
} from "@/lib/utils";
import type { ClassSession, Registration, Student } from "@/lib/types";

export const metadata: Metadata = {
  title: "Quản lý đăng ký · Quản trị TLDD",
};

export const dynamic = "force-dynamic";

const STATUS_OPTIONS = [
  "REGISTERED",
  "ATTENDED",
  "ABSENT",
  "CANCELLED",
] as const;

export default async function RegistrationsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>;
}) {
  const admin = await requireAdmin();
  const { s } = await searchParams;

  let sessions: ClassSession[] = [];
  let students: Student[] = [];
  let registrations: Registration[] = [];
  let error: string | null = null;

  try {
    const backend = getBackend();
    const [sess, stu, reg] = await Promise.all([
      backend.listSessions(),
      backend.listStudents(),
      backend.listRegistrations(),
    ]);
    sessions = [...sess].sort((a, b) => b.startDate.localeCompare(a.startDate));
    students = stu;
    registrations = reg;
  } catch (e) {
    error = e instanceof Error ? e.message : null;
  }

  const selected = sessions.find((x) => x.id === s) ?? sessions[0] ?? null;
  const rows = selected
    ? registrations
        .filter((r) => r.sessionId === selected.id)
        .sort((a, b) => a.registeredAt.localeCompare(b.registeredAt))
    : [];

  const studentById = new Map(students.map((st) => [st.id, st]));
  const stats = computeSessionStats(sessions, registrations, students).find(
    (x) => x.sessionId === selected?.id,
  );

  return (
    <AdminShell admin={admin}>
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {sessions.map((session) => (
            <Link
              key={session.id}
              href={`/admin/dang-ky?s=${session.id}`}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm font-medium transition",
                session.id === selected?.id
                  ? "border-sky-600 bg-sky-600 text-white"
                  : "border-slate-300 text-slate-700 hover:bg-slate-50",
              )}
            >
              {session.name}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <PrintButton />
          <a
            href={`/api/export?type=registrations&session=${selected?.id ?? ""}`}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Xuất CSV
          </a>
        </div>
      </div>

      {error ? <Alert tone="error" className="mb-5">{error}</Alert> : null}

      {selected ? (
        <>
          <div className="mb-5 hidden text-center print:block">
            <h1 className="text-lg font-bold">
              DANH SÁCH ĐĂNG KÝ — {selected.name}
            </h1>
            <p className="text-xs">
              Ngày bắt đầu: {formatDate(selected.startDate)} · Tổng:{" "}
              {rows.length} học viên
            </p>
          </div>

          {stats ? (
            <div className="no-print mb-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <StatCard label="Tổng đăng ký" value={stats.total} accent="sky" />
              <StatCard label="Nam" value={stats.nam} accent="amber" />
              <StatCard label="Nữ" value={stats.nu} accent="rose" />
              <StatCard label="Học mới" value={stats.moi} accent="violet" />
              <StatCard label="Học lại" value={stats.taiDangKy} accent="slate" />
            </div>
          ) : null}

          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-600 no-print">
            <Badge tone={selected.registrationOpen ? "green" : "slate"}>
              {describeSession(selected)}
            </Badge>
            {selected.location ? <span>{selected.location}</span> : null}
            {selected.classTime ? <span>{selected.classTime}</span> : null}
          </div>

          <Card className="overflow-x-auto p-0">
            {rows.length === 0 ? (
              <p className="p-5 text-sm text-slate-500">
                Chưa có ai đăng ký đợt này.
              </p>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-3">#</th>
                    <th className="px-3 py-3">Mã số</th>
                    <th className="px-3 py-3">Họ tên</th>
                    <th className="px-3 py-3">GT</th>
                    <th className="px-3 py-3">Ngày sinh</th>
                    <th className="px-3 py-3">SĐT phụ huynh</th>
                    <th className="px-3 py-3">Đăng ký lúc</th>
                    <th className="px-3 py-3 no-print">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, index) => {
                    const student = studentById.get(row.studentId);
                    if (!student) return null;
                    return (
                      <tr key={row.id}>
                        <td className="px-3 py-3 text-slate-400">{index + 1}</td>
                        <td className="px-3 py-3 font-mono text-xs text-slate-600">
                          {student.memberCode}
                        </td>
                        <td className="px-3 py-3 font-medium text-slate-900">
                          {student.fullName}
                        </td>
                        <td className="px-3 py-3 text-slate-600">
                          {student.gender === "NAM" ? "Nam" : "Nữ"}
                        </td>
                        <td className="px-3 py-3 text-slate-600">
                          {formatDate(student.dob)}
                        </td>
                        <td className="px-3 py-3 text-slate-600">
                          {student.parentPhone}
                        </td>
                        <td className="px-3 py-3 text-slate-500">
                          {formatDate(row.registeredAt)}
                        </td>
                        <td className="px-3 py-3 no-print">
                          <form
                            action={updateRegistrationStatusAction}
                            className="flex items-center gap-2"
                          >
                            <input
                              type="hidden"
                              name="registrationId"
                              value={row.id}
                            />
                            <select
                              name="status"
                              defaultValue={row.status}
                              className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                            >
                              {STATUS_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                  {REGISTRATION_STATUS_LABEL[option]}
                                </option>
                              ))}
                            </select>
                            <button
                              type="submit"
                              className="rounded-md bg-slate-800 px-2 py-1 text-xs font-medium text-white hover:bg-slate-900"
                            >
                              Lưu
                            </button>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>
        </>
      ) : (
        <Alert tone="info">
          Chưa có đợt học nào. Hãy{" "}
          <Link href="/admin/dot-hoc" className="font-semibold underline">
            tạo đợt học
          </Link>{" "}
          trước.
        </Alert>
      )}
    </AdminShell>
  );
}
