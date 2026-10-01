import type { Metadata } from "next";
import Link from "next/link";

import { AdminShell } from "@/components/admin-shell";
import { Alert, Badge, Card, StatCard } from "@/components/primitives";
import { getBackend } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { computeSessionStats, pickActiveSession } from "@/lib/stats";
import { formatDate, SESSION_STATUS_LABEL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Tổng quan · Quản trị TLDD",
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();

  let stats: Awaited<ReturnType<typeof computeSessionStats>> = [];
  let totalStudents = 0;
  let activeSession = null;
  let error: string | null = null;

  try {
    const backend = getBackend();
    const [sessions, registrations, students] = await Promise.all([
      backend.listSessions(),
      backend.listRegistrations(),
      backend.listStudents(),
    ]);
    stats = computeSessionStats(sessions, registrations, students);
    totalStudents = students.length;
    activeSession = pickActiveSession(sessions);
  } catch (e) {
    error = e instanceof Error ? e.message : null;
  }

  const latest = stats[stats.length - 1];
  const allTimeTotal = stats.reduce((sum, s) => sum + s.total, 0);

  return (
    <AdminShell admin={admin}>
      {error ? <Alert tone="error" className="mb-5">{error}</Alert> : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Học viên đã đăng ký" value={totalStudents} accent="sky" />
        <StatCard label="Tổng lượt tham gia" value={allTimeTotal} accent="violet" />
        <StatCard
          label="Lượt Nam"
          value={stats.reduce((sum, s) => sum + s.nam, 0)}
          accent="amber"
        />
        <StatCard
          label="Lượt Nữ"
          value={stats.reduce((sum, s) => sum + s.nu, 0)}
          accent="rose"
        />
      </div>

      {activeSession ? (
        <Alert tone="success" className="mb-6">
          Đang mở đăng ký: <strong>{activeSession.name}</strong> · bắt đầu{" "}
          {formatDate(activeSession.startDate)}.{" "}
          <Link href="/admin/dot-hoc" className="font-semibold underline">
            Quản lý đợt học
          </Link>
        </Alert>
      ) : (
        <Alert tone="warning" className="mb-6">
          Hiện chưa mở đăng ký đợt nào.{" "}
          <Link href="/admin/dot-hoc" className="font-semibold underline">
            Tạo / mở đợt học
          </Link>
        </Alert>
      )}

      <Card className="overflow-x-auto p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Thống kê theo đợt học
          </h2>
          <Link
            href="/admin/dang-ky"
            className="text-xs font-medium text-sky-600 hover:underline"
          >
            Quản lý đăng ký →
          </Link>
        </div>

        {stats.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-slate-500">
            Chưa có đợt học nào.
          </p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Đợt học</th>
                <th className="px-4 py-3">Ngày</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Tổng</th>
                <th className="px-4 py-3 text-right">Nam</th>
                <th className="px-4 py-3 text-right">Nữ</th>
                <th className="px-4 py-3 text-right">Mới</th>
                <th className="px-4 py-3 text-right">Tái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.map((row) => (
                <tr key={row.sessionId}>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {row.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(row.startDate)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      tone={row.registrationOpen ? "green" : "slate"}
                    >
                      {row.registrationOpen
                        ? "Đang mở"
                        : SESSION_STATUS_LABEL[row.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    {row.total}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">{row.nam}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{row.nu}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{row.moi}</td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {row.taiDangKy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {latest ? (
        <p className="mt-4 text-xs text-slate-400">
          Đợt gần nhất: {latest.name} · {latest.total} lượt · Mới {latest.moi} /
          Tái {latest.taiDangKy}
        </p>
      ) : null}
    </AdminShell>
  );
}
