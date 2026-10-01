import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin-login-form";
import { Alert, Card } from "@/components/primitives";
import { getBackend } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: "Đăng nhập quản trị · Lớp TLDD",
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const admin = await getCurrentAdmin();
  if (admin) redirect("/admin");

  let needsSetup = false;
  let setupError: string | null = null;
  try {
    const backend = getBackend();
    needsSetup = (await backend.countAdmins()) === 0;
  } catch (e) {
    setupError = e instanceof Error ? e.message : null;
  }

  if (needsSetup) redirect("/admin/tao-tai-khoan");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800"
        >
          ← Về trang chủ
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">
          Đăng nhập quản trị
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Dành cho thư ký / quản trị lớp TLDD.
        </p>
      </div>

      {setupError ? (
        <Alert tone="error" className="mb-4">
          {setupError}
        </Alert>
      ) : null}

      <Card>
        <AdminLoginForm />
      </Card>
    </main>
  );
}
