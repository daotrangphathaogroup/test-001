import type { Metadata } from "next";

import { AdminShell } from "@/components/admin-shell";
import { Alert, Badge, Card } from "@/components/primitives";
import {
  CreateAdminAccountForm,
  ResetPasswordForm,
} from "@/components/admin-account-forms";
import { deleteAdminAccountAction } from "@/actions/admin-actions";
import { getBackend } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import type { AdminUser } from "@/lib/types";

export const metadata: Metadata = {
  title: "Tài khoản quản trị · Quản trị TLDD",
};

export const dynamic = "force-dynamic";

export default async function AdminAccountsPage() {
  const current = await requireSuperAdmin();

  let admins: AdminUser[] = [];
  let error: string | null = null;
  try {
    admins = await getBackend().listAdmins();
  } catch (e) {
    error = e instanceof Error ? e.message : null;
  }

  return (
    <AdminShell admin={current}>
      {error ? <Alert tone="error" className="mb-5">{error}</Alert> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Tài khoản hiện có
          </h2>
          <ul className="space-y-4">
            {admins.map((admin) => (
              <li
                key={admin.id}
                className="rounded-lg border border-slate-200 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">
                        {admin.username}
                      </span>
                      <Badge tone={admin.role === "SUPERADMIN" ? "violet" : "slate"}>
                        {admin.role === "SUPERADMIN" ? "Quản trị cao" : "Thư ký"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      {admin.fullName || "—"} · tạo {formatDate(admin.createdAt)}
                    </p>
                  </div>
                  {admin.id !== current.id ? (
                    <form action={deleteAdminAccountAction}>
                      <input type="hidden" name="id" value={admin.id} />
                      <button
                        type="submit"
                        className="rounded-md border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                      >
                        Xoá
                      </button>
                    </form>
                  ) : (
                    <Badge tone="sky">Bạn đang đăng nhập</Badge>
                  )}
                </div>

                <div className="mt-3">
                  <ResetPasswordForm adminId={admin.id} />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Thêm tài khoản
          </h2>
          <CreateAdminAccountForm />
          <p className="mt-4 text-xs text-slate-400">
            <strong>Thư ký</strong> quản lý đợt học, đăng ký và học viên.
            <strong> Quản trị cao</strong> còn có quyền quản lý tài khoản.
          </p>
        </Card>
      </div>
    </AdminShell>
  );
}
