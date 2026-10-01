import type {
  ClassSession,
  Registration,
  SessionStats,
  Student,
  StudentDetail,
} from "@/lib/types";

/** Tính thống kê từng đợt: tổng, nam, nữ, học viên mới, học viên học lại. */
export function computeSessionStats(
  sessions: ClassSession[],
  registrations: Registration[],
  students: Student[],
): SessionStats[] {
  const studentById = new Map(students.map((s) => [s.id, s]));
  const sessionById = new Map(sessions.map((s) => [s.id, s]));

  // Đợt (không tính đăng ký đã huỷ) đầu tiên mà mỗi học viên tham gia.
  const firstSessionDate = new Map<string, string>();
  for (const reg of registrations) {
    if (reg.status === "CANCELLED") continue;
    const session = sessionById.get(reg.sessionId);
    if (!session) continue;
    const current = firstSessionDate.get(reg.studentId);
    if (!current || session.startDate < current) {
      firstSessionDate.set(reg.studentId, session.startDate);
    }
  }

  return [...sessions]
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .map((session) => {
      const active = registrations.filter(
        (reg) => reg.sessionId === session.id && reg.status !== "CANCELLED",
      );
      let nam = 0;
      let nu = 0;
      let moi = 0;
      for (const reg of active) {
        const student = studentById.get(reg.studentId);
        if (student?.gender === "NAM") nam += 1;
        if (student?.gender === "NU") nu += 1;
        if (firstSessionDate.get(reg.studentId) === session.startDate) moi += 1;
      }
      return {
        sessionId: session.id,
        name: session.name,
        startDate: session.startDate,
        status: session.status,
        registrationOpen: session.registrationOpen,
        total: active.length,
        nam,
        nu,
        moi,
        taiDangKy: active.length - moi,
      };
    });
}

/** Ghép lịch sử tham gia của 1 học viên. */
export function buildStudentDetail(
  student: Student,
  registrations: Registration[],
  sessions: ClassSession[],
): StudentDetail {
  const sessionById = new Map(sessions.map((s) => [s.id, s]));
  const history = registrations
    .filter((reg) => sessionById.has(reg.sessionId))
    .map((reg) => ({
      registration: reg,
      session: sessionById.get(reg.sessionId) as ClassSession,
    }))
    .sort((a, b) => b.session.startDate.localeCompare(a.session.startDate));

  return {
    ...student,
    history,
    monthsAttended: history.filter((item) => item.registration.status !== "CANCELLED")
      .length,
  };
}

/** Đợt đang mở đăng ký (đợt có registrationOpen = true, gần nhất theo ngày bắt đầu). */
export function pickActiveSession(
  sessions: ClassSession[],
): ClassSession | null {
  const open = sessions
    .filter((s) => s.registrationOpen && s.status !== "CLOSED")
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  return open[0] ?? null;
}

export function percent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}
