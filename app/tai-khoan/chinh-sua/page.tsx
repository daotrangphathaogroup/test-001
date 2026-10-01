import type { Metadata } from "next";

import { SiteHeader } from "@/components/site-header";
import { StudentNav } from "@/components/student-nav";
import { Card } from "@/components/primitives";
import { ProfileForm } from "@/components/profile-form";
import { requireStudentReady } from "@/lib/session";

export const metadata: Metadata = {
  title: "Chỉnh sửa hồ sơ · Lớp TLDD",
};

export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  const student = await requireStudentReady();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <StudentNav />
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-slate-900">
            Chỉnh sửa hồ sơ
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Mã số cá nhân{" "}
            <span className="font-mono font-semibold">{student.memberCode}</span>{" "}
            không thể thay đổi.
          </p>
        </div>

        <Card>
          <ProfileForm student={student} />
        </Card>
      </main>
    </>
  );
}
