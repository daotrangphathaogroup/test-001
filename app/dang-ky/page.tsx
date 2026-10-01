import type { Metadata } from "next";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { Alert, Card } from "@/components/primitives";
import { RegisterForm } from "@/components/register-form";
import { getCurrentStudent } from "@/lib/session";

export const metadata: Metadata = {
  title: "Đăng ký học viên · Lớp TLDD",
};

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const student = await getCurrentStudent();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            Đăng ký học viên
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Điền đầy đủ thông tin bên dưới. Hệ thống sẽ cấp mã số cá nhân dùng
            cho mọi lần đăng ký sau.
          </p>
        </div>

        {student ? (
          <Alert tone="info" className="mb-6">
            Bạn đã đăng nhập với mã <strong>{student.memberCode}</strong>. Đăng
            ký hồ sơ mới sẽ tạo thêm một học viên khác — nếu cần thay đổi thông
            tin, hãy vào{" "}
            <Link href="/tai-khoan/chinh-sua" className="font-semibold underline">
              trang chỉnh sửa hồ sơ
            </Link>
            .
          </Alert>
        ) : null}

        <Card>
          <RegisterForm />
        </Card>
      </main>
    </>
  );
}
