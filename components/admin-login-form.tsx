"use client";

import { useActionState } from "react";

import {
  adminLoginAction,
  type AdminActionState,
} from "@/actions/admin-actions";
import { FieldError, Label, inputClass } from "@/components/primitives";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";

const initialState: AdminActionState = { ok: false };

export function AdminLoginForm() {
  const [state, formAction] = useActionState(adminLoginAction, initialState);
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
          autoComplete="username"
          placeholder="thuky"
          className={inputClass}
        />
        <FieldError message={errors.username} />
      </div>

      <div>
        <Label htmlFor="password" required>
          Mật khẩu
        </Label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
        <FieldError message={errors.password} />
      </div>

      <SubmitButton pendingText="Đang đăng nhập…">Đăng nhập</SubmitButton>
    </form>
  );
}
