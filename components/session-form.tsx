"use client";

import { useActionState } from "react";

import {
  saveSessionAction,
  type AdminActionState,
} from "@/actions/admin-actions";
import { FieldError, Label, inputClass } from "@/components/primitives";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import type { ClassSession } from "@/lib/types";

const initialState: AdminActionState = { ok: false };

export function SessionForm({
  session,
  onDone,
}: {
  session?: ClassSession | null;
  onDone?: () => void;
}) {
  const [state, formAction] = useActionState(saveSessionAction, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={session?.id ?? ""} />
      <FormMessage state={state} />

      <div>
        <Label htmlFor="name" required>
          Tên đợt / khoá học
        </Label>
        <input
          id="name"
          name="name"
          required
          defaultValue={session?.name ?? ""}
          placeholder="Tháng 10/2026"
          className={inputClass}
        />
        <FieldError message={errors.name} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="startDate" required>
            Ngày bắt đầu
          </Label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            required
            defaultValue={session?.startDate ?? ""}
            className={inputClass}
          />
          <FieldError message={errors.startDate} />
        </div>
        <div>
          <Label htmlFor="classTime">Thời gian học</Label>
          <input
            id="classTime"
            name="classTime"
            defaultValue={session?.classTime ?? ""}
            placeholder="08:00 - 11:00, Chủ nhật hàng tuần"
            className={inputClass}
          />
          <FieldError message={errors.classTime} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="location">Địa điểm</Label>
          <input
            id="location"
            name="location"
            defaultValue={session?.location ?? ""}
            placeholder="Nhà văn hoá phường…"
            className={inputClass}
          />
          <FieldError message={errors.location} />
        </div>
        <div>
          <Label htmlFor="leaderName">Huynh trưởng phụ trách</Label>
          <input
            id="leaderName"
            name="leaderName"
            defaultValue={session?.leaderName ?? ""}
            className={inputClass}
          />
          <FieldError message={errors.leaderName} />
        </div>
      </div>

      <div>
        <Label htmlFor="content">Nội dung / ghi chú</Label>
        <textarea
          id="content"
          name="content"
          rows={3}
          defaultValue={session?.content ?? ""}
          className={inputClass}
        />
        <FieldError message={errors.content} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="status">Trạng thái</Label>
          <select
            id="status"
            name="status"
            defaultValue={session?.status ?? "UPCOMING"}
            className={inputClass}
          >
            <option value="UPCOMING">Sắp diễn ra</option>
            <option value="ONGOING">Đang diễn ra</option>
            <option value="CLOSED">Đã kết thúc</option>
          </select>
        </div>
        <div>
          <Label htmlFor="registrationOpen">Mở đăng ký</Label>
          <select
            id="registrationOpen"
            name="registrationOpen"
            defaultValue={session?.registrationOpen ? "true" : "false"}
            className={inputClass}
          >
            <option value="true">Đang mở đăng ký</option>
            <option value="false">Đóng đăng ký</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pendingText="Đang lưu…">
          {session ? "Cập nhật đợt học" : "Tạo đợt học"}
        </SubmitButton>
        {onDone ? (
          <button
            type="button"
            onClick={onDone}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Huỷ
          </button>
        ) : null}
      </div>
    </form>
  );
}
