// Kiểu dữ liệu dùng chung cho toàn bộ ứng dụng "Lớp Tâm Lí Đạo Đức" (TLDD).

export type Gender = "NAM" | "NU";
export type RegistrationStatus =
  | "REGISTERED"
  | "ATTENDED"
  | "ABSENT"
  | "CANCELLED";
export type SessionStatus = "UPCOMING" | "ONGOING" | "CLOSED";
export type AdminRole = "SECRETARY" | "SUPERADMIN";

/** Học viên (tài khoản đăng nhập = 1 học viên). */
export interface Student {
  id: string;
  memberCode: string;
  fullName: string;
  gender: Gender;
  /** yyyy-mm-dd */
  dob: string;
  photoUrl: string | null;
  parentName: string | null;
  parentPhone: string;
  address: string | null;
  healthNote: string | null;
  mustChangePassword: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface StudentWithPassword extends Student {
  passwordHash: string;
}

/** Đợt / khóa học, mỗi tháng 1 bản ghi. "Reset" = tạo đợt mới, không xoá dữ liệu. */
export interface ClassSession {
  id: string;
  name: string;
  /** yyyy-mm-dd */
  startDate: string;
  classTime: string | null;
  location: string | null;
  content: string | null;
  /** Huynh trưởng phụ trách */
  leaderName: string | null;
  registrationOpen: boolean;
  status: SessionStatus;
  createdAt: string;
}

export interface Registration {
  id: string;
  studentId: string;
  sessionId: string;
  status: RegistrationStatus;
  /** Ảnh chụp thông tin tại thời điểm xác nhận đăng ký. */
  confirmedSnapshot: Record<string, string> | null;
  registeredAt: string;
}

export interface AdminUser {
  id: string;
  username: string;
  fullName: string | null;
  role: AdminRole;
  createdAt: string;
}

export interface AdminUserWithPassword extends AdminUser {
  passwordHash: string;
}

export interface RegistrationWithStudent extends Registration {
  student: Student;
}

export interface StudentHistoryItem {
  registration: Registration;
  session: ClassSession;
}

export interface StudentDetail extends Student {
  history: StudentHistoryItem[];
  /** Số đợt học viên đã tham gia (không tính đợt đã huỷ). */
  monthsAttended: number;
}

export interface SessionStats {
  sessionId: string;
  name: string;
  startDate: string;
  status: SessionStatus;
  registrationOpen: boolean;
  total: number;
  nam: number;
  nu: number;
  /** Học viên tham gia lần đầu ở đợt này. */
  moi: number;
  /** Học viên đã từng tham gia đợt trước đó. */
  taiDangKy: number;
}

export interface NewStudentInput {
  fullName: string;
  gender: Gender;
  dob: string;
  photoUrl?: string | null;
  parentName?: string | null;
  parentPhone: string;
  address?: string | null;
  healthNote?: string | null;
}

export interface NewSessionInput {
  name: string;
  startDate: string;
  classTime?: string | null;
  location?: string | null;
  content?: string | null;
  leaderName?: string | null;
  registrationOpen?: boolean;
  status?: SessionStatus;
}

export type ActionResult =
  | { ok: true; message?: string; redirectTo?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

/**
 * Cổng truy cập dữ liệu. Có 2 hiện thực:
 *  - supabase: Postgres của Supabase (dùng cho production / Vercel)
 *  - local: file JSON trong .data/db.json (chế độ DEMO OFFLINE khi chưa cấu hình Supabase)
 */
export interface Backend {
  readonly name: "supabase" | "local";
  /** true nếu backend sẵn sàng phục vụ. */
  isReady(): boolean;

  // --- Học viên ---
  createStudent(input: NewStudentInput & { passwordHash: string }): Promise<Student>;
  getStudentById(id: string): Promise<Student | null>;
  getStudentWithPasswordByMemberCode(
    memberCode: string,
  ): Promise<StudentWithPassword | null>;
  updateStudent(
    id: string,
    patch: Partial<Omit<Student, "id" | "memberCode" | "createdAt">>,
  ): Promise<Student>;
  updateStudentPassword(
    id: string,
    passwordHash: string,
    mustChangePassword: boolean,
  ): Promise<void>;
  touchStudentLogin(id: string): Promise<void>;
  listStudents(): Promise<Student[]>;

  // --- Đợt học ---
  listSessions(): Promise<ClassSession[]>;
  getSessionById(id: string): Promise<ClassSession | null>;
  createSession(input: NewSessionInput): Promise<ClassSession>;
  updateSession(
    id: string,
    patch: Partial<Omit<ClassSession, "id" | "createdAt">>,
  ): Promise<ClassSession>;
  deleteSession(id: string): Promise<void>;

  // --- Đăng ký ---
  listRegistrations(): Promise<Registration[]>;
  listRegistrationsBySession(sessionId: string): Promise<Registration[]>;
  listRegistrationsByStudent(studentId: string): Promise<Registration[]>;
  getRegistration(
    studentId: string,
    sessionId: string,
  ): Promise<Registration | null>;
  createRegistration(
    studentId: string,
    sessionId: string,
    confirmedSnapshot?: Record<string, string> | null,
  ): Promise<Registration>;
  updateRegistrationStatus(
    id: string,
    status: RegistrationStatus,
  ): Promise<void>;
  deleteRegistration(id: string): Promise<void>;

  // --- Quản trị ---
  getAdminByUsername(username: string): Promise<AdminUserWithPassword | null>;
  getAdminById(id: string): Promise<AdminUser | null>;
  listAdmins(): Promise<AdminUser[]>;
  createAdmin(input: {
    username: string;
    fullName?: string | null;
    passwordHash: string;
    role: AdminRole;
  }): Promise<AdminUser>;
  updateAdminPassword(id: string, passwordHash: string): Promise<void>;
  deleteAdmin(id: string): Promise<void>;
  countAdmins(): Promise<number>;
}
