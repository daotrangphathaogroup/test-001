import type { Metadata } from "next";

import { SiteHeader } from "@/components/site-header";
import { Alert, Card } from "@/components/primitives";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Quên mật khẩu · Lớp TLDD",
};

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  const { err } = await searchParams;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Quên mật khẩu</h1>
          <p className="mt-1 text-sm text-slate-500">
            Xác minh bằng mã số cá nhân và số điện thoại phụ huynh để đặt lại
            mật khẩu.
          </p>
        </div>

        {err ? (
          <Alert tone="error" className="mb-4">
            Không đặt lại được mật khẩu. Vui lòng thử lại hoặc liên hệ thư ký
            lớp.
          </Alert>
        ) : null}

        <Card>
          <ForgotPasswordForm />
        </Card>
      </main>
    </>
  );
}
