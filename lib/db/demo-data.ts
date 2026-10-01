import { formatMemberCode } from "@/lib/member-code";
import type {
  ClassSession,
  Gender,
  Registration,
  RegistrationStatus,
  Student,
  StudentWithPassword,
} from "@/lib/types";

export interface DemoDataset {
  students: StudentWithPassword[];
  sessions: ClassSession[];
  registrations: Registration[];
}

export interface DemoOptions {
  /** Năm dùng cho mã số + tên khoá học. */
  year?: number;
  /** Hàm băm mật khẩu (mật khẩu của mỗi học viên = số điện thoại phụ huynh). */
  hashPassword: (plain: string) => string;
  /** Hàm sinh id duy nhất. */
  newId: () => string;
}

const HO = [
  "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Phan", "Vũ",
  "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý",
];

const TEN_NAM = [
  "An", "Bảo", "Cường", "Dũng", "Đạt", "Hải", "Hùng", "Khánh", "Long", "Minh",
  "Nam", "Phúc", "Quân", "Sơn", "Thái", "Tuấn", "Vinh", "Đức", "Kiệt", "Trung",
];

const TEN_NU = [
  "Anh", "Bích", "Chi", "Dung", "Giang", "Hà", "Hân", "Lan", "Linh", "Mai",
  "Ngọc", "Nhi", "Phương", "Quỳnh", "Thảo", "Trang", "Vy", "Yến", "Hương", "Nhung",
];

/** Số điện thoại demo dạng 0900000001 … 0900000360. */
export function demoPhone(index: number): string {
  return `09000${String(index).padStart(5, "0")}`;
}

/** Mã số + mật khẩu dùng để thử đăng nhập ở chế độ demo. */
export function demoLoginHint(year = new Date().getFullYear()): {
  memberCode: string;
  password: string;
} {
  return { memberCode: formatMemberCode(1, year), password: demoPhone(1) };
}

function tenFor(index: number, gender: Gender): string {
  const pool = gender === "NAM" ? TEN_NAM : TEN_NU;
  const a = pool[(index * 3) % pool.length] ?? "An";
  const b = pool[(index * 7 + 5) % pool.length] ?? "Bảo";
  return `${HO[index % HO.length]} ${a} ${b}`;
}

function parentNameFor(index: number, gender: Gender): string {
  const pool = gender === "NAM" ? TEN_NAM : TEN_NU;
  const ho = HO[(index + 3) % HO.length];
  const dem = index % 2 === 0 ? "Văn" : "Thị";
  return `${ho} ${dem} ${pool[(index * 5) % pool.length]}`;
}

function dobFor(index: number, year: number): string {
  const y = year - 16 + (index % 8);
  const m = String(((index * 5) % 12) + 1).padStart(2, "0");
  const d = String(((index * 7) % 26) + 1).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isoAt(year: number, month: number, index: number): string {
  const day = (index % 26) + 1;
  return new Date(
    Date.UTC(year, month - 1, day, 1, index % 60, 0),
  ).toISOString();
}

/**
 * Dữ liệu mẫu bám đúng ví dụ trong bản đặc tả:
 *  - Tháng 1: 100 nam + 100 nữ
 *  - Tháng 2: 80 nam + 110 nữ, trong đó 20 nam + 10 nữ đã học ở tháng 1
 *  - Tháng 3: đang mở đăng ký (để trống nhằm thử chức năng "đăng ký 1 chạm")
 */
export function buildDemoData(options: DemoOptions): DemoDataset {
  const year = options.year ?? new Date().getFullYear();
  const { hashPassword, newId } = options;

  const students: StudentWithPassword[] = [];
  const registrations: Registration[] = [];
  let sequence = 0;

  function addStudent(gender: Gender, month: number): StudentWithPassword {
    sequence += 1;
    const phone = demoPhone(sequence);
    const student: StudentWithPassword = {
      id: newId(),
      memberCode: formatMemberCode(sequence, year),
      fullName: tenFor(sequence, gender),
      gender,
      dob: dobFor(sequence, year),
      photoUrl: null,
      parentName: parentNameFor(sequence, gender),
      parentPhone: phone,
      address: `${(sequence % 40) + 1} Đường số ${(sequence % 12) + 1}, Khu ${(sequence % 6) + 1}`,
      healthNote: null,
      mustChangePassword: false,
      createdAt: isoAt(year, month, sequence),
      lastLoginAt: null,
      passwordHash: hashPassword(phone),
    };
    students.push(student);
    return student;
  }

  const t1Nam = Array.from({ length: 100 }, () => addStudent("NAM", 1));
  const t1Nu = Array.from({ length: 100 }, () => addStudent("NU", 1));
  const t2NamNew = Array.from({ length: 60 }, () => addStudent("NAM", 2));
  const t2NuNew = Array.from({ length: 100 }, () => addStudent("NU", 2));

  const sessions: ClassSession[] = [
    {
      id: newId(),
      name: `Khoá Tháng 1 – ${year}`,
      startDate: `${year}-01-11`,
      classTime: "14:00 – 16:30, Chúa nhật hằng tuần",
      location: "Hội trường Giáo xứ",
      content: "Bài 1: Nhân bản – nền tảng của đời sống đạo đức.",
      leaderName: "Huynh trưởng Gioan Trần Minh",
      registrationOpen: false,
      status: "CLOSED",
      createdAt: isoAt(year, 1, 1),
    },
    {
      id: newId(),
      name: `Khoá Tháng 2 – ${year}`,
      startDate: `${year}-02-08`,
      classTime: "14:00 – 16:30, Chúa nhật hằng tuần",
      location: "Hội trường Giáo xứ",
      content: "Bài 2: Đức ái – yêu thương như Chúa đã yêu.",
      leaderName: "Huynh trưởng Maria Phạm Thảo",
      registrationOpen: false,
      status: "CLOSED",
      createdAt: isoAt(year, 2, 1),
    },
    {
      id: newId(),
      name: `Khoá Tháng 3 – ${year}`,
      startDate: `${year}-03-08`,
      classTime: "14:00 – 16:30, Chúa nhật hằng tuần",
      location: "Hội trường Giáo xứ",
      content: "Bài 3: Khiêm nhường và phục vụ.",
      leaderName: "Huynh trưởng Giuse Vũ Nam",
      registrationOpen: true,
      status: "UPCOMING",
      createdAt: isoAt(year, 3, 1),
    },
  ];

  const thang1 = sessions[0] as ClassSession;
  const thang2 = sessions[1] as ClassSession;

  function enroll(
    student: Student,
    session: ClassSession,
    status: RegistrationStatus,
    month: number,
  ): void {
    registrations.push({
      id: newId(),
      studentId: student.id,
      sessionId: session.id,
      status,
      confirmedSnapshot: null,
      registeredAt: isoAt(year, month, registrations.length + 1),
    });
  }

  for (const student of [...t1Nam, ...t1Nu]) {
    enroll(student, thang1, "ATTENDED", 1);
  }

  const t2Nam = [...t1Nam.slice(0, 20), ...t2NamNew];
  const t2Nu = [...t1Nu.slice(0, 10), ...t2NuNew];
  for (const student of [...t2Nam, ...t2Nu]) {
    enroll(student, thang2, "ATTENDED", 2);
  }

  return { students, sessions, registrations };
}
