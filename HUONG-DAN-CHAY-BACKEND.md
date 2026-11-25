# BÁO CÁO: Vì sao backend Nexus không chạy được & Cách chạy

> Phạm vi: chẩn đoán môi trường Windows và cách chạy backend. Mã nguồn hiện cho phép chạy API sản phẩm/SKU khi Supabase Storage chưa cấu hình; upload ảnh vẫn yêu cầu cấu hình Storage.

---

## 1. Kết luận nhanh

Code backend **không có lỗi compile, không thiếu dependency, không sai cấu hình DB**.
Nó chỉ **không khởi động được trên máy này** vì 4 nguyên nhân thuộc môi trường Windows:

| # | Nguyên nhân | Bằng chứng đo được | Mức độ |
|---|---|---|---|
| 1 | `java` trên PATH là **Java 8** (shim `javapath`), trong khi jar build bằng **Java 25** | `java -version` → `1.8.0_371`; chạy jar → `UnsupportedClassVersionError: ... class file version 61.0` (cần 65+) | ❌ Chặn hoàn toàn |
| 2 | Cổng **8080 đã bị dịch vụ `PEMHTTPD-x64` (Apache của EDB PostgreSQL Enterprise Manager)** chiếm | `netstat` → `0.0.0.0:8080 LISTENING 8356`; `GET /` trả về `"Server is up and running"` + logo enterprisedb; `httpd.conf` có `Listen 0.0.0.0:8080` | ❌ Chặn hoàn toàn |
| 3 | Maven không ghi được vào `C:\Users\DELL\.m2` | `Out-File $HOME\.m2\__wt.tmp` → `Access denied`; `mvn spring-boot:run` → `AccessDeniedException: ...\.m2\repository\...\resolver-status.properties` | ⚠️ Chặn `mvn`/`run.bat` |
| 4 | `backend\run.bat` lưu kiểu **LF** (không phải CRLF) | Hexdump: `@echo off` + `0A` (không có `0D 0A`) → `cmd.exe` đọc sai → `'tlocal' is not recognized`, `'/d' is not recognized`, `'ho' is not recognized` | ⚠️ Script hỏng |

Ngoài ra (không chặn nhưng gây khó chịu):

- `backend\build.ps1` bị **Execution Policy** chặn: `is not digitally signed`. Phải chạy bằng `powershell -ExecutionPolicy Bypass -File .\build.ps1`.
- Chạy `java -jar` từ thư mục khác `backend\` thì `.env` không được nạp → mất `DB_URL`, app rơi về `localhost:5432`.
- Seeder báo `Không tạo được tài khoản quản trị demo vì tên đăng nhập 'admin' đã được sử dụng` → trên Supabase đã có user `admin` nhưng **email là `admin@nexus.vn`**, không phải `admin@nexus.local`. Vì vậy đăng nhập `admin@nexus.local / Admin@123` trả **401** dù hệ thống chạy bình thường.

### Lỗi đăng bán mới nhất (25/11/2026)

Log mới nhất báo `java.lang.Error: Unresolved compilation problem: SecurityUtils cannot be resolved` tại `CatalogSellerController.create`. Request lỗi trước khi gọi service tạo sản phẩm, nên không ghi Product hoặc SKU vào DB. Source hiện có import `SecurityUtils` hợp lệ; JAR đang chạy chứa bytecode build lỗi/cũ. Dừng backend bằng `Ctrl+C`, sau đó từ thư mục gốc chạy `.\run-backend.cmd 8080 build` để ép `mvn clean package` rồi khởi động lại. Không dùng lệnh chạy mặc định lần này vì nó có thể giữ lại JAR cũ.

Lỗi thiếu `SUPABASE_URL` trước đó là vấn đề riêng: API Product/SKU hiện có thể chạy khi chưa cấu hình Storage, còn upload ảnh vẫn cần `SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY`. Hai biến Storage khác với `DB_URL`/`DB_USERNAME`/`DB_PASSWORD` của PostgreSQL; chỉ lưu service role key ở backend.

---

## 2. Cách chạy

```powershell
cd D:\FPTU\semester_6\OJT
.\run-backend.cmd                  # tự build nếu source mới hơn jar, chạy ở cổng 8080
.\run-backend.cmd 8080 build       # ép build lại jar rồi chạy
.\run-backend.cmd 8085             # nếu cần cổng khác; vẫn tự build nếu source mới
```

Script tự làm các việc:

1. Tìm JDK ≥ 21 (đọc `release` của từng JDK) và đặt `JAVA_HOME` + `PATH` **chỉ cho tiến trình này** → không đụng biến môi trường hệ thống, không đụng `backend\`.
2. Đặt `MAVEN_OPTS=-Dmaven.repo.local=<repo>\.m2repo` (đúng như `build.ps1` của dự án).
3. Kiểm tra cổng trước khi chạy, báo rõ ai đang giữ cổng.
4. Build lại jar khi chưa có jar hoặc source Java/POM mới hơn jar; tùy chọn `build` luôn ép build.
5. Đặt `SERVER_PORT=<cổng>` rồi `java -jar` với **working directory = `backend\`** để `.env` được nạp.

Nếu backend cũ đang chạy, nhấn `Ctrl+C` trong terminal của backend trước khi chạy lại script để giải phóng cổng.

Sau khi chạy:

| Mục | URL |
|---|---|
| Swagger UI | <http://localhost:8080/swagger-ui.html> |
| Health | <http://localhost:8080/actuator/health> |
| OpenAPI JSON | <http://localhost:8080/v3/api-docs> |

---

## 3. Cổng 8080 và dịch vụ Apache của EDB (đã xử lý)

Trạng thái hiện tại trên máy này: **`PEMHTTPD-x64` đã Stopped và StartType = Manual** → cổng 8080 đã trống cho backend.

Nếu sau này khởi động lại Windows mà dịch vụ này chiếm lại 8080, xử lý bằng PowerShell **Run as Administrator**:

```powershell
Stop-Service PEMHTTPD-x64
Set-Service PEMHTTPD-x64 -StartupType Manual    # không tự chạy lại khi boot
```

Muốn bật lại (khi cần dùng PEM/EDB): `Start-Service PEMHTTPD-x64`.
Hoặc đổi cổng của Apache trong `C:\Program Files\edb\pem\httpd\apache\conf\httpd.conf` (dòng `Listen 0.0.0.0:8080`) sang cổng khác.

---

## 3b. "Cổng 8080 đang bị một tiến trình khác chiếm" — xử lý thế nào

Đây là thông báo của **chính script** (bước kiểm tra cổng), không phải lỗi của backend.
Nguyên nhân thường gặp nhất: **một instance backend cũ vẫn còn chạy** (cửa sổ khác, hoặc do phiên trước để lại).

### Bước 1 — Xem ai đang giữ cổng

```powershell
netstat -ano -p TCP | findstr /R /C:":8080 .*LISTENING"
```

Kết quả dạng:

```
  TCP    0.0.0.0:8080    0.0.0.0:0    LISTENING    25884
```

Cột **cuối cùng là PID** (ở đây `25884`).

### Bước 2 — Xem tiến trình đó là gì

```powershell
Get-Process -Id 25884 | Select-Object Id, ProcessName, Path
```

### Bước 3 — Tắt nó

```powershell
Stop-Process -Id 25884 -Force
```

Hoặc tắt **tất cả** tiến trình `java` đang chạy (cẩn thận nếu còn app Java khác):

```powershell
Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Phân biệt 2 thủ phạm hay gặp

| `ProcessName` | Là gì | Cách xử lý |
|---|---|---|
| `java` | Instance backend Nexus của bạn đang chạy sẵn | `Stop-Process -Id <PID> -Force` — **đây là ca thường gặp** |
| `httpd` / `PEMHTTPD` | Apache của EDB/PEM | `Stop-Service PEMHTTPD-x64` (cần Run as Administrator) |

> **Mẹo:** nếu vừa chạy `run-backend.cmd` ở một cửa sổ PowerShell khác mà chưa Ctrl+C,
> cổng vẫn bị giữ. Đóng cửa sổ đó hoặc Ctrl+C là xong.

### Bước 4 — Chạy lại

```powershell
.\run-backend.cmd
```

> Script **không tự kill** tiến trình đang giữ cổng, vì như vậy sẽ rất dễ tắt nhầm
> một app quan trọng khác. Nó chỉ báo để bạn tự quyết định.

---

## 4. Nếu bạn vẫn muốn dùng `mvn` / `run.bat` của dự án

Ba lệnh cần thiết trên máy này (chạy trong `backend\`):

```powershell
# 1) Dùng JDK 25 cho phiên hiện tại
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-25.0.4.1'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

# 2) Trỏ local repo ra ngoài ~/.m2 (Maven BỎ QUA -Dmaven.repo.local trên CLI → phải qua MAVEN_OPTS)
$env:MAVEN_OPTS = '-Dmaven.repo.local=D:\FPTU\semester_6\OJT\.m2repo'

# 3) Build + chạy ở cổng khác 8080
$env:SERVER_PORT = '8085'
mvn -B -ntp -DskipTests clean package
java -jar nexus-app\target\nexus-app-1.0.0-SNAPSHOT.jar
```

Với `run.bat`: file đang ở LF nên `cmd` đọc sai. Nếu muốn dùng, hãy chuyển sang CRLF (thao tác trên file, không sửa nội dung):

```powershell
$p = 'D:\FPTU\semester_6\OJT\backend\run.bat'
$t = [IO.File]::ReadAllText($p) -replace "`r`n", "`n" -replace "`n", "`r`n"
[IO.File]::WriteAllText($p, $t, (New-Object Text.UTF8Encoding($false)))
```

---

## 5. Tài khoản demo để test

Trên Supabase hiện tại **không có** `admin@nexus.local`. Có sẵn:

| Email | Username | Vai trò |
|---|---|---|
| `admin@nexus.vn` | `admin` | ADMIN |

Mật khẩu của tài khoản này không đọc được từ DB (lưu BCrypt), nên cách chắc chắn nhất để có tài khoản test là tự đăng ký:

```powershell
$body = @{
  email='buyer.demo@nexus.local'; username='buyerdemo'
  password='Demo@12345'; fullName='Buyer Demo'; role='BUYER'
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:8080/api/v1/auth/register `
  -Method POST -ContentType 'application/json' -Body $body
```

Đã kiểm chứng trên cổng 8080: `POST /api/v1/auth/register` → **201**, `POST /api/v1/auth/login` → **200 + accessToken**,
`GET /v3/api-docs` → **200** (72 endpoint), `GET /swagger-ui.html` → **200**, `/actuator/health` → **200** với `db.status = UP`,
`GET /api/v1/auth/me` và `GET /api/v1/catalog/products` (kèm `Bearer` token) → **200**.

---

## 6. Đã kiểm chứng trong lần chẩn đoán này

- `mvn -o clean verify` (toàn bộ 9 module, có chạy test) → **BUILD SUCCESS**.
- `mvn -o -DskipTests clean package` → **BUILD SUCCESS**, sinh `nexus-app-1.0.0-SNAPSHOT.jar`.
- Kết nối Supabase thật (`aws-0-ap-south-1.pooler.supabase.com:5432`, PostgreSQL 17.11) → OK.
- Khởi động với `DDL_AUTO=validate` → OK (schema trong `db/*.sql` khớp entity, Hibernate không báo lỗi validate).
- Backend chạy ổn định ở **cổng 8080** sau khi tắt `PEMHTTPD-x64`.
- Các user test do quá trình kiểm tra tạo ra (`probe.test@nexus.local`, `probe2`, `smoke.probe@nexus.local`, `port8k.check@nexus.local`) đã được xoá khỏi DB.

---

## 7. Vì sao "chưa làm gì mà Swagger vẫn chạy"?

Đây **không phải** điều kỳ lạ — đó chính là bằng chứng backend đã khởi động thành công.
Có 3 lớp nguyên nhân.

### 7.1. Swagger UI là một phần của app, không phải dịch vụ riêng

`springdoc-openapi-starter-webmvc-ui` là **một dependency Maven** nằm trong `nexus-common/pom.xml`.
Khi Spring Boot khởi động, nó **tự động**:

1. Quét toàn bộ `@RestController` trong 6 module nghiệp vụ.
2. Sinh tài liệu OpenAPI (JSON) từ các annotation `@Operation`, `@Tag`, `@ApiResponse`.
3. Đăng ký thêm 2 route: `/v3/api-docs` (JSON) và `/swagger-ui.html` (trang HTML + JS).

Nghĩa là **Swagger không phải thứ bạn phải "bật"**. Nó là **hệ quả tự động** của việc
có springdoc trên classpath + app đang chạy. Không có bước cấu hình thủ công nào.

Bằng chứng trong code:

```yaml
# backend/nexus-app/src/main/resources/application.yml (dòng 62-69)
springdoc:
  swagger-ui:
    path: /swagger-ui.html      # <- đây là toàn bộ "cấu hình" Swagger
  api-docs:
    path: /v3/api-docs
```

Chỉ 8 dòng YAML, không có controller nào riêng cho Swagger.

### 7.2. Swagger là endpoint CÔNG KHAI — nên mở được ngay không cần đăng nhập

Đây là lý do bạn "bấm vào là lên" dù chưa login:

```java
// backend/nexus-common/src/main/java/com/nexus/common/security/SecurityConfig.java:80
.requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
.anyRequest().authenticated())     // <- mọi thứ KHÁC đều phải có token
```

`permitAll()` trên 3 đường dẫn Swagger → **không cần Bearer token**.
Mọi API khác (`/api/v1/catalog/**`, `/api/v1/auth/me`…) đều rơi vào `anyRequest().authenticated()`
→ gọi mà không có token sẽ nhận **401**.

Đó là lý do tôi có thể báo bạn link Swagger ngay, còn khi test `GET /api/v1/catalog/products`
thì phải kèm `Authorization: Bearer <token>` mới được **200**.

### 7.3. "Chưa làm gì" thực ra là app ĐÃ chạy

Cần phân biệt rõ 2 trạng thái:

| Trạng thái | Swagger có lên không? |
|---|---|
| Chưa chạy `run-backend.cmd` | ❌ **Không** — `ERR_CONNECTION_REFUSED` |
| Đã chạy, app khởi động xong | ✅ **Có** — 200 OK |

Nếu bạn mở được Swagger nghĩa là:

- Cổng 8080 **đang có** tiến trình `java` lắng nghe,
- Tomcat đã nhận request,
- Spring context đã load xong (kể cả kết nối DB).

**Chính vì thế mà lúc bạn chạy `run-backend.cmd` và bị báo "cổng bị chiếm" — là do
instance backend từ phiên trước của tôi vẫn còn sống và đang giữ 8080.** Nó phục vụ
Swagger bình thường, nên trông như "tự nhiên có". Đã tắt instance đó bằng
`Stop-Process`/`job_kill`, giờ cổng đã trống cho bạn tự chạy.

### 7.4. Swagger lên không có nghĩa là MỌI thứ đều ổn

Cần lưu ý điểm này để không bị đánh lừa:

- Swagger UI **chỉ đọc metadata annotation**, nó **không gọi** vào database.
  Vì vậy Swagger vẫn hiện đủ 72 endpoint **kể cả khi DB Supabase đang chết**.
- Muốn biết DB có thật sự OK, xem <http://localhost:8080/actuator/health> → phải thấy
  `"db":{"status":"UP"}`.
- Muốn biết API chạy thật, phải **bấm "Try it out"** trong Swagger, hoặc gọi bằng
  `Invoke-RestMethod` — lúc đó mới chạm tới service + DB.

Trong log phiên trước có lúc `HikariPool - Connection is not available` + `UnknownHostException:
aws-0-ap-south-1.pooler.supabase.com` — **Swagger vẫn lên bình thường** dù DB đang mất kết nối.
Đó là minh chứng rõ nhất cho điểm này.

### Tóm lại

> Swagger "tự lên" vì (1) springdoc là dependency có sẵn, Spring Boot tự sinh route khi khởi động;
> (2) 3 đường dẫn Swagger được `permitAll()` nên không cần token; (3) app **đã thực sự chạy** —
> nhiều khả năng là instance cũ còn sót lại, không phải phép màu.

---

## 8. Tóm tắt nhanh (TL;DR)

```powershell
# 1. Xem ai giữ cổng 8080
netstat -ano -p TCP | findstr /R /C:":8080 .*LISTENING"

# 2. Tắt nó (thay <PID> bằng số ở cột cuối)
Stop-Process -Id <PID> -Force

# 3. Chạy backend ở 8080
cd D:\FPTU\semester_6\OJT
.\run-backend.cmd

# 4. Kiểm tra
#    Swagger : http://localhost:8080/swagger-ui.html
#    Health  : http://localhost:8080/actuator/health   (phải có db: UP)
```

Script đã mặc định **8080** — không cần truyền tham số. Chỉ cần cổng trống.

