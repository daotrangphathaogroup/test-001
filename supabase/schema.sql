-- ============================================================
-- TRANG WEB ONLINE – LỚP TÂM LÍ ĐẠO ĐỨC (TLDD)
-- Chạy toàn bộ file này trong Supabase → SQL Editor → New query → Run
-- ============================================================

-- 1) Chuỗi sinh mã số học viên (TLDD-<năm>-<4 chữ số>)
create sequence if not exists member_code_seq;

create or replace function next_member_code()
returns text
language plpgsql
as $$
declare
  v_year int := extract(year from now())::int;
begin
  return 'TLDD-' || v_year || '-' || lpad(nextval('member_code_seq')::text, 4, '0');
end;
$$;

-- 2) Bảng học viên -------------------------------------------------
create table if not exists students (
  id                  uuid primary key default gen_random_uuid(),
  member_code         text        not null unique,
  full_name           text        not null,
  gender              text        not null check (gender in ('NAM','NU')),
  dob                 date        not null,
  photo_url           text,
  parent_name         text,
  parent_phone        text        not null,
  address             text,
  health_note         text,
  password_hash       text        not null,
  must_change_password boolean    not null default true,
  created_at          timestamptz not null default now(),
  last_login_at       timestamptz
);
create index if not exists students_gender_idx on students (gender);
create index if not exists students_created_idx on students (created_at);

-- 3) Đợt / khóa học ------------------------------------------------
create table if not exists class_sessions (
  id                 uuid primary key default gen_random_uuid(),
  name               text        not null,
  start_date         date        not null,
  class_time         text,
  location           text,
  content            text,
  leader_name        text,
  registration_open  boolean     not null default false,
  status             text        not null default 'UPCOMING'
                     check (status in ('UPCOMING','ONGOING','CLOSED')),
  created_at         timestamptz not null default now()
);
create index if not exists class_sessions_open_idx on class_sessions (registration_open, start_date);

-- 4) Phiếu đăng ký tham gia ----------------------------------------
create table if not exists registrations (
  id                  uuid primary key default gen_random_uuid(),
  student_id          uuid not null references students(id) on delete cascade,
  session_id          uuid not null references class_sessions(id) on delete cascade,
  status              text not null default 'REGISTERED'
                      check (status in ('REGISTERED','ATTENDED','ABSENT','CANCELLED')),
  confirmed_snapshot  jsonb,
  registered_at       timestamptz not null default now(),
  unique (student_id, session_id)
);
create index if not exists registrations_session_idx on registrations (session_id);
create index if not exists registrations_student_idx on registrations (student_id);

-- 5) Tài khoản quản trị (thư ký) -----------------------------------
create table if not exists admin_users (
  id            uuid primary key default gen_random_uuid(),
  username      text        not null unique,
  full_name     text,
  password_hash text        not null,
  role          text        not null default 'SECRETARY'
                check (role in ('SECRETARY','SUPERADMIN')),
  created_at    timestamptz not null default now()
);

-- 6) Thông báo (mở rộng) -------------------------------------------
create table if not exists announcements (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  body         text,
  pinned       boolean not null default false,
  session_id   uuid references class_sessions(id) on delete set null,
  published_at timestamptz not null default now()
);

-- 7) Bảo mật: KHÔNG có policy nào cho anon/authenticated.
--    Toàn bộ truy cập đi qua khoá SERVICE ROLE phía server (Next.js Server Action).
alter table students        enable row level security;
alter table class_sessions  enable row level security;
alter table registrations   enable row level security;
alter table admin_users     enable row level security;
alter table announcements   enable row level security;

-- 8) Mở rộng -------------------------------------------------------
--    Không cần tạo tài khoản thư ký trong SQL: ứng dụng sẽ tự hiển thị
--    màn "Tạo tài khoản thư ký đầu tiên" (/admin/tao-tai-khoan) khi
--    bảng admin_users còn trống. Bảo mật nhờ điều kiện số lượng = 0.
