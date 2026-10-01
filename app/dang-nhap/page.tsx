import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/primitives";
import { LoginForm } from "@/components/login-form";
import { getCurrentAdmin, getCurrentStudent } from "@/lib/session";

export const metadata: Metadata = {
  title: "Đăng nhập · Lớp TLDD",
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const [student, admin] = await Promise.all([
    getCurrentStudent(),
    getCurrentAdmin(),
  ]);
  if (admin) redirect("/admin");
  if (student) redirect("/tai-khoan");

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-10">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            Đăng nhập tài khoản
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Dùng mã số cá nhân đã nhận khi đăng ký học viên.
          </p>
        </div>

        <Card>
          <LoginForm />
        </Card>

        <p className="mt-4 text-center text-xs text-slate-400">
          Đây là tài khoản học viên. Thư ký / quản trị dùng{" "}
          <a href="/admin/login" className="underline hover:text-slate-600">
            trang đăng nhập quản trị
          </a>
          .
        </p>
      </main>
    </>
  );
}
