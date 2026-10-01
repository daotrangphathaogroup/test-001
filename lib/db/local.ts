import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import { buildDemoData } from "@/lib/db/demo-data";
import { formatMemberCode } from "@/lib/member-code";
import { hashPassword } from "@/lib/password";
import { normalizeMemberCode } from "@/lib/utils";
import type {
  AdminUser,
  AdminUserWithPassword,
  Backend,
  ClassSession,
  NewSessionInput,
  NewStudentInput,
  Registration,
  Student,
  StudentWithPassword,
} from "@/lib/types";

interface LocalDb {
  version: number;
  /** Mã số học viên = sequence + 1 */
  sequence: number;
  students: StudentWithPassword[];
  sessions: ClassSession[];
  registrations: Registration[];
  admins: AdminUserWithPassword[];
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");

/** Mật khẩu tài khoản thư ký mặc định (nên đổi ngay sau lần đăng nhập đầu). */
export const DEFAULT_ADMIN_USERNAME = "thuky";
export const DEFAULT_ADMIN_PASSWORD =
  process.env.DEFAULT_ADMIN_PASSWORD?.trim() || "tldd@2026";

let cache: LocalDb | null = null;
let queue: Promise<unknown> = Promise.resolve();

/** Đảm bảo các thao tác ghi file không chạy song song đè lên nhau. */
function exclusive<T>(task: () => Promise<T>): Promise<T> {
  const next = queue.then(task, task);
  queue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

function buildSeedDb(): LocalDb {
  const dataset = buildDemoData({
    year: new Date().getFullYear(),
    hashPassword,
    newId: randomUUID,
  });
  const admins: AdminUserWithPassword[] = [
    {
      id: randomUUID(),
      username: DEFAULT_ADMIN_USERNAME,
      fullName: "Thư ký lớp TLDD",
      role: "SUPERADMIN",
      createdAt: new Date().toISOString(),
      passwordHash: hashPassword(DEFAULT_ADMIN_PASSWORD),
    },
  ];
  return {
    version: 1,
    sequence: dataset.students.length,
    students: dataset.students,
    sessions: dataset.sessions,
    registrations: dataset.registrations,
    admins,
  };
}

function valid(data: unknown): data is LocalDb {
  const db = data as LocalDb;
  return (
    Boolean(db) &&
    Array.isArray(db.students) &&
    Array.isArray(db.sessions) &&
    Array.isArray(db.registrations) &&
    Array.isArray(db.admins)
  );
}

async function readDb(): Promise<LocalDb> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (valid(parsed)) {
      cache = parsed;
      return cache;
    }
  } catch {
    // File chưa tồn tại hoặc hỏng -> tạo lại từ dữ liệu mẫu.
  }
  cache = buildSeedDb();
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(cache, null, 2), "utf8");
  return cache;
}

async function writeDb(db: LocalDb): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}

function publicStudent(s: StudentWithPassword): Student {
  return {
    id: s.id,
    memberCode: s.memberCode,
    fullName: s.fullName,
    gender: s.gender,
    dob: s.dob,
    photoUrl: s.photoUrl,
    parentName: s.parentName,
    parentPhone: s.parentPhone,
    address: s.address,
    healthNote: s.healthNote,
    mustChangePassword: s.mustChangePassword,
    createdAt: s.createdAt,
    lastLoginAt: s.lastLoginAt,
  };
}

function publicAdmin(a: AdminUserWithPassword): AdminUser {
  return {
    id: a.id,
    username: a.username,
    fullName: a.fullName,
    role: a.role,
    createdAt: a.createdAt,
  };
}

function byMemberCode(a: Student, b: Student): number {
  return a.memberCode.localeCompare(b.memberCode);
}

export function createLocalBackend(): Backend {
  /** Chạy task trong khoá ghi để dữ liệu luôn nhất quán. */
  const mutate = exclusive;

  return {
    name: "local",
    isReady: () => true,

    async createStudent(input: NewStudentInput & { passwordHash: string }) {
      return mutate(async () => {
        const db = await readDb();
        db.sequence += 1;
        const student: StudentWithPassword = {
          id: randomUUID(),
          memberCode: formatMemberCode(db.sequence),
          fullName: input.fullName,
          gender: input.gender,
          dob: input.dob,
          photoUrl: input.photoUrl ?? null,
          parentName: input.parentName ?? null,
          parentPhone: input.parentPhone,
          address: input.address ?? null,
          healthNote: input.healthNote ?? null,
          mustChangePassword: true,
          createdAt: new Date().toISOString(),
          lastLoginAt: null,
          passwordHash: input.passwordHash,
        };
        db.students.push(student);
        await writeDb(db);
        return publicStudent(student);
      });
    },

    async getStudentById(id) {
      const db = await readDb();
      const found = db.students.find((s) => s.id === id);
      return found ? publicStudent(found) : null;
    },

    async getStudentWithPasswordByMemberCode(memberCode) {
      const db = await readDb();
      const code = normalizeMemberCode(memberCode);
      return db.students.find((s) => s.memberCode === code) ?? null;
    },

    async updateStudent(id, patch) {
      return mutate(async () => {
        const db = await readDb();
        const found = db.students.find((s) => s.id === id);
        if (!found) throw new Error("Không tìm thấy hồ sơ học viên.");
        Object.assign(found, patch);
        await writeDb(db);
        return publicStudent(found);
      });
    },

    async updateStudentPassword(id, passwordHash, mustChangePassword) {
      return mutate(async () => {
        const db = await readDb();
        const found = db.students.find((s) => s.id === id);
        if (!found) throw new Error("Không tìm thấy hồ sơ học viên.");
        found.passwordHash = passwordHash;
        found.mustChangePassword = mustChangePassword;
        await writeDb(db);
      });
    },

    async touchStudentLogin(id) {
      return mutate(async () => {
        const db = await readDb();
        const found = db.students.find((s) => s.id === id);
        if (!found) return;
        found.lastLoginAt = new Date().toISOString();
        await writeDb(db);
      });
    },

    async listStudents() {
      const db = await readDb();
      return [...db.students].map(publicStudent).sort(byMemberCode);
    },

    async listSessions() {
      const db = await readDb();
      return [...db.sessions].sort((a, b) =>
        a.startDate.localeCompare(b.startDate),
      );
    },

    async getSessionById(id) {
      const db = await readDb();
      return db.sessions.find((s) => s.id === id) ?? null;
    },

    async createSession(input: NewSessionInput) {
      return mutate(async () => {
        const db = await readDb();
        const session: ClassSession = {
          id: randomUUID(),
          name: input.name,
          startDate: input.startDate,
          classTime: input.classTime ?? null,
          location: input.location ?? null,
          content: input.content ?? null,
          leaderName: input.leaderName ?? null,
          registrationOpen: input.registrationOpen ?? true,
          status: input.status ?? "UPCOMING",
          createdAt: new Date().toISOString(),
        };
        db.sessions.push(session);
        await writeDb(db);
        return session;
      });
    },

    async updateSession(id, patch) {
      return mutate(async () => {
        const db = await readDb();
        const found = db.sessions.find((s) => s.id === id);
        if (!found) throw new Error("Không tìm thấy khoá học.");
        Object.assign(found, patch);
        await writeDb(db);
        return found;
      });
    },

    async deleteSession(id) {
      return mutate(async () => {
        const db = await readDb();
        db.sessions = db.sessions.filter((s) => s.id !== id);
        db.registrations = db.registrations.filter(
          (r) => r.sessionId !== id,
        );
        await writeDb(db);
      });
    },

    async listRegistrations() {
      const db = await readDb();
      return [...db.registrations];
    },

    async listRegistrationsBySession(sessionId) {
      const db = await readDb();
      return db.registrations.filter((r) => r.sessionId === sessionId);
    },

    async listRegistrationsByStudent(studentId) {
      const db = await readDb();
      return db.registrations.filter((r) => r.studentId === studentId);
    },

    async getRegistration(studentId, sessionId) {
      const db = await readDb();
      return (
        db.registrations.find(
          (r) => r.studentId === studentId && r.sessionId === sessionId,
        ) ?? null
      );
    },

    async createRegistration(studentId, sessionId, confirmedSnapshot) {
      return mutate(async () => {
        const db = await readDb();
        const exists = db.registrations.find(
          (r) => r.studentId === studentId && r.sessionId === sessionId,
        );
        if (exists) throw new Error("Bạn đã đăng ký khoá học này rồi.");
        const registration: Registration = {
          id: randomUUID(),
          studentId,
          sessionId,
          status: "REGISTERED",
          confirmedSnapshot: confirmedSnapshot ?? null,
          registeredAt: new Date().toISOString(),
        };
        db.registrations.push(registration);
        await writeDb(db);
        return registration;
      });
    },

    async updateRegistrationStatus(id, status) {
      return mutate(async () => {
        const db = await readDb();
        const found = db.registrations.find((r) => r.id === id);
        if (!found) throw new Error("Không tìm thấy phiếu đăng ký.");
        found.status = status;
        await writeDb(db);
      });
    },

    async deleteRegistration(id) {
      return mutate(async () => {
        const db = await readDb();
        db.registrations = db.registrations.filter((r) => r.id !== id);
        await writeDb(db);
      });
    },

    async getAdminByUsername(username) {
      const db = await readDb();
      const key = username.trim().toLowerCase();
      return db.admins.find((a) => a.username === key) ?? null;
    },

    async getAdminById(id) {
      const db = await readDb();
      const found = db.admins.find((a) => a.id === id);
      return found ? publicAdmin(found) : null;
    },

    async listAdmins() {
      const db = await readDb();
      return db.admins
        .map(publicAdmin)
        .sort((a, b) => a.username.localeCompare(b.username));
    },

    async createAdmin(input) {
      return mutate(async () => {
        const db = await readDb();
        const username = input.username.trim().toLowerCase();
        if (db.admins.some((a) => a.username === username)) {
          throw new Error("Tên đăng nhập đã tồn tại.");
        }
        const admin: AdminUserWithPassword = {
          id: randomUUID(),
          username,
          fullName: input.fullName ?? null,
          role: input.role,
          createdAt: new Date().toISOString(),
          passwordHash: input.passwordHash,
        };
        db.admins.push(admin);
        await writeDb(db);
        return publicAdmin(admin);
      });
    },

    async updateAdminPassword(id, passwordHash) {
      return mutate(async () => {
        const db = await readDb();
        const found = db.admins.find((a) => a.id === id);
        if (!found) throw new Error("Không tìm thấy tài khoản quản trị.");
        found.passwordHash = passwordHash;
        await writeDb(db);
      });
    },

    async deleteAdmin(id) {
      return mutate(async () => {
        const db = await readDb();
        if (db.admins.length <= 1) {
          throw new Error("Phải giữ lại ít nhất 1 tài khoản quản trị.");
        }
        db.admins = db.admins.filter((a) => a.id !== id);
        await writeDb(db);
      });
    },

    async countAdmins() {
      const db = await readDb();
      return db.admins.length;
    },
  };
}
