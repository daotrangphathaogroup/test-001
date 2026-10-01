"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

interface Item {
  href: string;
  label: string;
}

export function AdminNav({ superadmin }: { superadmin: boolean }) {
  const pathname = usePathname();

  const items: Item[] = [
    { href: "/admin", label: "Tổng quan" },
    { href: "/admin/dot-hoc", label: "Đợt học" },
    { href: "/admin/dang-ky", label: "Đăng ký" },
    { href: "/admin/hoc-vien", label: "Học viên" },
  ];
  if (superadmin) {
    items.push({ href: "/admin/tai-khoan", label: "Tài khoản" });
  }

  return (
    <nav className="no-print flex flex-wrap gap-1 border-b border-slate-200 pb-2">
      {items.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
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
