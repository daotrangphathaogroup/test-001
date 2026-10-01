#!/usr/bin/env python3
"""Kiểm tra luồng chính của app TLDD qua HTTP (chế độ demo offline)."""
import html
import re
import sys
import urllib.request
import urllib.parse
import http.cookiejar

BASE = "http://localhost:3000"
jar = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))

failures = []


def check(label, cond, extra=""):
    print(("PASS  " if cond else "FAIL  ") + label + ("" if cond else " :: " + str(extra)))
    if not cond:
        failures.append(label)


def get(path):
    with opener.open(BASE + path) as r:
        return r.geturl(), r.read().decode("utf-8", "replace")


def post(path, data):
    boundary = "----TlddBoundary7MA4YWxkTrZu0gW"
    lines = []
    for k, v in data.items():
        lines.append(f"--{boundary}")
        lines.append(f'Content-Disposition: form-data; name="{k}"')
        lines.append("")
        lines.append(str(v))
    lines.append(f"--{boundary}--")
    lines.append("")
    body = "\r\n".join(lines).encode()
    req = urllib.request.Request(BASE + path, data=body, method="POST")
    req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
    try:
        with opener.open(req) as r:
            return r.geturl(), r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.geturl(), e.code, e.read().decode("utf-8", "replace")


def forms(page):
    """Mã HTML của từng <form> trên trang."""
    return re.findall(r"<form[^>]*>.*?</form>", page, re.S)


def action_fields(form_html):
    """Lấy các input $ACTION ẩn của form (giữ nguyên giá trị đã escape)."""
    out = {}
    for m in re.finditer(r"<input[^>]*>", form_html):
        tag = m.group(0)
        name = re.search(r'name="(\$ACTION[^"]*)"', tag)
        if not name:
            continue
        value = re.search(r'value="([^"]*)"', tag)
        out[html.unescape(name.group(1))] = (
            html.unescape(value.group(1)) if value else ""
        )
    return out


def find_form(page, *markers):
    """Chọn form chứa đủ các name=... được chỉ định."""
    for form_html in forms(page):
        if all(f'name="{m}"' in form_html for m in markers):
            return form_html
    return None


def submit(page, path, markers, extra):
    form_html = find_form(page, *markers)
    if form_html is None:
        return None, 0, f"không tìm thấy form {markers}"
    payload = {**action_fields(form_html), **extra}
    return post(path, payload)


# ---------------------------------------------------------------- 1. Trang chủ
_, home = get("/")
check("Trang chủ hiển thị banner demo", "Chế độ demo offline" in home)
check("Trang chủ có đợt đang mở đăng ký", "Đang mở đăng ký" in home)

# ------------------------------------------------------- 2. Đăng ký học viên
_, reg_page = get("/dang-ky")
check(
    "Trang đăng ký có form",
    find_form(reg_page, "fullName", "password") is not None,
)
url, status, body = submit(
    reg_page,
    "/dang-ky",
    ("fullName", "password2"),
    {
        "fullName": "Nguyễn Văn Thí Nghiệm",
        "gender": "NAM",
        "dob": "2010-05-04",
        "parentName": "Nguyễn Văn Bố",
        "parentPhone": "0912345678",
        "address": "123 Đường Test",
        "healthNote": "",
        "photoUrl": "",
        "password": "MatKhau2026",
        "password2": "MatKhau2026",
    },
)
check("Đăng ký chuyển tới trang thành công", bool(url) and "dang-ky/thanh-cong" in url, f"{status} {url}")
code = ""
m = re.search(r"code=([^&]+)", url or "")
if m:
    code = urllib.parse.unquote(m.group(1))
check("Nhận được mã số cá nhân", bool(re.fullmatch(r"TLDD-\d{4}-\d{4}", code)), code)
print("      Mã số:", code)

# --------------------------------------------------------------- 3. Đăng nhập
_, login_page = get("/dang-nhap")
url, status, body = submit(
    login_page, "/dang-nhap", ("memberCode", "password"),
    {"memberCode": code, "password": "MatKhau2026"},
)
check(
    "Đăng nhập -> bắt buộc đổi mật khẩu",
    bool(url) and "tai-khoan/doi-mat-khau" in url,
    f"{status} {url}",
)

# ------------------------------------------------- 4. Đổi mật khẩu bắt buộc
_, change_page = get("/tai-khoan/doi-mat-khau")
check("Trang đổi mật khẩu hiển thị cảnh báo", "bắt buộc đổi mật khẩu" in change_page.lower() or "Đổi mật khẩu" in change_page)
url, status, body = submit(
    change_page, "/tai-khoan/doi-mat-khau", ("currentPassword", "confirmPassword"),
    {
        "currentPassword": "MatKhau2026",
        "newPassword": "ThongMinh2026",
        "confirmPassword": "ThongMinh2026",
    },
)
check("Đổi mật khẩu -> về /tai-khoan", bool(url) and url.rstrip("/").endswith("/tai-khoan"), f"{status} {url}")

# ------------------------------------------------------------ 5. Trang tài khoản
_, account = get("/tai-khoan")
check("Trang tài khoản hiển thị học viên", "Nguyễn Văn Thí Nghiệm" in account)
check("Trang tài khoản hiển thị mã số", code in account)
check("Trang tài khoản có nút đăng ký tháng", "/dang-ky-tham-gia" in account)

# --------------------------------------------- 6. Đăng ký tham gia (1 chạm)
_, enroll_page = get("/dang-ky-tham-gia")
session_id = re.search(r'name="sessionId" value="([^"]+)"', enroll_page)
check("Trang đăng ký tháng có đợt học", session_id is not None)
if session_id:
    url, status, body = submit(
        enroll_page, "/dang-ky-tham-gia", ("sessionId",),
        {"sessionId": session_id.group(1)},
    )
    _, enroll_page2 = get("/dang-ky-tham-gia")
    check("Đăng ký tham gia thành công", "Bạn đã đăng ký đợt học này" in enroll_page2)

# --------------------------------------------------------------- 7. Lịch sử
_, history = get("/lich-su")
check("Trang lịch sử có đợt học", "Khoá Tháng 3" in history)
check("Trang lịch sử có mã số", code in history)

# ------------------------------------------------------------ 8. Tra cứu
_, lookup = get(f"/tra-cuu?code={urllib.parse.quote(code)}&dob=2010-05-04")
check("Tra cứu tìm thấy hồ sơ", "Nguyễn Văn Thí Nghiệm" in lookup)
_, lookup_bad = get(f"/tra-cuu?code={urllib.parse.quote(code)}&dob=2000-01-01")
check("Tra cứu sai ngày sinh bị từ chối", "Không tìm thấy hồ sơ" in lookup_bad)

# ------------------------------------------------- 9. Đăng nhập admin
_, alogin = get("/admin/login")
url, status, body = submit(
    alogin, "/admin/login", ("username", "password"),
    {"username": "thuky", "password": "tldd@2026"},
)
check("Đăng nhập admin -> /admin", bool(url) and url.rstrip("/").endswith("/admin"), f"{status} {url}")

# --------------------------------------------------------------- 10. Dashboard
_, dash = get("/admin")
check("Dashboard hiện học viên", "Học viên đã đăng ký" in dash)
check("Dashboard có bảng thống kê đợt", "Thống kê theo đợt học" in dash)
check("Dashboard có chỉ số Nam/Nữ/Mới/Tái", all(k in dash for k in ("Lượt Nam", "Lượt Nữ", "Mới", "Tái")))

# ------------------------------------------------------- 11. Các trang admin
for path, marker in [
    ("/admin/dot-hoc", "Danh sách đợt học"),
    ("/admin/dang-ky", "Xuất CSV"),
    ("/admin/hoc-vien", "Xuất CSV"),
    ("/admin/tai-khoan", "Tài khoản hiện có"),
]:
    _, page = get(path)
    check(f"Trang {path} mở được", marker in page, "thiếu marker")

# ------------------------------------------------------- 12. Tạo đợt học mới
_, sform_page = get("/admin/dot-hoc")
url, status, body = submit(
    sform_page, "/admin/dot-hoc", ("name", "startDate"),
    {
        "id": "",
        "name": "Khoá Tháng 12 – 2026",
        "startDate": "2026-12-06",
        "classTime": "08:00 - 11:00",
        "location": "Nhà văn hoá Test",
        "content": "Nội dung thử",
        "leaderName": "Trưởng đoàn Test",
        "status": "UPCOMING",
        "registrationOpen": "false",
    },
)
check("Tạo đợt học -> /admin/dot-hoc", bool(url) and url.rstrip("/").endswith("/admin/dot-hoc"), f"{status} {url}")
_, sessions_page = get("/admin/dot-hoc")
check("Đợt học mới xuất hiện trong danh sách", "Khoá Tháng 12 – 2026" in sessions_page)

# ------------------------------------------------------------ 13. Mở đăng ký
toggle = find_form(sessions_page, "next")
if toggle:
    sid = re.search(r'name="id" value="([^"]+)"', toggle)
    if sid and "Khoá Tháng 12" in sessions_page:
        pass
check("Có form bật/tắt đăng ký", toggle is not None)

# --------------------------------------------------------------- 14. Xuất CSV
with opener.open(BASE + "/api/export?type=students") as r:
    csv = r.read().decode("utf-8-sig")
check("Xuất CSV học viên", "Mã số" in csv and code in csv)

with opener.open(BASE + "/api/export?type=registrations") as r:
    csv2 = r.read().decode("utf-8-sig")
check("Xuất CSV đăng ký", "Đợt học" in csv2)

# ------------------------------------------------- 15. Quản lý tài khoản admin
_, acc_page = get("/admin/tai-khoan")
url, status, body = submit(
    acc_page, "/admin/tai-khoan", ("username", "password", "role"),
    {
        "username": "thuky02",
        "fullName": "Thư Ký Số 2",
        "password": "BaoMat2026!",
        "role": "SECRETARY",
    },
)
_, acc_page2 = get("/admin/tai-khoan")
check("Tạo thêm tài khoản thư ký", "thuky02" in acc_page2)

# ------------------------------------- 16. Đổi trạng thái phiếu đăng ký
_, reg_admin = get("/admin/dang-ky")
march = re.search(r'href="(/admin/dang-ky\?s=[^"]+)"[^>]*>\s*(Khoá Tháng 3)', reg_admin)
check("Có tab đợt Tháng 3", march is not None)
if march:
    _, march_page = get(march.group(1))
    found = None
    for f in forms(march_page):
        if 'name="registrationId"' in f and 'name="status"' in f:
            found = f
            break
    check("Trang đăng ký có form đổi trạng thái", found is not None)
    if found:
        rid = re.search(r'name="registrationId" value="([^"]+)"', found).group(1)
        payload = {**action_fields(found), "registrationId": rid, "status": "ATTENDED"}
        post(march.group(1), payload)
        _, march_page2 = get(march.group(1))
        check("Trạng thái 'Có mặt' được lưu", "Có mặt" in march_page2)

# ------------------------------------- 17. Mở / đóng đăng ký đợt học
_, dot_page = get("/admin/dot-hoc")
toggle = find_form(dot_page, "next")
check("Có form mở/đóng đăng ký", toggle is not None)
if toggle:
    sid = re.search(r'name="id" value="([^"]+)"', toggle).group(1)
    nxt = re.search(r'name="next" value="([^"]+)"', toggle).group(1)
    post("/admin/dot-hoc", {**action_fields(toggle), "id": sid, "next": nxt})
    _, dot_page2 = get("/admin/dot-hoc")
    want = "Mở đăng ký" if nxt == "false" else "Đóng đăng ký"
    check(f"Trạng thái đổi thành '{want}'", want in dot_page2)

print()
if failures:
    print(f"{len(failures)} FAILURES: {failures}")
    sys.exit(1)
print("ALL PASS")
