import type { Metadata } from "next";

import { AdminShell } from "@/components/admin-shell";
import { Alert, Badge, Card } from "@/components/primitives";
import { SessionForm } from "@/components/session-form";
import {
  deleteSessionAction,
  toggleRegistrationOpenAction,
} from "@/actions/admin-actions";
import { getBackend } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { computeSessionStats } from "@/lib/stats";
import { describeSession, formatDate } from "@/lib/utils";
import type { ClassSession } from "@/lib/types";

export const metadata: Metadata = {
  title: "Quản lý đợt học · Quản trị TLDD",
};

export const dynamic = "force-dynamic";

export default async function SessionsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const admin = await requireAdmin();
  const { edit } = await searchParams;

  let sessions: ClassSession[] = [];
  let stats: Awaited<ReturnType<typeof computeSessionStats>> = [];
  let error: string | null = null;

  try {
    const backend = getBackend();
    const [s, r, st] = await Promise.all([
      backend.listSessions(),
      backend.listRegistrations(),
      backend.listStudents(),
    ]);
    sessions = [...s].sort((a, b) => b.startDate.localeCompare(a.startDate));
    stats = computeSessionStats(s, r, st);
  } catch (e) {
    error = e instanceof Error ? e.message : null;
  }

  const editing = edit ? sessions.find((s) => s.id === edit) ?? null : null;
  const statById = new Map(stats.map((s) => [s.sessionId, s]));

  return (
    <AdminShell admin={admin}>
      {error ? <Alert tone="error" className="mb-5">{error}</Alert> : null}

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {editing ? `Chỉnh sửa: ${editing.name}` : "Tạo đợt học mới"}
          </h2>
          <SessionForm session={editing} />
          <p className="mt-4 text-xs text-slate-400">
            Mẹo: dùng &quot;Tạo đợt học mới&quot; mỗi tháng thay vì xoá đợt cũ
            — dữ liệu các tháng trước sẽ được giữ nguyên.
          </p>
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Danh sách đợt học
          </h2>

          {sessions.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có đợt học nào.</p>
          ) : (
            <ul className="space-y-3">
              {sessions.map((session) => {
                const stat = statById.get(session.id);
                return (
                  <li
                    key={session.id}
                    className="rounded-lg border border-slate-200 p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-900">
                            {session.name}
                          </span>
                          <Badge tone={session.registrationOpen ? "green" : "slate"}>
                            {describeSession(session)}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {formatDate(session.startDate)}
                          {session.classTime ? ` · ${session.classTime}` : ""}
                          {session.location ? ` · ${session.location}` : ""}
                        </p>
                        {stat ? (
                          <p className="mt-1 text-xs text-slate-600">
                            Tổng {stat.total} · Nam {stat.nam} · Nữ {stat.nu} ·
                            Mới {stat.moi} · Tái {stat.taiDangKy}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={`/admin/dot-hoc?edit=${session.id}`}
                          className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Sửa
                        </a>
                        <form action={toggleRegistrationOpenAction}>
                          <input type="hidden" name="id" value={session.id} />
                          <input
                            type="hidden"
                            name="next"
                            value={session.registrationOpen ? "false" : "true"}
                          />
                          <button
                            type="submit"
                            className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            {session.registrationOpen ? "Đóng đăng ký" : "Mở đăng ký"}
                          </button>
                        </form>
                        <form action={deleteSessionAction}>
                          <input type="hidden" name="id" value={session.id} />
                          <button
                            type="submit"
                            className="rounded-md border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                          >
                            Xoá
                          </button>
                        </form>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </AdminShell>
  );
}
