import type { Metadata } from "next";

import { SiteHeader } from "@/components/site-header";
import { StudentNav } from "@/components/student-nav";
import { Alert, Badge, Card } from "@/components/primitives";
import { getBackend } from "@/lib/db";
import { requireStudentReady } from "@/lib/session";
import {
  REGISTRATION_STATUS_LABEL,
  describeSession,
  formatDate,
} from "@/lib/utils";

export const metadata: Metadata = {
  title: "Lịch sử tham gia · Lớp TLDD",
};

export const dynamic = "force-dynamic";

const toneOf = (status: string) => {
  if (status === "CANCELLED") return "slate" as const;
  if (status === "ATTENDED") return "green" as const;
  if (status === "ABSENT") return "rose" as const;
  return "sky" as const;
};

export default async function HistoryPage() {
  const student = await requireStudentReady();

  let rows: Array<{
    sessionId: string;
    name: string;
    startDate: string;
    sessionState: string;
    status: string;
    registeredAt: string;
  }> = [];
  let error: string | null = null;

  try {
    const backend = getBackend();
    const [registrations, sessions] = await Promise.all([
      backend.listRegistrationsByStudent(student.id),
      backend.listSessions(),
    ]);
    const regBySession = new Map(registrations.map((r) => [r.sessionId, r]));

    rows = [...sessions]
      .sort((a, b) => b.startDate.localeCompare(a.startDate))
      .map((session) => ({
        sessionId: session.id,
        name: session.name,
        startDate: session.startDate,
        sessionState: describeSession(session),
        status: regBySession.get(session.id)?.status ?? "",
        registeredAt: regBySession.get(session.id)?.registeredAt ?? "",
      }));
  } catch (e) {
    error = e instanceof Error ? e.message : null;
  }

  const joined = rows.filter(
    (r) => r.status && r.status !== "CANCELLED",
  ).length;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <StudentNav />

        <div className="mb-5">
          <h1 className="text-2xl font-bold text-slate-900">
            Lịch sử tham gia
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {student.fullName} ·{" "}
            <span className="font-mono">{student.memberCode}</span>
          </p>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <Card className="text-center">
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Đợt đã đăng ký
            </div>
            <div className="mt-1 text-3xl font-bold text-slate-900">{joined}</div>
          </Card>
          <Card className="text-center">
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Tổng đợt học
            </div>
            <div className="mt-1 text-3xl font-bold text-slate-900">
              {rows.length}
            </div>
          </Card>
          <Card className="text-center">
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Mã số
            </div>
            <div className="mt-2 text-lg font-bold font-mono text-sky-700">
              {student.memberCode}
            </div>
          </Card>
        </div>

        {error ? <Alert tone="error" className="mb-5">{error}</Alert> : null}

        <Card className="overflow-x-auto p-0">
          {rows.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">Chưa có đợt học nào.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Đợt học</th>
                  <th className="px-4 py-3">Ngày bắt đầu</th>
                  <th className="px-4 py-3">Trạng thái đợt</th>
                  <th className="px-4 py-3">Đăng ký của bạn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.sessionId}>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {row.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(row.startDate)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.sessionState}
                    </td>
                    <td className="px-4 py-3">
                      {row.status ? (
                        <Badge tone={toneOf(row.status)}>
                          {REGISTRATION_STATUS_LABEL[
                            row.status as keyof typeof REGISTRATION_STATUS_LABEL
                          ] ?? row.status}
                        </Badge>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </main>
    </>
  );
}
