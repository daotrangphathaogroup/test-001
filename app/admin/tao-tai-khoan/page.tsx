import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { FirstAdminForm } from "@/components/first-admin-form";
import { Alert, Card } from "@/components/primitives";
import { getBackend } from "@/lib/db";

export const metadata: Metadata = {
  title: "Tạo tài khoản thư ký · Lớp TLDD",
};

export const dynamic = "force-dynamic";

export default async function FirstAdminPage() {
  let count = 1;
  let error: string | null = null;
  try {
    count = await getBackend().countAdmins();
  } catch (e) {
    error = e instanceof Error ? e.message : null;
  }

  if (error) {
    return (
      <main className="mx-auto w-full max-w-lg px-4 py-16">
        <Alert tone="error">{error}</Alert>
      </main>
    );
  }

  if (count > 0) redirect("/admin/login");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">
          Tạo tài khoản thư ký đầu tiên
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Hệ thống chưa có tài khoản quản trị. Tạo tài khoản để bắt đầu.
        </p>
      </div>

      <Alert tone="warning" className="mb-4">
        Chỉ trang này được phép tạo tài khoản đầu tiên — điều kiện là bảng tài
        khoản còn trống. Sau khi tạo, màn hình này sẽ bị khoá.
      </Alert>

      <Card>
        <FirstAdminForm />
      </Card>
    </main>
  );
}
