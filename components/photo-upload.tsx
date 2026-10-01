"use client";

import { useRef, useState } from "react";

import { uploadAvatarAction } from "@/actions/public-actions";
import { Label } from "@/components/primitives";

const MAX_EDGE = 512;

/** Nén ảnh bằng canvas trước khi gửi lên server (giữ dưới ~200KB). */
async function compress(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Trình duyệt không hỗ trợ xử lý ảnh.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function PhotoUpload({
  name = "photoUrl",
  value,
  onChange,
  error,
}: {
  name?: string;
  value: string;
  onChange: (next: string) => void;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setMessage(null);
    setBusy(true);
    try {
      const dataUrl = await compress(file);
      const result = await uploadAvatarAction(
        Object.entries({ photo: dataUrl }).reduce((fd, [k, v]) => {
          fd.append(k, v);
          return fd;
        }, new FormData()),
      );
      if (!result.ok || !result.url) {
        setMessage(result.error ?? "Không tải được ảnh lên.");
        return;
      }
      onChange(result.url);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Không đọc được ảnh.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Label htmlFor={`${name}-file`}>Ảnh đại diện (không bắt buộc)</Label>
      <div className="flex items-center gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Ảnh đại diện" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="flex flex-col gap-1">
          <input
            id={`${name}-file`}
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {busy ? "Đang xử lý…" : value ? "Đổi ảnh" : "Chọn ảnh"}
          </button>
          {value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-xs text-rose-600 hover:underline"
            >
              Bỏ ảnh
            </button>
          ) : null}
        </div>
      </div>
      <input type="hidden" name={name} value={value} />
      {message ? <p className="mt-1 text-xs text-rose-600">{message}</p> : null}
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
      <p className="mt-1 text-xs text-slate-400">JPG/PNG, tối đa ~200KB.</p>
    </div>
  );
}
