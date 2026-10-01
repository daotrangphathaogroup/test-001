"use client";

import { useActionState, useState } from "react";

import {
  createAdminAccountAction,
  resetAdminPasswordAction,
  type AdminActionState,
} from "@/actions/admin-actions";
import { FieldError, Label, inputClass } from "@/components/primitives";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";

const initialState: AdminActionState = { ok: false };

export function CreateAdminAccountForm() {
  const [state, formAction] = useActionState(
    createAdminAccountAction,
    initialState,
  );
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />
      {state.ok ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Đã tạo tài khoản.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="acc-username" required>
            Tên đăng nhập
          </Label>
          <input
            id="acc-username"
            name="username"
            required
            className={inputClass}
          />
          <FieldError message={errors.username} />
        </div>
        <div>
          <Label htmlFor="acc-fullName">Họ và tên</Label>
          <input id="acc-fullName" name="fullName" className={inputClass} />
          <FieldError message={errors.fullName} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="acc-password" required>
            Mật khẩu
          </Label>
          <input
            id="acc-password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            className={inputClass}
          />
          <FieldError message={errors.password} />
        </div>
        <div>
          <Label htmlFor="acc-role" required>
            Vai trò
          </Label>
          <select
            id="acc-role"
            name="role"
            defaultValue="SECRETARY"
            className={inputClass}
          >
            <option value="SECRETARY">Thư ký</option>
            <option value="SUPERADMIN">Quản trị cao</option>
          </select>
        </div>
      </div>

      <SubmitButton pendingText="Đang tạo…">Tạo tài khoản</SubmitButton>
    </form>
  );
}

export function ResetPasswordForm({ adminId }: { adminId: string }) {
  const [state, formAction] = useActionState(
    resetAdminPasswordAction,
    initialState,
  );
  const errors = state.fieldErrors ?? {};
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        Đặt lại mật khẩu
      </button>
    );
  }

  return (
    <div className="w-full">
      <form action={formAction} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="adminId" value={adminId} />
        <div className="min-w-40 flex-1">
          <Label htmlFor={`reset-${adminId}`}>Mật khẩu mới</Label>
          <input
            id={`reset-${adminId}`}
            name="password"
            type="password"
            required
            autoComplete="new-password"
            className={inputClass}
          />
          <FieldError message={errors.password} />
        </div>
        <SubmitButton pendingText="Đang lưu…">Lưu</SubmitButton>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
        >
          Đóng
        </button>
      </form>
      <FormMessage state={state} />
    </div>
  );
}
