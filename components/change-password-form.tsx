"use client";

import { useActionState } from "react";

import {
  changePasswordAction,
  type StudentActionState,
} from "@/actions/student-actions";
import { FieldError, Label, inputClass } from "@/components/primitives";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";

const initialState: StudentActionState = { ok: false };

export function ChangePasswordForm() {
  const [state, formAction] = useActionState(
    changePasswordAction,
    initialState,
  );
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />

      <div>
        <Label htmlFor="currentPassword" required>
          Mật khẩu hiện tại
        </Label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
        <FieldError message={errors.currentPassword} />
      </div>

      <div>
        <Label htmlFor="newPassword" required>
          Mật khẩu mới
        </Label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          autoComplete="new-password"
          className={inputClass}
        />
        <FieldError message={errors.newPassword} />
        <p className="mt-1 text-xs text-slate-400">
          Tối thiểu 8 ký tự, gồm ít nhất 2 nhóm (chữ hoa, chữ thường, số, ký tự
          đặc biệt).
        </p>
      </div>

      <div>
        <Label htmlFor="confirmPassword" required>
          Xác nhận mật khẩu mới
        </Label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          className={inputClass}
        />
        <FieldError message={errors.confirmPassword} />
      </div>

      <SubmitButton pendingText="Đang đổi…">Đổi mật khẩu</SubmitButton>
    </form>
  );
}
