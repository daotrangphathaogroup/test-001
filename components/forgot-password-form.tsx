"use client";

import { useActionState } from "react";
import Link from "next/link";

import {
  forgotPasswordAction,
  type PublicActionState,
} from "@/actions/public-actions";
import { FieldError, Label, inputClass } from "@/components/primitives";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";

const initialState: PublicActionState = { ok: false };

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, initialState);
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
          placeholder="TLDD-2026-0001"
          className={`${inputClass} font-mono uppercase`}
        />
        <FieldError message={errors.memberCode} />
      </div>

      <div>
        <Label htmlFor="parentPhone" required>
          Số điện thoại phụ huynh đã đăng ký
        </Label>
        <input
          id="parentPhone"
          name="parentPhone"
          type="tel"
          inputMode="numeric"
          required
          placeholder="0901234567"
          className={inputClass}
        />
        <FieldError message={errors.parentPhone} />
      </div>

      <SubmitButton pendingText="Đang xác minh…">
        Đặt lại mật khẩu
      </SubmitButton>

      <p className="text-xs text-slate-500">
        Mật khẩu tạm sẽ được đặt lại thành số điện thoại phụ huynh. Bạn bắt buộc
        phải đổi mật khẩu ngay ở lần đăng nhập kế tiếp.
      </p>

      <div className="text-xs text-slate-500">
        <Link href="/dang-nhap" className="hover:text-slate-800 hover:underline">
          Quay lại đăng nhập
        </Link>
      </div>
    </form>
  );
}
