"use client";

import { useActionState } from "react";

import {
  cancelEnrollAction,
  enrollAction,
  type StudentActionState,
} from "@/actions/student-actions";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";

const initialState: StudentActionState = { ok: false };

export function EnrollButton({ sessionId }: { sessionId: string }) {
  const [state, formAction] = useActionState(enrollAction, initialState);

  if (state.ok) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        Đăng ký thành công! Bạn đã được ghi danh vào đợt học này.
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="sessionId" value={sessionId} />
      <FormMessage state={state} />
      <SubmitButton
        pendingText="Đang đăng ký…"
        className="w-full rounded-lg bg-sky-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        Đăng ký tham gia — một chạm
      </SubmitButton>
      <p className="text-xs text-slate-400">
        Bấm đăng ký là hoàn tất, không cần xác nhận thêm.
      </p>
    </form>
  );
}

export function CancelEnrollButton({ sessionId }: { sessionId: string }) {
  const [state, formAction] = useActionState(cancelEnrollAction, initialState);

  return (
    <form action={formAction} className="mt-3">
      <input type="hidden" name="sessionId" value={sessionId} />
      <FormMessage state={state} />
      <button
        type="submit"
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        Huỷ đăng ký
      </button>
    </form>
  );
}
