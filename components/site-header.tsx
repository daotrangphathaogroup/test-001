import Link from "next/link";

import { logoutAction } from "@/actions/public-actions";
import { getCurrentAdmin, getCurrentStudent } from "@/lib/session";
import { Badge } from "@/components/primitives";

const publicLinks = [
  { href: "/", label: "Trang chủ" },
  { href: "/dang-ky", label: "Đăng ký học viên" },
  { href: "/tra-cuu", label: "Tra cứu" },
];

export async function SiteHeader() {
  const [student, admin] = await Promise.all([
    getCurrentStudent(),
    getCurrentAdmin(),
  ]);

  return (
    <header className="no-print sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-sky-600 text-sm text-white">
            TL
          </span>
          <span className="text-sm sm:text-base">Lớp Tâm Lí Đạo Đức</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {publicLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-2.5 py-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {link.label}
            </Link>
          ))}

          {admin ? (
            <>
              <Link
                href="/admin"
                className="rounded-md px-2.5 py-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Quản trị
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-md px-2.5 py-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  Đăng xuất
                </button>
              </form>
            </>
          ) : student ? (
            <>
              <Link
                href="/tai-khoan"
                className="hidden rounded-md px-2.5 py-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:block"
              >
                Tài khoản
              </Link>
              <Link
                href="/dang-ky-tham-gia"
                className="rounded-md bg-sky-600 px-3 py-1.5 font-semibold text-white transition hover:bg-sky-700"
              >
                Đăng ký tháng
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/dang-nhap"
                className="rounded-md px-2.5 py-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Đăng nhập
              </Link>
              <Link
                href="/admin/login"
                className="hidden rounded-md px-2.5 py-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:block"
              >
                Thư ký
              </Link>
            </>
          )}
        </nav>
      </div>

      {student ? (
        <div className="mx-auto max-w-5xl px-4 pb-2 text-xs text-slate-500">
          <Badge tone="sky">{student.memberCode}</Badge>{" "}
          <span className="ml-1">{student.fullName}</span>
        </div>
      ) : null}
    </header>
  );
}
