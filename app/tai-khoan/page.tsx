import type { Metadata } from "next";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { StudentNav } from "@/components/student-nav";
import { Alert, Badge, Card } from "@/components/primitives";
import { logoutAction } from "@/actions/public-actions";
import { getBackend } from "@/lib/db";
import { requireStudentReady } from "@/lib/session";
import { formatDate, formatDateTime, GENDER_LABEL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Tài khoản · Lớp TLDD",
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const student = await requireStudentReady();

  let monthsAttended = 0;
  let latestSession: string | null = null;
  try {
    const backend = getBackend();
    const [registrations, sessions] = await Promise.all([
      backend.listRegistrationsByStudent(student.id),
      backend.listSessions(),
    ]);
    const active = registrations.filter((r) => r.status !== "CANCELLED");
    monthsAttended = active.length;
    const ids = new Set(active.map((r) => r.sessionId));
    latestSession =
      sessions
        .filter((s) => ids.has(s.id))
        .sort((a, b) => b.startDate.localeCompare(a.startDate))[0]?.name ?? null;
  } catch {
    // Không chặn trang nếu thống kê lỗi.
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <StudentNav />

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
              {student.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={student.photoUrl}
                  alt={student.fullName}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {student.fullName}
              </h1>
              <p className="mt-1 font-mono text-sm text-slate-500">
                {student.memberCode}
              </p>
            </div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Đăng xuất
            </button>
          </form>
        </div>

        <Alert tone="warning" className="mb-5">
          Bạn có <strong>{monthsAttended}</strong> đợt học đã tham gia
          {latestSession ? ` · gần nhất: ${latestSession}` : ""}.
        </Alert>

        <Card>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Thông tin hồ sơ
          </h2>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Giới tính</dt>
              <dd className="font-medium text-slate-900">
                <Badge tone={student.gender === "NAM" ? "sky" : "rose"}>
                  {GENDER_LABEL[student.gender]}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Ngày sinh</dt>
              <dd className="font-medium text-slate-900">
                {formatDate(student.dob)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Phụ huynh</dt>
              <dd className="font-medium text-slate-900">
                {student.parentName || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">SĐT phụ huynh</dt>
              <dd className="font-medium text-slate-900">
                {student.parentPhone}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Địa chỉ</dt>
              <dd className="font-medium text-slate-900">
                {student.address || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Sức khoẻ</dt>
              <dd className="font-medium text-slate-900">
                {student.healthNote || "—"}
              </dd>
            </div>
          </dl>

          <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2">
            <div>
              <span className="text-slate-500">Ngày tạo hồ sơ: </span>
              <span className="font-medium text-slate-800">
                {formatDateTime(student.createdAt)}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Đăng nhập gần nhất: </span>
              <span className="font-medium text-slate-800">
                {student.lastLoginAt ? formatDateTime(student.lastLoginAt) : "—"}
              </span>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
            <Link
              href="/dang-ky-tham-gia"
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
            >
              Đăng ký tham gia tháng này
            </Link>
            <Link
              href="/tai-khoan/chinh-sua"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Chỉnh sửa hồ sơ
            </Link>
            <Link
              href="/lich-su"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Xem lịch sử
            </Link>
          </div>
        </Card>
      </main>
    </>
  );
}
