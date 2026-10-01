import type { Metadata } from "next";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { StudentNav } from "@/components/student-nav";
import { Alert, Badge, Card } from "@/components/primitives";
import {
  CancelEnrollButton,
  EnrollButton,
} from "@/components/enroll-button";
import { getBackend } from "@/lib/db";
import { requireStudentReady } from "@/lib/session";
import { pickActiveSession } from "@/lib/stats";
import { formatDate } from "@/lib/utils";
import type { ClassSession, Registration } from "@/lib/types";

export const metadata: Metadata = {
  title: "Đăng ký tham gia · Lớp TLDD",
};

export const dynamic = "force-dynamic";

export default async function EnrollPage() {
  const student = await requireStudentReady();

  let session: ClassSession | null = null;
  let registration: Registration | null = null;
  let upcoming: Array<{ id: string; name: string; startDate: string }> = [];
  let error: string | null = null;

  try {
    const backend = getBackend();
    const sessions = await backend.listSessions();
    session = pickActiveSession(sessions);
    upcoming = sessions
      .filter((s) => !session || s.id !== session.id)
      .slice(-4)
      .reverse()
      .map((s) => ({ id: s.id, name: s.name, startDate: s.startDate }));

    if (session) {
      registration = await backend.getRegistration(student.id, session.id);
    }
  } catch (e) {
    error = e instanceof Error ? e.message : null;
  }

  const registered =
    registration !== null &&
    registration.status !== "CANCELLED" &&
    registration.status !== "ABSENT";

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <StudentNav />

        <div className="mb-5">
          <h1 className="text-2xl font-bold text-slate-900">
            Đăng ký tham gia
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Chào {student.fullName} ·{" "}
            <span className="font-mono">{student.memberCode}</span>
          </p>
        </div>

        {error ? <Alert tone="error" className="mb-5">{error}</Alert> : null}

        {session ? (
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">
                    {session.name}
                  </h2>
                  <Badge tone="green">Đang mở đăng ký</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  Bắt đầu {formatDate(session.startDate)}
                  {session.classTime ? ` · ${session.classTime}` : ""}
                </p>
                {session.location ? (
                  <p className="text-sm text-slate-600">{session.location}</p>
                ) : null}
              </div>
            </div>

            {session.content ? (
              <p className="mt-4 whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                {session.content}
              </p>
            ) : null}

            <div className="mt-5">
              {registered ? (
                <>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    Bạn đã đăng ký đợt học này
                    {registration?.registeredAt
                      ? ` lúc ${formatDate(registration.registeredAt)}`
                      : ""}
                    .
                  </div>
                  {session.status === "UPCOMING" ? (
                    <CancelEnrollButton sessionId={session.id} />
                  ) : null}
                </>
              ) : (
                <EnrollButton sessionId={session.id} />
              )}
            </div>

            <dl className="mt-6 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Huynh trưởng phụ trách</dt>
                <dd className="font-medium text-slate-900">
                  {session.leaderName || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Thông tin dùng để xác nhận</dt>
                <dd className="font-medium text-slate-900">
                  {student.fullName} · {student.dob} · {student.parentPhone}
                </dd>
              </div>
            </dl>
          </Card>
        ) : (
          <Alert tone="info">
            Hiện chưa có đợt học nào mở đăng ký. Vui lòng quay lại sau hoặc xem{" "}
            <Link href="/lich-su" className="font-semibold underline">
              lịch sử tham gia
            </Link>
            .
          </Alert>
        )}

        {upcoming.length > 0 ? (
          <section className="mt-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Các đợt học khác
            </h2>
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white text-sm">
              {upcoming.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <span className="text-slate-700">{item.name}</span>
                  <span className="text-slate-400">
                    {formatDate(item.startDate)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </>
  );
}
