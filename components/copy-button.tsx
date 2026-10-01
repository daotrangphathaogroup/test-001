"use client";

import { useState } from "react";

export function CopyButton({
  value,
  label = "Sao chép",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
        } catch {
          // Bỏ qua khi trình duyệt chặn clipboard.
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
    >
      {copied ? "Đã sao chép!" : label}
    </button>
  );
}
