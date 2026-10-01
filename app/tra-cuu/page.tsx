import type { Metadata } from "next";

import { SiteHeader } from "@/components/site-header";
import { Alert, Badge, Card, inputClass, Label } from "@/components/primitives";
import { getBackend } from "@/lib/db";
import { buildStudentDetail } from "@/lib/stats";
import { normalizeMemberCode } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Tra cứu hồ sơ · Lớp TLDD",
};

export const dynamic = "force-dynamic";

function maskPhone(phone: string): string {
  if (phone.length < 7) return phone;
  return `${phone.slice(0, 3)}***${phone.slice(-3)}`;
}

export default async function LookupPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; dob?: string; msg?: string }>;
}) {
  const { code = "", dob = "", msg } = await searchParams;

  let detail = null;
  let error: string | null = null;

  if (code || dob) {
    if (!code || !dob) {
      error = "Vui lòng nhập cả mã số cá nhân và ngày sinh.";
    } else {
      try {
        const backend = getBackend();
        const student = await backend.getStudentWithPasswordByMemberCode(
          normalizeMemberCode(code),
        );
        if (!student || student.dob !== dob) {
          error = "Không tìm thấy hồ sơ khớp với mã số và ngày sinh bạn nhập.";
        } else {
          const [registrations, sessions] = await Promise.all([
            backend.listRegistrationsByStudent(student.id),
            backend.listSessions(),
          ]);
          detail = buildStudentDetail(student, registrations, sessions);
        }
      } catch (e) {
        error = e instanceof Error ? e.message : "Không tra cứu được.";
      }
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Tra cứu hồ sơ</h1>
          <p className="mt-1 text-sm text-slate-500">
            Nhập mã số cá nhân và ngày sinh để xem thông tin cũng như lịch sử
            tham gia các đợt học.
          </p>
        </div>

        {msg === "doi-mat-khau" ? (
          <Alert tone="success" className="mb-4">
            Đổi mật khẩu thành công. Hãy dùng mật khẩu mới để đăng nhập.
          </Alert>
        ) : null}

        <Card>
          <form method="get" className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="code" required>
                Mã số cá nhân
              </Label>
              <input
                id="code"
                name="code"
                defaultValue={code}
                required
                placeholder="TLDD-2026-0001"
                className={`${inputClass} font-mono uppercase`}
              />
            </div>
            <div>
              <Label htmlFor="dob" required>
                Ngày sinh
              </Label>
              <input
                id="dob"
                name="dob"
                type="date"
                defaultValue={dob}
                required
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
              >
                Tra cứu
              </button>
            </div>
          </form>
        </Card>

        {error ? (
          <Alert tone="error" className="mt-5">
            {error}
          </Alert>
        ) : null}

        {detail ? (
          <Card className="mt-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-slate-900">
                    {detail.fullName}
                  </span>
                  <Badge tone={detail.gender === "NAM" ? "sky" : "rose"}>
                    {detail.gender === "NAM" ? "Nam" : "Nữ"}
                  </Badge>
                </div>
                <p className="mt-1 font-mono text-sm text-slate-500">
                  {detail.memberCode}
                </p>
              </div>
              <Badge tone="violet">{detail.monthsAttended} đợt đã tham gia</Badge>
            </div>

            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Ngày sinh</dt>
                <dd className="font-medium text-slate-900">{detail.dob}</dd>
              </div>
              <div>
                <dt className="text-slate-500">SĐT phụ huynh</dt>
                <dd className="font-medium text-slate-900">
                  {maskPhone(detail.parentPhone)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Phụ huynh</dt>
                <dd className="font-medium text-slate-900">
                  {detail.parentName || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Địa chỉ</dt>
                <dd className="font-medium text-slate-900">
                  {detail.address || "—"}
                </dd>
              </div>
            </dl>

            <h2 className="mt-6 mb-2 text-sm font-semibold text-slate-900">
              Lịch sử tham gia
            </h2>
            {detail.history.length === 0 ? (
              <p className="text-sm text-slate-500">
                Chưa có đợt học nào được ghi nhận.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {detail.history.map((item) => (
                  <li
                    key={item.registration.id}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="text-slate-700">{item.session.name}</span>
                    <Badge
                      tone={
                        item.registration.status === "CANCELLED"
                          ? "slate"
                          : "green"
                      }
                    >
                      {item.registration.status === "CANCELLED"
                        ? "Đã huỷ"
                        : "Tham gia"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ) : null}
      </main>
    </>
  );
}
