import { NextRequest, NextResponse } from "next/server";

import { getBackend } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/session";
import { toCsv, REGISTRATION_STATUS_LABEL, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const type = request.nextUrl.searchParams.get("type") ?? "";
  const sessionId = request.nextUrl.searchParams.get("session") ?? "";

  try {
    const backend = getBackend();
    const students = await backend.listStudents();
    const studentById = new Map(students.map((s) => [s.id, s]));

    if (type === "students") {
      const csv = toCsv([
        ["Mã số", "Họ tên", "Giới tính", "Ngày sinh", "Phụ huynh", "SĐT", "Địa chỉ", "Sức khoẻ", "Ngày tạo"],
        ...students.map((s) => [
          s.memberCode,
          s.fullName,
          s.gender,
          s.dob,
          s.parentName ?? "",
          s.parentPhone,
          s.address ?? "",
          s.healthNote ?? "",
          s.createdAt,
        ]),
      ]);
      return csvResponse(csv, "danh-sach-hoc-vien.csv");
    }

    if (type === "registrations") {
      const registrations = sessionId
        ? await backend.listRegistrationsBySession(sessionId)
        : await backend.listRegistrations();
      const sessions = await backend.listSessions();
      const sessionById = new Map(sessions.map((s) => [s.id, s]));

      const csv = toCsv([
        ["Mã số", "Họ tên", "Giới tính", "Ngày sinh", "SĐT", "Đợt học", "Ngày bắt đầu", "Trạng thái", "Ngày đăng ký"],
        ...registrations.map((r) => {
          const s = studentById.get(r.studentId);
          const ses = sessionById.get(r.sessionId);
          return [
            s?.memberCode ?? "",
            s?.fullName ?? "",
            s?.gender ?? "",
            s?.dob ?? "",
            s?.parentPhone ?? "",
            ses?.name ?? "",
            ses ? formatDate(ses.startDate) : "",
            REGISTRATION_STATUS_LABEL[r.status] ?? r.status,
            r.registeredAt,
          ];
        }),
      ]);
      return csvResponse(csv, "danh-sach-dang-ky.csv");
    }

    return NextResponse.json({ error: "Tham số không hợp lệ." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Xuất dữ liệu thất bại." },
      { status: 500 },
    );
  }
}

function csvResponse(csv: string, filename: string): Response {
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
