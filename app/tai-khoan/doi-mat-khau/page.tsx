import type { Metadata } from "next";

import { SiteHeader } from "@/components/site-header";
import { StudentNav } from "@/components/student-nav";
import { Alert, Card } from "@/components/primitives";
import { ChangePasswordForm } from "@/components/change-password-form";
import { requireStudent } from "@/lib/session";

export const metadata: Metadata = {
  title: "Đổi mật khẩu · Lớp TLDD",
};

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const student = await requireStudent();
  const { reset } = await searchParams;
  const forced = student.mustChangePassword;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
        <StudentNav />

        <div className="mb-5">
          <h1 className="text-2xl font-bold text-slate-900">Đổi mật khẩu</h1>
          {forced ? (
            <p className="mt-1 text-sm text-slate-500">
              Bạn đang dùng mật khẩu tạm. Hãy đổi mật khẩu để tiếp tục.
            </p>
          ) : null}
        </div>

        {forced ? (
          <Alert tone="warning" className="mb-4">
            {reset === "1"
              ? "Mật khẩu đã được đặt lại theo số điện thoại phụ huynh. Vui lòng đặt mật khẩu mới ngay bây giờ."
              : "Bạn bắt buộc đổi mật khẩu trước khi sử dụng các tính năng khác."}
          </Alert>
        ) : null}

        <Card>
          <ChangePasswordForm />
        </Card>
      </main>
    </>
  );
}
