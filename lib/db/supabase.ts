import { hasSupabaseConfig } from "@/lib/env";
import { getServiceClient } from "@/lib/supabase-client";
import { normalizeMemberCode } from "@/lib/utils";
import type {
  AdminUser,
  AdminUserWithPassword,
  Backend,
  ClassSession,
  Gender,
  NewSessionInput,
  NewStudentInput,
  Registration,
  RegistrationStatus,
  SessionStatus,
  Student,
  StudentWithPassword,
} from "@/lib/types";

interface StudentRow {
  id: string;
  member_code: string;
  full_name: string;
  gender: Gender;
  dob: string;
  photo_url: string | null;
  parent_name: string | null;
  parent_phone: string;
  address: string | null;
  health_note: string | null;
  password_hash: string;
  must_change_password: boolean;
  created_at: string;
  last_login_at: string | null;
}

interface SessionRow {
  id: string;
  name: string;
  start_date: string;
  class_time: string | null;
  location: string | null;
  content: string | null;
  leader_name: string | null;
  registration_open: boolean;
  status: SessionStatus;
  created_at: string;
}

interface RegistrationRow {
  id: string;
  student_id: string;
  session_id: string;
  status: RegistrationStatus;
  confirmed_snapshot: Record<string, string> | null;
  registered_at: string;
}

interface AdminRow {
  id: string;
  username: string;
  full_name: string | null;
  password_hash: string;
  role: AdminUser["role"];
  created_at: string;
}

function mapStudent(row: StudentRow): Student {
  return {
    id: row.id,
    memberCode: row.member_code,
    fullName: row.full_name,
    gender: row.gender,
    dob: row.dob,
    photoUrl: row.photo_url,
    parentName: row.parent_name,
    parentPhone: row.parent_phone,
    address: row.address,
    healthNote: row.health_note,
    mustChangePassword: row.must_change_password,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
  };
}

function mapSession(row: SessionRow): ClassSession {
  return {
    id: row.id,
    name: row.name,
    startDate: row.start_date,
    classTime: row.class_time,
    location: row.location,
    content: row.content,
    leaderName: row.leader_name,
    registrationOpen: row.registration_open,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapRegistration(row: RegistrationRow): Registration {
  return {
    id: row.id,
    studentId: row.student_id,
    sessionId: row.session_id,
    status: row.status,
    confirmedSnapshot: row.confirmed_snapshot,
    registeredAt: row.registered_at,
  };
}

function mapAdmin(row: AdminRow): AdminUser {
  return {
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    role: row.role,
    createdAt: row.created_at,
  };
}

function fail(scope: string, error: { message: string } | null): never {
  throw new Error(`${scope}: ${error?.message ?? "lỗi không xác định"}`);
}

export function createSupabaseBackend(): Backend {
  const client = () => getServiceClient();

  return {
    name: "supabase",
    isReady: () => hasSupabaseConfig(),

    async createStudent(input: NewStudentInput & { passwordHash: string }) {
      const { data: code, error: codeError } = await client().rpc(
        "next_member_code",
      );
      if (codeError) fail("Không sinh được mã số học viên", codeError);

      const { data, error } = await client()
        .from("students")
        .insert({
          member_code: String(code),
          full_name: input.fullName,
          gender: input.gender,
          dob: input.dob,
          photo_url: input.photoUrl ?? null,
          parent_name: input.parentName ?? null,
          parent_phone: input.parentPhone,
          address: input.address ?? null,
          health_note: input.healthNote ?? null,
          password_hash: input.passwordHash,
          must_change_password: true,
        })
        .select("*")
        .single();
      if (error) fail("Không tạo được hồ sơ học viên", error);
      return mapStudent(data as StudentRow);
    },

    async getStudentById(id) {
      const { data, error } = await client()
        .from("students")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) fail("Không đọc được hồ sơ học viên", error);
      return data ? mapStudent(data as StudentRow) : null;
    },

    async getStudentWithPasswordByMemberCode(memberCode) {
      const { data, error } = await client()
        .from("students")
        .select("*")
        .eq("member_code", normalizeMemberCode(memberCode))
        .maybeSingle();
      if (error) fail("Không đọc được hồ sơ học viên", error);
      if (!data) return null;
      const row = data as StudentRow;
      const student: StudentWithPassword = {
        ...mapStudent(row),
        passwordHash: row.password_hash,
      };
      return student;
    },

    async updateStudent(id, patch) {
      const values: Record<string, unknown> = {};
      if (patch.fullName !== undefined) values.full_name = patch.fullName;
      if (patch.gender !== undefined) values.gender = patch.gender;
      if (patch.dob !== undefined) values.dob = patch.dob;
      if (patch.photoUrl !== undefined) values.photo_url = patch.photoUrl;
      if (patch.parentName !== undefined) values.parent_name = patch.parentName;
      if (patch.parentPhone !== undefined) values.parent_phone = patch.parentPhone;
      if (patch.address !== undefined) values.address = patch.address;
      if (patch.healthNote !== undefined) values.health_note = patch.healthNote;
      if (patch.mustChangePassword !== undefined) {
        values.must_change_password = patch.mustChangePassword;
      }
      if (patch.lastLoginAt !== undefined) values.last_login_at = patch.lastLoginAt;

      const { data, error } = await client()
        .from("students")
        .update(values)
        .eq("id", id)
        .select("*")
        .single();
      if (error) fail("Không cập nhật được hồ sơ", error);
      return mapStudent(data as StudentRow);
    },

    async updateStudentPassword(id, passwordHash, mustChangePassword) {
      const { error } = await client()
        .from("students")
        .update({
          password_hash: passwordHash,
          must_change_password: mustChangePassword,
        })
        .eq("id", id);
      if (error) fail("Không đổi được mật khẩu", error);
    },

    async touchStudentLogin(id) {
      const { error } = await client()
        .from("students")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", id);
      if (error) fail("Không cập nhật được thời gian đăng nhập", error);
    },

    async listStudents() {
      const { data, error } = await client()
        .from("students")
        .select("*")
        .order("member_code", { ascending: true });
      if (error) fail("Không đọc được danh sách học viên", error);
      return ((data ?? []) as StudentRow[]).map(mapStudent);
    },

    async listSessions() {
      const { data, error } = await client()
        .from("class_sessions")
        .select("*")
        .order("start_date", { ascending: true });
      if (error) fail("Không đọc được danh sách khoá học", error);
      return ((data ?? []) as SessionRow[]).map(mapSession);
    },

    async getSessionById(id) {
      const { data, error } = await client()
        .from("class_sessions")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) fail("Không đọc được khoá học", error);
      return data ? mapSession(data as SessionRow) : null;
    },

    async createSession(input: NewSessionInput) {
      const { data, error } = await client()
        .from("class_sessions")
        .insert({
          name: input.name,
          start_date: input.startDate,
          class_time: input.classTime ?? null,
          location: input.location ?? null,
          content: input.content ?? null,
          leader_name: input.leaderName ?? null,
          registration_open: input.registrationOpen ?? true,
          status: input.status ?? "UPCOMING",
        })
        .select("*")
        .single();
      if (error) fail("Không tạo được khoá học", error);
      return mapSession(data as SessionRow);
    },

    async updateSession(id, patch) {
      const values: Record<string, unknown> = {};
      if (patch.name !== undefined) values.name = patch.name;
      if (patch.startDate !== undefined) values.start_date = patch.startDate;
      if (patch.classTime !== undefined) values.class_time = patch.classTime;
      if (patch.location !== undefined) values.location = patch.location;
      if (patch.content !== undefined) values.content = patch.content;
      if (patch.leaderName !== undefined) values.leader_name = patch.leaderName;
      if (patch.registrationOpen !== undefined) {
        values.registration_open = patch.registrationOpen;
      }
      if (patch.status !== undefined) values.status = patch.status;

      const { data, error } = await client()
        .from("class_sessions")
        .update(values)
        .eq("id", id)
        .select("*")
        .single();
      if (error) fail("Không cập nhật được khoá học", error);
      return mapSession(data as SessionRow);
    },

    async deleteSession(id) {
      const { error } = await client()
        .from("class_sessions")
        .delete()
        .eq("id", id);
      if (error) fail("Không xoá được khoá học", error);
    },

    async listRegistrations() {
      const { data, error } = await client()
        .from("registrations")
        .select("*");
      if (error) fail("Không đọc được danh sách đăng ký", error);
      return ((data ?? []) as RegistrationRow[]).map(mapRegistration);
    },

    async listRegistrationsBySession(sessionId) {
      const { data, error } = await client()
        .from("registrations")
        .select("*")
        .eq("session_id", sessionId)
        .order("registered_at", { ascending: true });
      if (error) fail("Không đọc được danh sách đăng ký", error);
      return ((data ?? []) as RegistrationRow[]).map(mapRegistration);
    },

    async listRegistrationsByStudent(studentId) {
      const { data, error } = await client()
        .from("registrations")
        .select("*")
        .eq("student_id", studentId)
        .order("registered_at", { ascending: true });
      if (error) fail("Không đọc được lịch sử học", error);
      return ((data ?? []) as RegistrationRow[]).map(mapRegistration);
    },

    async getRegistration(studentId, sessionId) {
      const { data, error } = await client()
        .from("registrations")
        .select("*")
        .eq("student_id", studentId)
        .eq("session_id", sessionId)
        .maybeSingle();
      if (error) fail("Không đọc được phiếu đăng ký", error);
      return data ? mapRegistration(data as RegistrationRow) : null;
    },

    async createRegistration(studentId, sessionId, confirmedSnapshot) {
      const { data, error } = await client()
        .from("registrations")
        .insert({
          student_id: studentId,
          session_id: sessionId,
          status: "REGISTERED",
          confirmed_snapshot: confirmedSnapshot ?? null,
        })
        .select("*")
        .single();
      if (error) {
        if (error.code === "23505") {
          throw new Error("Bạn đã đăng ký khoá học này rồi.");
        }
        fail("Không tạo được phiếu đăng ký", error);
      }
      return mapRegistration(data as RegistrationRow);
    },

    async updateRegistrationStatus(id, status) {
      const { error } = await client()
        .from("registrations")
        .update({ status })
        .eq("id", id);
      if (error) fail("Không cập nhật được trạng thái", error);
    },

    async deleteRegistration(id) {
      const { error } = await client()
        .from("registrations")
        .delete()
        .eq("id", id);
      if (error) fail("Không xoá được phiếu đăng ký", error);
    },

    async getAdminByUsername(username) {
      const { data, error } = await client()
        .from("admin_users")
        .select("*")
        .eq("username", username.trim().toLowerCase())
        .maybeSingle();
      if (error) fail("Không đọc được tài khoản quản trị", error);
      if (!data) return null;
      const row = data as AdminRow;
      const admin: AdminUserWithPassword = {
        ...mapAdmin(row),
        passwordHash: row.password_hash,
      };
      return admin;
    },

    async getAdminById(id) {
      const { data, error } = await client()
        .from("admin_users")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) fail("Không đọc được tài khoản quản trị", error);
      return data ? mapAdmin(data as AdminRow) : null;
    },

    async listAdmins() {
      const { data, error } = await client()
        .from("admin_users")
        .select("*")
        .order("username", { ascending: true });
      if (error) fail("Không đọc được danh sách quản trị", error);
      return ((data ?? []) as AdminRow[]).map(mapAdmin);
    },

    async createAdmin(input) {
      const { data, error } = await client()
        .from("admin_users")
        .insert({
          username: input.username.trim().toLowerCase(),
          full_name: input.fullName ?? null,
          password_hash: input.passwordHash,
          role: input.role,
        })
        .select("*")
        .single();
      if (error) {
        if (error.code === "23505") {
          throw new Error("Tên đăng nhập đã tồn tại.");
        }
        fail("Không tạo được tài khoản quản trị", error);
      }
      return mapAdmin(data as AdminRow);
    },

    async updateAdminPassword(id, passwordHash) {
      const { error } = await client()
        .from("admin_users")
        .update({ password_hash: passwordHash })
        .eq("id", id);
      if (error) fail("Không đổi được mật khẩu quản trị", error);
    },

    async deleteAdmin(id) {
      const { error } = await client()
        .from("admin_users")
        .delete()
        .eq("id", id);
      if (error) fail("Không xoá được tài khoản quản trị", error);
    },

    async countAdmins() {
      const { count, error } = await client()
        .from("admin_users")
        .select("*", { count: "exact", head: true });
      if (error) fail("Không đếm được tài khoản quản trị", error);
      return count ?? 0;
    },
  };
}
