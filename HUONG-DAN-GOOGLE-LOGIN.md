# Hướng dẫn cấu hình & sử dụng Đăng nhập bằng Google (OAuth2)

> Tài liệu này giải thích **cách backend Project Nexus đăng nhập bằng Google**, cách cấu hình
> Google Cloud Console, cách kiểm tra, và những chỗ **cố tình làm khác** so với ví dụ
> `spring.security.oauth2.client` thông thường trên mạng.

---

## 1. TL;DR — 3 việc phải làm

| #   | Việc                                                                   | Ở đâu                                   |
| --- | ---------------------------------------------------------------------- | --------------------------------------- |
| 1   | Điền `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`                       | `backend/.env` (đã điền sẵn)            |
| 2   | Khai báo redirect URI `http://localhost:8080/login/oauth2/code/google` | Google Cloud Console                    |
| 3   | Thêm route `/oauth2/callback` ở frontend                               | `frontend/src/app/routes/AppRoutes.tsx` |

Sau đó mở trình duyệt: `http://localhost:8080/oauth2/authorization/google?role=BUYER`

---

## 2. Luồng hoạt động

```
① FE  ──GET /oauth2/authorization/google?role=BUYER──────────────────▶ BE
② BE  ──302 https://accounts.google.com/o/oauth2/v2/auth?...────────▶ Trình duyệt
③ Người dùng chọn tài khoản Gmail và đồng ý
④ Google ──302 /login/oauth2/code/google?code=4/0AX...&state=...────▶ BE
⑤ BE  ──đổi code lấy id_token (xác minh chữ ký JWK của Google)───────▶ Google
⑥ BE  ──tìm/tạo user trong nexus_user.users, ký token HMAC nội bộ,
        sinh MÃ DÙNG MỘT LẦN (60 giây)───────────────────────────────▶ BE
⑦ BE  ──302 http://localhost:5173/oauth2/callback?code=<mã>&newUser=true──▶ FE
⑧ FE  ──POST /api/v1/auth/oauth2/exchange {"code":"<mã>"}─────────────▶ BE
⑨ BE  ──200 {accessToken, tokenType, expiresIn, user}────────────────▶ FE
⑩ FE  ──lưu vào nexus.auth.session (giống hệt đăng nhập mật khẩu)────▶ Xong
```

**Điểm mấu chốt:** bước ⑨ trả về **đúng cấu trúc `AuthResponse` y như `POST /api/v1/auth/login`**.
Nghĩa là frontend không phải viết thêm tầng lưu phiên mới — dùng lại `saveSession()` đang có.

---

## 3. Cấu hình Google Cloud Console

1. Vào <https://console.cloud.google.com/> → chọn (hoặc tạo) project.
2. **APIs & Services → OAuth consent screen**: chọn _External_, điền tên ứng dụng, thêm email test.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - **Authorized JavaScript origins**:
     ```
     http://localhost:5173
     ```
   - **Authorized redirect URIs** (chính xác từng ký tự):
     ```
     http://localhost:8080/login/oauth2/code/google
     ```
4. Bấm **Create**, sao chép `Client ID` và `Client secret` vào `backend/.env`.

> ⚠️ Sai hoặc thiếu redirect URI sẽ nhận lỗi `Error 400: redirect_uri_mismatch` **từ Google**,
> không phải từ backend. Đây là lỗi phổ biến nhất.

---

## 4. Vì sao KHÔNG dùng khối YAML `spring.security.oauth2.client`

Bạn có thể đã thấy cấu hình này trên mạng:

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID}
            client-secret: ${GOOGLE_CLIENT_SECRET}
            scope: [openid, email, profile]
```

Nó **chạy được** với Spring Boot thông thường, nhưng trong dự án này có 4 vấn đề:

### 4.1. Làm sập ứng dụng khi thiếu credential

`spring-boot-autoconfigure` đọc khối này **ngay lúc khởi động**. Nếu `GOOGLE_CLIENT_ID`
chưa được đặt (ví dụ đồng đội clone repo, hoặc CI chạy test), nó tạo
`ClientRegistration` với `clientId = ""` và ném:

```
java.lang.IllegalArgumentException: clientId cannot be empty
```

→ **Không ai chạy được backend**, kể cả khi chỉ muốn mở Swagger. Trong khi đó Google login
là tính năng **tuỳ chọn**.

**Cách dự án này làm:** `GoogleOAuth2Config` có `@ConditionalOnExpression` — chỉ tạo bean
khi **cả** client-id **và** client-secret đều khác rỗng. Không có credential → ứng dụng
khởi động bình thường, `/oauth2/**` trả 404. (Xem `nexus-common/.../oauth2/GoogleOAuth2Config.java`)

### 4.2. Xung đột với kiến trúc stateless

Toàn bộ API chạy `SessionCreationPolicy.STATELESS` với token HMAC tự viết
(`HmacTokenService`). `oauth2Login` mặc định **tạo HTTP session** và lưu `SecurityContext`
trong đó. Nếu bật lên chain chính, mỗi lần đăng nhập Google sẽ sinh một session —
phá vỡ mô hình stateless và gây lẫn lộn giữa hai cơ chế xác thực.

**Cách dự án này làm:** một `SecurityFilterChain` riêng với `@Order(1)` và
`securityMatcher("/oauth2/**", "/login/oauth2/**")`. Chỉ 2 nhóm URL đó được dùng session
(`IF_REQUIRED`) để nhớ tham số `state`; **mọi API khác vẫn stateless tuyệt đối**.
Session bị `invalidate()` ngay trong success handler.

### 4.3. `nexus_user.users.password_hash` là `NOT NULL`

Bảng không có cột `provider`/`provider_id`, và `password_hash` bắt buộc có giá trị.
Người dùng Google không có mật khẩu.

**Cách dự án này làm:** tài khoản tạo từ Google được gán một **mật khẩu ngẫu nhiên 64 ký tự
đã băm BCrypt** (`UUID.randomUUID()` × 2). Không ai biết mật khẩu này → không thể đăng nhập
bằng mật khẩu vào tài khoản Google-only. Muốn đặt mật khẩu thật thì dùng luồng "quên mật khẩu".

**Không thêm cột nào vào DB** → `db/01-user.sql` và dữ liệu hiện có trên Supabase không bị ảnh hưởng.

### 4.4. Không trả được token của hệ thống

`oauth2Login` mặc định chuyển hướng về `/` và **không** cấp token HMAC. Frontend cần
`accessToken` để gọi các API khác.

**Cách dự án này làm:** `OAuth2LoginSuccessHandler` gọi `SocialLoginHandler` để lấy token
nội bộ, rồi chuyển hướng về frontend kèm **mã dùng một lần** (xem §5).

---

## 5. Vì sao dùng "mã dùng một lần" thay vì đặt token lên URL

Cách làm phổ biến (và **sai**) là:

```
http://localhost:5173/oauth2/callback?token=eyJhbGciOi...
```

Token trong URL sẽ bị lộ qua:

| Nơi rò rỉ                   | Hậu quả                                                      |
| --------------------------- | ------------------------------------------------------------ |
| Lịch sử trình duyệt         | Người dùng khác mở máy là thấy token                         |
| Log của proxy/reverse proxy | Token nằm vĩnh viễn trong file log                           |
| Header `Referer`            | Token bị gửi sang mọi site có ảnh/script trên trang callback |
| Ảnh chụp màn hình khi demo  | Lộ trước hội đồng/khán giả                                   |

**Cách dự án này làm** (`OAuth2LoginCodeStore`):

- Backend sinh mã ngẫu nhiên (`UUID` bỏ dấu gạch), lưu **trong bộ nhớ**, gắn với kết quả đăng nhập.
- Mã sống **60 giây** và bị **xoá ngay khi đọc** (`consume()` dùng `Map.remove`).
- Frontend đổi mã lấy token qua `POST /api/v1/auth/oauth2/exchange`.

URL bị lộ cũng vô dụng: mã đã dùng hoặc đã hết hạn. Đã có test cho cả hai tính chất này
(`OAuth2LoginCodeStoreTest`).

> **Giới hạn đã biết:** kho mã nằm trong bộ nhớ → chỉ đúng khi chạy **một instance**.
> Khi scale ngang nhiều instance, phải thay bằng Redis hoặc bảng DB. Chỉ cần cài đặt lại
> `OAuth2LoginCodeStore`, không phải sửa chỗ khác.

---

## 6. Ánh xạ người dùng Google → tài khoản Nexus

Quyết định: **dùng email đã xác thực làm khoá**, không thêm cột `provider`.

| Tình huống                                   | Kết quả                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------- |
| Email chưa có trong DB                       | Tạo user mới, `username` sinh từ phần trước `@`, vai trò từ `?role=` (mặc định BUYER) |
| Email đã có (đăng ký bằng mật khẩu trước đó) | Đăng nhập vào **đúng tài khoản cũ**, giữ nguyên vai trò                               |
| Email trùng `username` người khác            | Tự thêm hậu tố số: `nguoidung` → `nguoidung2`                                         |
| Google không trả `name`                      | Lấy phần trước `@` của email làm `fullName`                                           |
| `email_verified != true`                     | **Từ chối** (401)                                                                     |
| Tài khoản `INACTIVE`/`BANNED`                | **Từ chối** (403)                                                                     |
| Client gửi `?role=ADMIN`                     | **Bỏ qua**, rơi về BUYER (không cho tự nâng quyền)                                    |

Vì sao dùng email thay vì `sub`? Google luôn trả `email_verified=true` cho Gmail, và email là
duy nhất. Dùng email cho phép người đã đăng ký bằng mật khẩu chuyển sang Google **mà không
tạo tài khoản trùng** — đúng ý người dùng.

---

## 6b. Một cái bẫy thật: `?role=SELLER` không sống sót qua Google

Thoạt nhìn, chỉ cần đọc `request.getParameter("role")` trong success handler. **Sai.**

Khi Google gọi lại, trình duyệt chỉ gửi:

```
GET /login/oauth2/code/google?code=4/0AX...&state=abc...
```

`role` đã biến mất. Nguyên nhân nằm trong `DefaultOAuth2AuthorizationRequestResolver`
(`expandRedirectUri`): nó dựng `redirect_uri` từ URL hiện tại nhưng gọi
`UriComponentsBuilder.replaceQuery(null)` — **bỏ sạch query string**.

Vì sao Spring Security làm vậy? Vì `redirect_uri` phải khớp **chính xác từng ký tự** với giá trị
khai báo trên Google Cloud Console. Thêm `?role=SELLER` vào là Google trả ngay:

```
Error 400: redirect_uri_mismatch
```

**Cách khắc phục trong dự án:** `OAuth2RoleCaptureFilter` chép `?role=` vào **session** ngay khi
request bắt đầu (`/oauth2/authorization/*`), trước khi Spring dựng URL sang Google. Success handler
đọc lại từ session rồi **xoá** (mỗi lượt đăng nhập chỉ dùng một lần). Session này vốn đã tồn tại
để lưu `state`, nên không phát sinh session "thừa".

Nếu không có filter này: mọi tài khoản Google mới đều thành **BUYER**, kể cả khi người dùng
chọn "Đăng ký bán hàng". Đây chính là kiểu lỗi im lặng — không exception, chỉ sai nghiệp vụ.

---

## 7. Các file đã thêm/sửa

### Thêm mới

| File                                                              | Vai trò                                                   |
| ----------------------------------------------------------------- | --------------------------------------------------------- |
| `nexus-common/.../security/SocialLoginHandler.java`               | Interface (port) — tránh phụ thuộc vòng `common` → `user` |
| `nexus-common/.../security/SocialLoginResult.java`                | Record kết quả đăng nhập                                  |
| `nexus-common/.../security/oauth2/GoogleOAuth2Config.java`        | Đăng ký Google + chain `@Order(1)`                        |
| `nexus-common/.../security/oauth2/OAuth2RoleCaptureFilter.java`   | Giữ `?role=` qua chặng Google (xem §6b)                   |
| `nexus-common/.../security/oauth2/OAuth2LoginSuccessHandler.java` | Tạo token nội bộ, sinh mã, redirect                       |
| `nexus-common/.../security/oauth2/OAuth2LoginFailureHandler.java` | Xử lý khi Google từ chối                                  |
| `nexus-common/.../security/oauth2/OAuth2LoginCodeStore.java`      | Kho mã dùng một lần                                       |
| `nexus-common/.../security/oauth2/OAuth2SupportConfig.java`       | Bean luôn tồn tại (kể cả khi tắt Google)                  |
| `nexus-user/.../service/impl/SocialAuthServiceImpl.java`          | Tìm/tạo user, ký token                                    |
| `nexus-user/.../dto/publicapi/OAuth2ExchangeRequest.java`         | DTO cho endpoint đổi mã                                   |
| `nexus-common/src/test/.../OAuth2LoginCodeStoreTest.java`         | 5 test                                                    |
| `nexus-common/src/test/.../OAuth2RoleCaptureFilterTest.java`      | 7 test                                                    |
| `nexus-user/src/test/.../SocialAuthServiceImplTest.java`          | 9 test                                                    |
| `backend/http/oauth2-google-login.http`                           | Test case REST Client                                     |

### Sửa

| File                                                      | Thay đổi                                                                            |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `nexus-common/pom.xml`                                    | + `spring-boot-starter-security-oauth2-client`                                      |
| `nexus-common/.../SecurityConfig.java`                    | permitAll cho `/oauth2/**`, `/login/oauth2/**`, `POST /api/v1/auth/oauth2/exchange` |
| `nexus-user/.../service/AuthService.java`                 | + `exchangeOAuth2Code(String)`                                                      |
| `nexus-user/.../service/impl/AuthServiceImpl.java`        | + cài đặt `exchangeOAuth2Code`                                                      |
| `nexus-user/.../controller/publicapi/AuthController.java` | + `POST /oauth2/exchange`                                                           |
| `nexus-user/src/test/.../AuthServiceImplTest.java`        | + 1 `@Mock` (constructor có thêm tham số)                                           |
| `nexus-app/src/main/resources/application.yml`            | + khối `nexus.security.oauth2`                                                      |
| `backend/.env`                                            | + `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, ...                                   |
| `backend/.env.example`                                    | + hướng dẫn (để trống)                                                              |

---

## 8. Việc còn lại ở frontend

Frontend **hiện chưa nối** vào luồng này. Cụ thể:

1. `SocialSignIn.tsx` vẫn là bản mô phỏng — nút Google sau 1.5 giây hiện dòng chữ
   _"Google OAuth chưa được triển khai. Không tạo phiên đăng nhập."_
2. Chưa có route `/oauth2/callback`.

Để nối (khi bạn muốn):

```tsx
// SocialSignIn.tsx — thay hàm connect()
function connect() {
  const role = /* vai trò đang chọn ở form */ "BUYER";
  window.location.href = `http://localhost:8080/oauth2/authorization/google?role=${role}`;
}
```

```tsx
// Thêm route trong AppRoutes.tsx
<Route path="/oauth2/callback" element={<OAuth2Callback />} />
```

```tsx
// Trang callback: đổi mã → lưu phiên → chuyển vào dashboard
const [params] = useSearchParams();
useEffect(() => {
  const code = params.get("code");
  const error = params.get("error");
  if (error || !code) {
    /* hiện thông báo lỗi */ return;
  }
  exchangeOAuth2Code(code) // POST /api/v1/auth/oauth2/exchange
    .then((session) => {
      saveSession(session, true);
      navigate("/buyer");
    });
}, []);
```

---

## 9. Kiểm tra

### 9.1. Build & test (không cần Google, không cần mạng)

```powershell
cd D:\FPTU\semester_6\OJT\backend
$env:JAVA_HOME = "C:\Program Files\Java\jdk-25.0.4.1"
$env:MAVEN_OPTS = "-Dmaven.repo.local=D:\FPTU\semester_6\OJT\.m2repo"
mvn -o clean test
```

> ⚠️ **Lần build đầu tiên cần mạng** để tải `spring-boot-starter-security-oauth2-client:4.1.1`
> và `spring-security-oauth2-client:7.1.1` (chưa có trong `.m2repo` offline). Chạy `mvn clean test`
> **không có** `-o` một lần, sau đó mới dùng `-o` được.

### 9.2. Kiểm tra Google login đã bật

Khởi động backend, tìm trong log:

```
OAuth2 client registration: google
```

Nếu **không** thấy dòng này → `GOOGLE_CLIENT_ID`/`SECRET` chưa được nạp. Kiểm tra:

- File `backend/.env` có tồn tại và có 2 dòng đó không.
- CWD khi chạy `java -jar` phải là `backend\` (xem `NexusApplication.loadDotenv`).
- Log phải có `[NexusApplication] Đã nạp cấu hình từ: ...`.

### 9.3. Kiểm tra endpoint

```powershell
# Phải trả 302 + Location chứa accounts.google.com
curl.exe -s -o NUL -w "%{http_code}`n" "http://localhost:8080/oauth2/authorization/google?role=BUYER"
```

### 9.4. Kiểm tra đổi mã

```powershell
# Mã rỗng → 400
curl.exe -s -X POST http://localhost:8080/api/v1/auth/oauth2/exchange `
  -H "Content-Type: application/json" -d '{\"code\":\"\"}'

# Mã bịa → 401
curl.exe -s -X POST http://localhost:8080/api/v1/auth/oauth2/exchange `
  -H "Content-Type: application/json" -d '{\"code\":\"bja\"}'
```

### 9.5. Luồng đầy đủ

Mở trình duyệt: `http://localhost:8080/oauth2/authorization/google?role=BUYER`
→ chọn Gmail → đồng ý → quan sát URL callback có `?code=...`
→ kiểm tra Supabase (schema `nexus_user`, bảng `users`) có dòng mới.

---

## 10. Câu hỏi thường gặp

**Hỏi: Tắt Google login thế nào?**
Xoá (hoặc để trống) `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` trong `.env`, khởi động lại.
Ứng dụng chạy bình thường, `/oauth2/**` trả 404, đăng nhập mật khẩu không ảnh hưởng.

**Hỏi: Có phải sửa DB / chạy migration không?**
Không. Không thêm cột, không thêm bảng. `ddl-auto: update` không sinh thay đổi nào.

**Hỏi: Người dùng Google đăng nhập rồi muốn đổi sang mật khẩu?**
Cần luồng "quên mật khẩu" (chưa có trong dự án). Mật khẩu hiện tại là chuỗi ngẫu nhiên
không ai biết nên không thể đăng nhập bằng mật khẩu.

**Hỏi: Logout thì sao?**
Không đổi gì. Hệ thống stateless: `POST /api/v1/auth/logout` trả 204, client xoá token.
Token HMAC vẫn hợp lệ tới khi hết hạn (mặc định 480 phút) — giống hệt đăng nhập mật khẩu.
Muốn thu hồi ngay thì phải thêm danh sách đen token (Redis/DB), chưa có trong dự án.

**Hỏi: `email_verified` lấy từ đâu?**
Từ `id_token` mà Google trả về, đã được xác minh chữ ký bằng JWK Set của Google
(`https://www.googleapis.com/oauth2/v3/certs`). Claim này trong `id_token` đáng tin hơn
giá trị trong UserInfo endpoint.

**Hỏi: `?role=SELLER` có hoạt động không?**
Có, nhờ `OAuth2RoleCaptureFilter`. Nếu không có filter đó thì **không** — xem §6b. Đây là lỗi
rất dễ mắc khi tự viết OAuth2, và nó không báo lỗi gì cả, chỉ âm thầm tạo sai vai trò.

**Hỏi: Chạy nhiều instance (scale ngang) được không?**
Phần đăng nhập Google **chưa** được: kho mã nằm trong bộ nhớ từng instance. Nếu load balancer
đưa request đổi mã sang instance khác, mã không tìm thấy → 401. Cần thay `OAuth2LoginCodeStore`
bằng Redis/DB.
