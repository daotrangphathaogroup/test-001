import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { Alert, Card } from "@/components/primitives";
import { MemberCodeCard } from "@/components/member-code-card";

export const metadata: Metadata = {
  title: "Đăng ký thành công · Lớp TLDD",
};

export default async function RegisterSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  if (!code) redirect("/dang-ky");

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <Alert tone="success" className="mb-6">
          <strong>Đăng ký thành công!</strong> Vui lòng lưu lại mã số cá nhân
          bên dưới.
        </Alert>

        <MemberCodeCard code={code} />

        <Card className="mt-6 space-y-3 text-sm text-slate-600">
          <p>
            <strong>Mã số cá nhân</strong> là tên đăng nhập cố định của bạn cho
            mọi đợt học sau này.
          </p>
          <p>
            Để bảo mật, bạn hãy tự đặt lại mật khẩu sau lần đăng nhập đầu tiên
            tại mục <em>Tài khoản → Đổi mật khẩu</em>.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/dang-nhap"
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
            >
              Đăng nhập ngay
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Về trang chủ
            </Link>
          </div>
        </Card>
      </main>
    </>
  );
}
