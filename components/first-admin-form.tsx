"use client";

import { useActionState } from "react";

import {
  createFirstAdminAction,
  type AdminActionState,
} from "@/actions/admin-actions";
import { FieldError, Label, inputClass } from "@/components/primitives";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";

const initialState: AdminActionState = { ok: false };

export function FirstAdminForm() {
  const [state, formAction] = useActionState(createFirstAdminAction, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />

      <div>
        <Label htmlFor="username" required>
          Tên đăng nhập
        </Label>
        <input
          id="username"
          name="username"
          required
          defaultValue="thuky"
          autoComplete="username"
          className={inputClass}
        />
        <FieldError message={errors.username} />
      </div>

      <div>
        <Label htmlFor="fullName">Họ và tên</Label>
        <input
          id="fullName"
          name="fullName"
          placeholder="Nguyễn Thị Thư Ký"
          className={inputClass}
        />
        <FieldError message={errors.fullName} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="password" required>
            Mật khẩu
          </Label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            className={inputClass}
          />
          <FieldError message={errors.password} />
        </div>
        <div>
          <Label htmlFor="password2" required>
            Nhập lại mật khẩu
          </Label>
          <input
            id="password2"
            name="password2"
            type="password"
            required
            autoComplete="new-password"
            className={inputClass}
          />
          <FieldError message={errors.password2} />
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Tối thiểu 8 ký tự, gồm ít nhất 2 nhóm (chữ hoa, chữ thường, số, ký tự
        đặc biệt). Tài khoản này sẽ có quyền <strong>Quản trị cao</strong>.
      </p>

      <SubmitButton pendingText="Đang tạo…">Tạo tài khoản thư ký</SubmitButton>
    </form>
  );
}
