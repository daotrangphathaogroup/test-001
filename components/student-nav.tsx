"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const items = [
  { href: "/tai-khoan", label: "Tài khoản" },
  { href: "/dang-ky-tham-gia", label: "Đăng ký tháng" },
  { href: "/lich-su", label: "Lịch sử" },
  { href: "/tai-khoan/chinh-sua", label: "Chỉnh sửa hồ sơ" },
  { href: "/tai-khoan/doi-mat-khau", label: "Đổi mật khẩu" },
];

export function StudentNav() {
  const pathname = usePathname();

  return (
    <nav className="no-print mb-6 flex flex-wrap gap-1 border-b border-slate-200 pb-2">
      {items.map((item) => {
        const active =
          item.href === "/tai-khoan"
            ? pathname === item.href
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition",
              active
                ? "bg-sky-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
