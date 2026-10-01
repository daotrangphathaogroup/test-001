"use client";

import { useActionState } from "react";
import Link from "next/link";

import { loginAction, type PublicActionState } from "@/actions/public-actions";
import { FieldError, Label, inputClass } from "@/components/primitives";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";

const initialState: PublicActionState = { ok: false };

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />

      <div>
        <Label htmlFor="memberCode" required>
          Mã số cá nhân
        </Label>
        <input
          id="memberCode"
          name="memberCode"
          required
          autoComplete="username"
          placeholder="TLDD-2026-0001"
          className={`${inputClass} font-mono uppercase`}
        />
        <FieldError message={errors.memberCode} />
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

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <Link href="/quen-mat-khau" className="hover:text-slate-800 hover:underline">
          Quên mật khẩu?
        </Link>
        <Link href="/dang-ky" className="hover:text-slate-800 hover:underline">
          Chưa có mã số? Đăng ký học viên
        </Link>
      </div>
    </form>
  );
}
