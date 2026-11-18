# Hướng dẫn chạy Frontend — Nexus

> Frontend được lấy từ nhánh `fe-init2` của
> `https://git.fsoft-academy.edu.vn/hcm26_cpl_java_11/hcm26_cpl_java_11_group_1`
> **Chỉ lấy thư mục `frontend/`**. Toàn bộ `backend/` giữ nguyên code hiện tại của bạn.

---

## 1. Đã làm gì

| Bước | Chi tiết |
|---|---|
| Thêm remote | `git remote add fsoft <gitlab-fsoft-url>` |
| Fetch nhánh | `git fetch fsoft fe-init2` → `fsoft/fe-init2` |
| Tạo nhánh | `git checkout -b fe-init2` (tách từ `main`) |
| Chỉ lấy FE | `git checkout fsoft/fe-init2 -- frontend` → **88 file** |
| Commit | `a437b8f feat(frontend): import FE from fsoft fe-init2 branch` |

Kiểm chứng: `git diff --cached --name-only` chỉ có đường dẫn bắt đầu bằng `frontend/`,
không một file nào thuộc `backend/`.

> **Vì sao chọn `fe-init2`?** Trên remote, nhánh `main` chỉ có `frontend/.gitkeep`
> (1 file rỗng). Toàn bộ 88 file FE nằm ở `fe-init2`.

---

## 2. Chạy Frontend

```powershell
cd D:\FPTU\semester_6\OJT\frontend
npm install          # lần đầu, ~68 package
npm run dev          # http://localhost:5173
```

Các lệnh khác:

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Dev server + HMR, cổng **5173** |
| `npm run build` | Build production vào `dist/` |
| `npm run preview` | Xem thử bản build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `oxlint` |
| `npm test` / `node --test` | Chạy test |

---

## 3. Cấu hình API endpoint

File `frontend/.env.local` (đã tạo, **không commit** — nằm trong `.gitignore`):

```
VITE_API_BASE_URL=http://localhost:8080
```

Đây là **origin** thôi, FE tự thêm `/api/v1/auth`.
Đổi cổng BE thì sửa file này rồi restart `npm run dev`.

---

## 4. Chạy kèm Backend

Cần cả hai chạy song song:

```
Terminal 1:  D:\FPTU\semester_6\OJT>  .\run-backend.cmd        ->  http://localhost:8080
Terminal 2:  D:\FPTU\semester_6\OJT\frontend>  npm run dev     ->  http://localhost:5173
```

Mở trình duyệt: <http://localhost:5173/login>

### CORS

BE của bạn đã cho phép sẵn `http://localhost:5173`:

```
backend\.env  ->  CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

Nếu đổi cổng FE (ví dụ 3000) thì phải thêm origin đó vào `CORS_ALLOWED_ORIGINS` trong `backend\.env`.

---

## 5. Vì sao FE này tương thích với BE hiện tại của bạn

FE `fe-init2` được viết cho BE dùng **JWT**, còn BE của bạn dùng **HMAC token**.
Nhưng vẫn chạy được vì:

1. **FE coi token là chuỗi opaque** — không có `jwt-decode`, `jose` hay bất kỳ thư viện
   giải mã JWT nào. Nó chỉ lưu token và gắn vào header `Authorization: Bearer <token>`.
2. **DTO khớp 100%:**

| Endpoint | BE của bạn | FE gửi/đọc |
|---|---|---|
| `POST /api/v1/auth/login` | nhận `email`, `password` | gửi `email` (= `identifier`), `password` ✅ |
| | trả `accessToken`, `tokenType`, `expiresIn`, `user` | đọc đúng 4 field ✅ |
| `POST /api/v1/auth/register` | nhận `email`, `username`, `password`, `fullName`, `phone`, `role` | gửi đúng ✅ |
| | trả `UserResponse` | đọc `id/email/fullName/status/roles` ✅ |
| `GET /api/v1/auth/me` | trả `UserResponse` | ✅ |
| `POST /api/v1/auth/logout` | trả `204` | ✅ |

3. `tokenType` BE trả `"Bearer"` — FE **bắt buộc** đúng chuỗi này, và khớp.

**Đã kiểm chứng thật** (không chỉ đọc code): đăng ký → đăng nhập → `/me` → `/logout`
qua cổng 8080 với `Origin: http://localhost:5173`, tất cả trả về đúng, CORS preflight = 200.

---

## 6. Kết quả kiểm tra FE

| Kiểm tra | Kết quả |
|---|---|
| `npm install` | ✅ 68 package, 0 lỗ hổng |
| `npm run typecheck` | ✅ sạch, không lỗi |
| `npm run build` | ✅ 60 module, `dist/` 295 KB JS |
| `npm run lint` | ✅ **0 error**, 3 warning (có sẵn từ upstream) |
| Test auth (`src/features/auth/tests/`) | ✅ **5/5 pass** |
| Test `not-found`, `toast-ssr`, `toast-store` | ✅ **8/8 pass** |
| Test `dot-grid-background` | ⚠️ 1 fail — **lỗi có sẵn ở nhánh `fe-init2`** |

### Về test fail duy nhất

`frontend/tests/dot-grid-background.test.mjs` dòng 37:

```js
assert.equal((provider.match(/<DotGridBackground\s*\/>/g) || []).length, 1);
```

Commit cuối của nhánh (`0c7fff6 "fix: scope wave background to auth and 404 pages"`)
đã **di chuyển** `<DotGridBackground />` từ `AppProviders.tsx` sang
`AuthBackgroundLayout.tsx` (để nền động chỉ hiện ở trang login/register/404),
nhưng **quên cập nhật test**.

Đã xác minh: file `AppProviders.tsx` trong dự án bạn **giống hệt 100%** bản gốc trên
nhánh (khác nhau chỉ do CRLF) — nên đây **không phải lỗi do quá trình copy**.

**Cách sửa** (nếu muốn test xanh): sửa test trỏ sang `AuthBackgroundLayout.tsx`:

```js
const layout = await readFile(new URL('../src/app/routes/AuthBackgroundLayout.tsx', import.meta.url), 'utf8');
assert.equal((layout.match(/<DotGridBackground\s*\/>/g) || []).length, 1);
```

Đây là **code test**, không ảnh hưởng chức năng chạy. Tôi để nguyên vì đó là code của nhánh upstream.

---

## 7. Cấu trúc FE

```
frontend/
├── src/
│   ├── main.tsx                      # entry
│   ├── app/
│   │   ├── App.tsx
│   │   ├── providers/AppProviders.tsx      # BrowserRouter + ToastProvider
│   │   └── routes/
│   │       ├── AppRoutes.tsx               # /login /register /404 + role routes
│   │       ├── AuthBackgroundLayout.tsx    # nền động cho trang auth
│   │       ├── PublicRoutes.tsx
│   │       └── ProtectedRoutes.tsx
│   ├── features/auth/                # ĐĂNG NHẬP / ĐĂNG KÝ
│   │   ├── pages/LoginPage.tsx
│   │   ├── pages/RegisterPage.tsx
│   │   ├── components/RoleSelector.tsx     # chọn Buyer / Seller
│   │   ├── components/SignInCard.tsx
│   │   ├── services/auth.api.ts            # gọi /api/v1/auth/*
│   │   ├── services/register.validation.ts
│   │   └── types/auth.ts
│   ├── roles/{buyer,seller,administrator}/ # route theo vai trò (khung sườn)
│   └── shared/                       # components/styles dùng chung
├── tests/
├── .env.local                        # (không commit)
├── .env.example
├── vite.config.js
└── tsconfig.json
```

Công nghệ: **React 19 + Vite 8 + react-router-dom 7 + TypeScript 7**,
style bằng CSS thuần + Bootstrap/React-Bootstrap, lint bằng **oxlint**.

---

## 8. Lưu ý

- `frontend/node_modules/`, `frontend/dist/`, `frontend/.env.local` đều **không bị git track**.
- FE hiện có **đăng nhập, đăng ký, 404**. Các trang theo vai trò (buyer/seller/admin)
  mới chỉ là khung sườn (`.gitkeep`), chưa có nội dung.
- Đăng nhập: FE cho chọn vai trò Buyer/Seller, và **kiểm tra** tài khoản có vai trò đó
  không — nếu không thì báo *"Tài khoản không có vai trò đã chọn"* (mã 403).
- Đăng ký **không** tự đăng nhập; phải quay lại trang login.
- "Remember me" → `localStorage`; không tick → `sessionStorage` (mất khi đóng tab).
