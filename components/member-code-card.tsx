import QRCode from "qrcode";

import { Badge, Card } from "@/components/primitives";
import { CopyButton } from "@/components/copy-button";

export async function MemberCodeCard({ code }: { code: string }) {
  let qrDataUrl = "";
  try {
    qrDataUrl = await QRCode.toDataURL(`TLDD:${code}`, {
      width: 260,
      margin: 1,
      errorCorrectionLevel: "M",
    });
  } catch {
    // QR chỉ là tiện ích thêm, lỗi không chặn hiển thị.
  }

  return (
    <Card className="text-center">
      <Badge tone="sky">Mã số cá nhân</Badge>
      <p className="mt-3 font-mono text-3xl font-bold tracking-wide text-slate-900">
        {code}
      </p>
      <div className="mt-3 flex justify-center">
        <CopyButton value={code} label="Sao chép mã" />
      </div>
      {qrDataUrl ? (
        <div className="mt-5 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            alt={`Mã QR cho ${code}`}
            className="h-40 w-40 rounded-lg border border-slate-200"
          />
        </div>
      ) : null}
      <p className="mt-3 text-xs text-slate-400">
        Quét mã QR để lưu nhanh mã số vào điện thoại.
      </p>
    </Card>
  );
}
