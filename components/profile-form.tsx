"use client";

import { useActionState, useState } from "react";

import {
  updateProfileAction,
  type StudentActionState,
} from "@/actions/student-actions";
import { FieldError, Label, inputClass } from "@/components/primitives";
import { FormMessage } from "@/components/form-message";
import { PhotoUpload } from "@/components/photo-upload";
import { SubmitButton } from "@/components/submit-button";
import type { Student } from "@/lib/types";

const initialState: StudentActionState = { ok: false };

export function ProfileForm({ student }: { student: Student }) {
  const [state, formAction] = useActionState(
    updateProfileAction,
    initialState,
  );
  const [photo, setPhoto] = useState(student.photoUrl ?? "");
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />
      {state.ok ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Đã lưu thay đổi.
        </p>
      ) : null}

      <div>
        <Label htmlFor="fullName" required>
          Họ và tên
        </Label>
        <input
          id="fullName"
          name="fullName"
          required
          defaultValue={student.fullName}
          className={inputClass}
        />
        <FieldError message={errors.fullName} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="gender" required>
            Giới tính
          </Label>
          <select
            id="gender"
            name="gender"
            defaultValue={student.gender}
            className={inputClass}
          >
            <option value="NAM">Nam</option>
            <option value="NU">Nữ</option>
          </select>
          <FieldError message={errors.gender} />
        </div>
        <div>
          <Label htmlFor="dob" required>
            Ngày sinh
          </Label>
          <input
            id="dob"
            name="dob"
            type="date"
            required
            defaultValue={student.dob}
            className={inputClass}
          />
          <FieldError message={errors.dob} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="parentName">Tên phụ huynh</Label>
          <input
            id="parentName"
            name="parentName"
            defaultValue={student.parentName ?? ""}
            className={inputClass}
          />
          <FieldError message={errors.parentName} />
        </div>
        <div>
          <Label htmlFor="parentPhone" required>
            SĐT phụ huynh
          </Label>
          <input
            id="parentPhone"
            name="parentPhone"
            type="tel"
            inputMode="numeric"
            required
            defaultValue={student.parentPhone}
            className={inputClass}
          />
          <FieldError message={errors.parentPhone} />
        </div>
      </div>

      <div>
        <Label htmlFor="address">Địa chỉ</Label>
        <input
          id="address"
          name="address"
          defaultValue={student.address ?? ""}
          className={inputClass}
        />
        <FieldError message={errors.address} />
      </div>

      <div>
        <Label htmlFor="healthNote">Lưu ý sức khoẻ</Label>
        <textarea
          id="healthNote"
          name="healthNote"
          rows={3}
          defaultValue={student.healthNote ?? ""}
          className={inputClass}
        />
        <FieldError message={errors.healthNote} />
      </div>

      <PhotoUpload value={photo} onChange={setPhoto} error={errors.photoUrl} />

      <SubmitButton pendingText="Đang lưu…">Lưu thay đổi</SubmitButton>
    </form>
  );
}
