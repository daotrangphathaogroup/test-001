import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { Alert, Badge, Card } from "@/components/primitives";
import { getBackend, isSupabaseConfigured } from "@/lib/db";
import { pickActiveSession } from "@/lib/stats";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const actions = [
  {
    href: "/dang-ky",
    title: "Đăng ký học viên",
    desc: "Tạo hồ sơ và nhận mã số cá nhân TLDD-…",
    tone: "sky" as const,
  },
  {
    href: "/dang-nhap",
    title: "Đăng nhập",
    desc: "Dùng mã số cá nhân để vào tài khoản.",
    tone: "violet" as const,
  },
  {
    href: "/tra-cuu",
    title: "Tra cứu hồ sơ",
    desc: "Xem lại mã số và thông tin đã đăng ký.",
    tone: "amber" as const,
  },
];

export default async function HomePage() {
  let openSession = null;
  let backendName = "supabase";
  let readError: string | null = null;

  try {
    const backend = getBackend();
    backendName = backend.name;
    const sessions = await backend.listSessions();
    openSession = pickActiveSession(sessions);
  } catch (error) {
    readError = error instanceof Error ? error.message : null;
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {backendName === "local" && !isSupabaseConfigured() ? (
          <Alert tone="warning" className="mb-6">
            <strong>Chế độ demo offline.</strong> Chưa cấu hình Supabase nên dữ
            liệu được lưu tạm trong file <code>.data/db.json</code>. Xem hướng
            dẫn trong README để kết nối cơ sở dữ liệu thật.
          </Alert>
        ) : null}

        {readError ? (
          <Alert tone="error" className="mb-6">
            {readError}
          </Alert>
        ) : null}

        <section className="rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-700 px-6 py-10 text-white shadow-lg">
          <p className="text-sm font-medium uppercase tracking-widest text-sky-100">
            Lớp Tâm Lí Đạo Đức
          </p>
          <h1 className="mt-2 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
            Đăng ký học viên &amp; đăng ký tham gia theo tháng — một chạm, không
            cần Google Form
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-sky-100 sm:text-base">
            Nhận mã số cá nhân, đăng ký tham gia từng đợt học, xem lại lịch sử
            và thống kê Nam / Nữ / Mới / Tái tự động.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/dang-ky"
              className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-sky-700 shadow hover:bg-sky-50"
            >
              Đăng ký học viên
            </Link>
            <Link
              href="/dang-nhap"
              className="rounded-lg border border-white/50 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              Đăng nhập tài khoản
            </Link>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            Đợt học đang mở đăng ký
          </h2>
          {openSession ? (
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-slate-900">
                      {openSession.name}
                    </span>
                    <Badge tone="green">Đang mở đăng ký</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    Bắt đầu: {formatDate(openSession.startDate)}
                    {openSession.classTime ? ` · ${openSession.classTime}` : ""}
                    {openSession.location ? ` · ${openSession.location}` : ""}
                  </p>
                </div>
                <Link
                  href="/dang-nhap"
                  className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                >
                  Đăng nhập để đăng ký
                </Link>
              </div>
            </Card>
          ) : (
            <Alert tone="info">
              Hiện chưa có đợt học nào mở đăng ký. Vui lòng quay lại sau.
            </Alert>
          )}
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {actions.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="h-full transition hover:border-sky-300 hover:shadow-md">
                <Badge tone={item.tone}>Nhanh</Badge>
                <h3 className="mt-3 font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
              </Card>
            </Link>
          ))}
        </section>
      </main>

      <footer className="no-print border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        Lớp Tâm Lí Đạo Đức · Hệ thống đăng ký trực tuyến
      </footer>
    </>
  );
}
