# Lớp Tâm Lí Đạo Đức (TLDD) — Hệ thống đăng ký trực tuyến

Thay thế quy trình đăng ký bằng Google Form bằng một web app: học viên tạo hồ
sơ → nhận **mã số cá nhân** `TLDD-YYYY-NNNN` → mỗi tháng bấm **một chạm** để
đăng ký tham gia; thư ký theo dõi danh sách và thống kê **Nam / Nữ / Mới / Tái**
tự động.

**Stack:** Next.js 16 (App Router, Server Actions) · Supabase (Postgres +
Storage) · Vercel · Tailwind CSS 4 · Zod · scrypt (băm mật khẩu, không dùng
Supabase Auth).

---

## 1. Chạy thử ngay (chế độ demo offline)

Không cần Supabase, dữ liệu lưu tại `.data/db.json` với dữ liệu mẫu:

```bash
npm install
npm run dev
```

Mở <http://localhost:3000>.

> Chế độ demo **chỉ chạy với `npm run dev`**. `npm start` (production) sẽ báo
> lỗi yêu cầu cấu hình Supabase — đây là hành vi có chủ đích để tránh chạy
> dữ liệu giả trên Vercel. Muốn chạy demo trên production build:
> `TLDD_LOCAL_DEMO=1 npm start`.

**Tài khoản có sẵn trong bản demo**

| Loại | Tên đăng nhập / Mã số | Mật khẩu |
| --- | --- | --- |
| Học viên (ví dụ) | `TLDD-2026-0001` | mật khẩu đã đặt khi đăng ký (hoặc số ĐT phụ huynh nếu dùng “Quên mật khẩu”) |
| Thư ký / Quản trị | `thuky` | `tldd@2026` |

Xóa `.data/db.json` để tạo lại dữ liệu mẫu.

---

## 2. Cấu hình Supabase (production)

### 2.1 Tạo dự án

1. Vào <https://supabase.com> → **New project**.
2. Mở **SQL Editor** → **New query** → dán toàn bộ nội dung
   [`supabase/schema.sql`](./supabase/schema.sql) → **Run**.

   File tạo bảng `students`, `class_sessions`, `registrations`, `admin_users`,
   `announcements`, hàm sinh mã `next_member_code()`, sequence
   `member_code_seq` và bật **Row Level Security** (không có policy nào ⇒
   `anon` không đọc được gì; mọi truy cập đi qua khoá SERVICE ROLE ở server).

### 2.2 Lưu ảnh đại diện (Storage)

`lib/storage.ts` tự tạo bucket `avatars` khi upload lần đầu. Nếu muốn tạo
trước: **Storage → New bucket → Name: `avatars` → Public bucket: ON**.

> Bucket chỉ cần **public read**; việc upload chỉ xảy ra ở Server Action (kèm
> khoá service role), vì vậy **không** bật “Public upload”.

### 2.3 Lấy khoá API

**Project Settings → API** → sao chép:

- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### 2.4 Tạo tài khoản thư ký đầu tiên

Không cần seed bằng SQL. Truy cập **`/admin/tao-tai-khoan`** — màn hình chỉ
hoạt động khi bảng `admin_users` còn trống; tạo xong nó tự khóa và chuyển về
`/admin/login`.

---

## 3. Deploy lên Vercel

```bash
npm i -g vercel
vercel
```

Hoặc kết nối repo tại <https://vercel.com/new> (Framework preset: **Next.js**).

**Settings → Environment Variables** — thêm:

| Tên | Ghi chú |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key (giữ bí mật) |
| `AUTH_SECRET` | **Bắt buộc** — ký cookie phiên. Tạo: `openssl rand -base64 48` |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.vercel.app` |

Danh sách đầy đủ xem [.env.example](./.env.example).

> Nếu thiếu `AUTH_SECRET`, app dùng giá trị mặc định **chỉ dành cho dev**.
> Trên production bạn **phải** đặt giá trị riêng.

---

## 4. Hướng dẫn sử dụng

### Học viên

1. **Đăng ký học viên** (`/dang-ky`) → nhận mã số cá nhân kèm **mã QR**.
2. **Đăng nhập** (`/dang-nhap`) bằng mã số. Lần đầu **bắt buộc đổi mật khẩu**.
3. **Đăng ký tháng** (`/dang-ky-tham-gia`) → bấm **“Đăng ký tham gia — một
   chạm”** là xong.
4. Xem **Lịch sử** (`/lich-su`), **Chỉnh sửa hồ sơ**, **Tra cứu** (`/tra-cuu`,
   mã số + ngày sinh).

Quên mật khẩu → `/quen-mat-khau`: khớp **mã số + số ĐT phụ huynh** → đặt lại
mật khẩu tạm = số ĐT → bắt buộc đổi lại ngay.

### Thư ký / Quản trị (`/admin`)

| Trang | Việc cần làm |
| --- | --- |
| Tổng quan | Thống kê Tổng / Nam / Nữ / **Mới** / **Tái** theo từng đợt |
| Đợt học | Tạo đợt mới mỗi tháng, **Mở/Đóng đăng ký**, sửa, xoá |
| Đăng ký | Chọn đợt → danh sách + đổi trạng thái (Đã đăng ký / Có mặt / Vắng / Đã huỷ) · **In** · **Xuất CSV** |
| Học viên | Tìm kiếm, **In**, **Xuất CSV** |
| Tài khoản | Thêm/xoá tài khoản thư ký, đặt lại mật khẩu *(chỉ Quản trị cao)* |

**Quy ước nghiệp vụ**

- Đợt học **tạo mới** mỗi tháng; **không xoá** đợt cũ để giữ số liệu.
- Thống kê chỉ tính phiếu **không bị huỷ**.
- “Mới” = học viên có đợt này là đợt đầu tiên họ tham gia; còn lại là “Tái”.

---

## 5. Kiến trúc

```
app/                     # Trang (App Router, tất cả force-dynamic)
  dang-ky/ tra-cuu/ dang-nhap/ quen-mat-khau/
  dang-ky-tham-gia/ lich-su/ tai-khoan/...
  admin/                 # admin, dot-hoc, dang-ky, hoc-vien, tai-khoan, login
  api/export/             # Xuất CSV (kiểm tra phiên quản trị)
actions/                 # Server Actions (public, student, admin)
components/              # UI dùng chung
lib/
  db/                    # Cổng dữ liệu 2 chế độ
    index.ts             #   getBackend(): Supabase hoặc Local
    supabase.ts           #   Backend trên Postgres (khoá service role)
    local.ts              #   Backend trên file .data/db.json (demo)
    demo-data.ts          #   Dữ liệu mẫu 3 đợt, 360 học viên
  session.ts             # Cookie phiên HMAC (STUDENT / SECRETARY / SUPERADMIN)
  password.ts            # scrypt hash + chính sách mật khẩu
  validation.ts           # Zod schemas
  stats.ts               # computeSessionStats, buildStudentDetail
supabase/schema.sql       # Toàn bộ schema + RLS
```

**Tại sao không dùng Supabase Auth?** Nghiệp vụ yêu cầu đăng nhập bằng *mã số
cá nhân* và mật khẩu mặc định = *số ĐT phụ huynh* — không có email. Dùng cookie
tự ký giúp kiểm soát chính xác luồng “bắt buộc đổi mật khẩu” và giữ toàn bộ
logic trong một codebase.

**Bảo mật đã có**

- Mật khẩu băm bằng **scrypt** (N=16384, salt 16 byte, so sánh `timingSafeEqual`).
- Cookie phiên **HMAC-SHA256**, `httpOnly`, `sameSite=lax`, `secure` ở production, hạn 30 ngày.
- **Rate limit** in-memory cho đăng nhập / đăng ký / quên mật khẩu.
- **RLS bật, không có policy** ⇒ `anon` key không đọc/ghi được gì.
- Đăng ký lưu **snapshot** thông tin học viên tại thời điểm xác nhận.
- Tra cứu công khai chỉ trả về **SĐT đã che số** (`090***678`).

**Hạn chế cần biết**

- Rate limit lưu trong bộ nhớ tiến trình — trên Vercel mỗi instance riêng; nếu
  cần chính xác tuyệt đối hãy thay bằng Upstash Redis.
- Chế độ demo local không dùng được trên Vercel serverless (file system chỉ
  đọc/ghi tạm) — production **bắt buộc** cấu hình Supabase.
- Chưa có bước xác nhận qua SMS/Email — phòng khi nghiệp vụ yêu cầu.

---

## 6. Lệnh thường dùng

```bash
npm run dev      # chạy local (demo offline)
npm run build    # build production
npm start        # chạy production (yêu cầu cấu hình Supabase)
npm run lint     # eslint
npx tsc --noEmit # kiểm tra kiểu
```

## 7. Kiểm thử tự động

`scripts/smoke-test.py` chạy toàn bộ luồng chính qua HTTP (37 kiểm thử):
đăng ký → đăng nhập → bắt buộc đổi mật khẩu → đăng ký tham gia → lịch sử →
tra cứu → admin (đăng nhập, dashboard, tạo đợt, đổi trạng thái, mở/đóng đăng
ký, xuất CSV, quản lý tài khoản).

```bash
npm run dev                 # terminal 1
python3 scripts/smoke-test.py   # terminal 2 (cần Python 3)
```

Script mô phỏng trình duyệt (gửi multipart kèm `$ACTION_*`), không cần trình
duyệt headless.