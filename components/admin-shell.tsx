import Link from "next/link";

import { AdminNav } from "@/components/admin-nav";
import { logoutAction } from "@/actions/public-actions";
import type { AdminUser } from "@/lib/types";

export function AdminShell({
  admin,
  children,
}: {
  admin: AdminUser;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-500">
          Không gian quản trị ·{" "}
          <span className="font-semibold text-slate-800">
            {admin.fullName || admin.username}
          </span>
          <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
            {admin.role === "SUPERADMIN" ? "Quản trị cao" : "Thư ký"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/"
            className="rounded-md px-2.5 py-1.5 text-slate-600 hover:bg-slate-100"
          >
            Xem trang học viên
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-md px-2.5 py-1.5 text-slate-600 hover:bg-slate-100"
            >
              Đăng xuất
            </button>
          </form>
        </div>
      </div>

      <AdminNav superadmin={admin.role === "SUPERADMIN"} />

      <div className="mt-6">{children}</div>
    </div>
  );
}
