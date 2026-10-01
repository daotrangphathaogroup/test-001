"use client";

import { useActionState, useState } from "react";

import { registerAction, type PublicActionState } from "@/actions/public-actions";
import { FieldError, Label, inputClass } from "@/components/primitives";
import { FormMessage } from "@/components/form-message";
import { PhotoUpload } from "@/components/photo-upload";
import { SubmitButton } from "@/components/submit-button";

const initialState: PublicActionState = { ok: false };

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initialState);
  const [photo, setPhoto] = useState("");
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />

      <div>
        <Label htmlFor="fullName" required>
          Họ và tên
        </Label>
        <input
          id="fullName"
          name="fullName"
          required
          placeholder="Nguyễn Văn A"
          className={inputClass}
        />
        <FieldError message={errors.fullName} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="gender" required>
            Giới tính
          </Label>
          <select id="gender" name="gender" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Chọn giới tính
            </option>
            <option value="NAM">Nam</option>
            <option value="NU">Nữ</option>
          </select>
          <FieldError message={errors.gender} />
        </div>
        <div>
          <Label htmlFor="dob" required>
            Ngày sinh
          </Label>
          <input id="dob" name="dob" type="date" required className={inputClass} />
          <FieldError message={errors.dob} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="parentName">Tên phụ huynh</Label>
          <input
            id="parentName"
            name="parentName"
            placeholder="Nguyễn Văn B"
            className={inputClass}
          />
          <FieldError message={errors.parentName} />
        </div>
        <div>
          <Label htmlFor="parentPhone" required>
            Số điện thoại phụ huynh
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
      </div>

      <div>
        <Label htmlFor="address">Địa chỉ</Label>
        <input
          id="address"
          name="address"
          placeholder="Số nhà, đường, quận/huyện…"
          className={inputClass}
        />
        <FieldError message={errors.address} />
      </div>

      <div>
        <Label htmlFor="healthNote">Lưu ý sức khoẻ (nếu có)</Label>
        <textarea
          id="healthNote"
          name="healthNote"
          rows={3}
          placeholder="Dị ứng, bệnh nền, thuốc đang dùng…"
          className={inputClass}
        />
        <FieldError message={errors.healthNote} />
      </div>

      <PhotoUpload value={photo} onChange={setPhoto} error={errors.photoUrl} />

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
          <p className="mt-1 text-xs text-slate-400">
            Tối thiểu 8 ký tự, gồm ít nhất 2 nhóm (chữ hoa, chữ thường, số, ký
            tự đặc biệt).
          </p>
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

      <SubmitButton pendingText="Đang đăng ký…">Hoàn tất đăng ký</SubmitButton>
      <p className="text-xs text-slate-400">
        Sau khi đăng ký, bạn sẽ nhận mã số cá nhân dạng TLDD-YYYY-NNNN dùng để
        đăng nhập mọi tháng sau đó.
      </p>
    </form>
  );
}
