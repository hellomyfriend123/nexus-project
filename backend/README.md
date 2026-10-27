# PROJECT NEXUS — BACKEND

Marketplace thương mại điện tử kết hợp đấu giá — **6 module nghiệp vụ trong 1 ứng dụng Spring Boot**.
Bám sát **59 FR trong `../scope.xlsx`** (baseline đã chốt của nhóm) và tài liệu `../Doc/NEXUS-Review-Tong-hop-va-Quyet-dinh.md`.

---

## 1. Stack (đã kiểm chứng thực tế, không phải suy đoán)

| Thành phần | Version | Ghi chú |
|---|---|---|
| Java | **21 (LTS)** | `maven.compiler.release=21`; build trên JDK 25 vẫn chạy tốt |
| Spring Boot | **4.1.1** | hỗ trợ OSS tới 31/07/2027 |
| springdoc-openapi | **3.1.1** | dòng 3.x dành cho Boot 4 (dòng 2.9.x là cho Boot 3) |
| Maven | 3.9.x | multi-module |
| PostgreSQL | 15+ | Supabase; mỗi module **một schema riêng** |
| Lombok | theo Boot BOM | bắt buộc khai báo `annotationProcessorPaths` (xem §7) |
| Jackson | **3.x** (`tools.jackson`) | Boot 4 dùng Jackson 3, KHÔNG phải `com.fasterxml.jackson` |

### Boot 4 — 4 điểm khác biệt so với Boot 3 (đã kiểm chứng bằng cách đọc trực tiếp jar)

1. `spring-boot-starter-web` **không còn tồn tại** → tên mới là **`spring-boot-starter-webmvc`**.
2. Boot 4 dùng **Jackson 3**: import `tools.jackson.databind.ObjectMapper`.
3. Test starter bị tách theo công nghệ: `spring-boot-starter-webmvc-test` (cho `@WebMvcTest`), `spring-boot-starter-data-jpa-test` (cho `@DataJpaTest`).
4. Package của test annotation đổi:
   - `@WebMvcTest` → `org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest`
   - `@DataJpaTest` → `org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest`
   - `@SpringBootTest` giữ nguyên; `@MockBean` đã bị bỏ → dùng `@MockitoBean`.

---

## 2. Quyết định kiến trúc: 1 ứng dụng + 6 module

```
nexus-app  (jar chạy được, cổng 8080)
   ├── nexus-user          schema nexus_user         FR-01..04, FR-52
   ├── nexus-catalog       schema nexus_catalog      FR-05..12, 41,42,45, 53,54,59
   ├── nexus-fulfillment   schema nexus_fulfillment  FR-13,14, 38..40, 55
   ├── nexus-commerce      schema nexus_commerce     FR-15..25, 43,44, 46..48, 56,58
   ├── nexus-auction       schema nexus_auction      FR-26..37, 57
   ├── nexus-notification  schema nexus_notification FR-49..51
   └── nexus-common        (hạ tầng dùng chung, không chạy độc lập)
```

**Vì sao không phải 6 tiến trình riêng?**
- Ranh giới nghiệp vụ (yêu cầu cốt lõi của SRS) vẫn được giữ: mỗi module **một schema**, **không** tham chiếu JPA sang module khác, tham chiếu chéo chỉ là `UUID`.
- Baseline có 3 FR là **giao dịch xuyên module**: FR-05 (tạo product kèm SKU + tồn kho), FR-16 (kiểm tra tồn kho khi thêm giỏ), FR-25 (huỷ đơn phải trả lại kho). Trong cùng một tiến trình + một DB, chúng là **một transaction nội bộ** → không cần saga, không cần inventory reservation, không cần job bù trừ.
- Tiết kiệm khoảng 1 tuần công hạ tầng cho nhóm 5 người trong 10 tuần.

**Nếu hội đồng yêu cầu 6 tiến trình:** thêm một `@SpringBootApplication` + `application.yml` cho mỗi module là chạy được độc lập; mã nghiệp vụ không phải sửa. Đừng trả giá đó ngay từ đầu.

---

## 3. Cấu trúc thư mục

```
backend/
├── pom.xml                     # parent POM (quản lý version + cấu hình compiler)
├── build.ps1                   # script build (đặt MAVEN_OPTS cho local repo — xem §7)
├── CONVENTIONS.md              # HỢP ĐỒNG CODE — đọc trước khi viết bất kỳ dòng nào
├── .env.example                # mẫu biến môi trường
├── db/                         # DDL PostgreSQL, mỗi module một file
└── nexus-<module>/
    └── src/main/java/com/nexus/<module>/
        ├── controller/{publicapi,common,buyer,seller,admin}/   ← phân theo ROLE
        ├── dto/{common,buyer,seller,admin}/
        ├── entity/  enums/  mapper/  repository/
        └── service/ + service/impl/
```

**Cấu trúc phân theo role** — mỗi module có tối đa 5 nhóm controller:

| Nhóm | Tiền tố API | Ai gọi |
|---|---|---|
| `controller/publicapi` | `/api/v1/auth/**` | Không cần token (đăng ký, đăng nhập) |
| `controller/common` | `/api/v1/<module>/**` | Mọi role đã đăng nhập (dùng cho FR ghi nhiều actor — ví dụ FR-06, FR-28) |
| `controller/buyer` | `/api/v1/buyer/**` | `ROLE_BUYER` |
| `controller/seller` | `/api/v1/seller/**` | `ROLE_SELLER` |
| `controller/admin` | `/api/v1/admin/**` | `ROLE_ADMIN` |

DTO cũng chia theo role (`dto/buyer`, `dto/seller`, `dto/admin`, `dto/common`) vì mỗi role nhìn thấy tập field khác nhau.

---

## 4. Chạy dự án

### 4.1 Chuẩn bị database

Khuyến nghị: **mỗi thành viên dùng một database riêng** để không giẫm chân nhau. Supabase chỉ dùng cho môi trường demo chung.

```bash
# Tạo schema + bảng (chạy một lần)
psql "$DB_URL" -f db/00-create-schemas.sql
psql "$DB_URL" -f db/01-user.sql
psql "$DB_URL" -f db/02-catalog.sql
psql "$DB_URL" -f db/03-fulfillment.sql
psql "$DB_URL" -f db/04-commerce.sql
psql "$DB_URL" -f db/05-auction.sql
psql "$DB_URL" -f db/06-notification.sql
psql "$DB_URL" -f db/99-seed.sql
```

> Trên DB dùng chung / demo, đặt `DDL_AUTO=validate` để Hibernate **không** tự sửa schema.
> Trên máy cá nhân có thể để `DDL_AUTO=update` cho nhanh.
> **Tuyệt đối không** dùng `create`, `create-drop`, `DROP`, `TRUNCATE` trên Supabase.

### 4.2 Biến môi trường

Copy `.env.example` → `.env` và điền giá trị thật. Các biến chính:

| Biến | Ý nghĩa |
|---|---|
| `DB_URL` | `jdbc:postgresql://<host>:5432/<db>` — **không** dùng URL dashboard của Supabase |
| `DB_USERNAME`, `DB_PASSWORD` | thông tin đăng nhập DB |
| `DDL_AUTO` | `update` (dev) hoặc `validate` (DB chung) |
| `JWT_SECRET` | chuỗi ký token, **phải đổi** trước khi deploy |
| `CORS_ALLOWED_ORIGINS` | origin của Frontend (mặc định `localhost:3000,localhost:5173`) |

### 4.3 Build

```powershell
cd backend
.\build.ps1                 # mvn clean verify
.\build.ps1 -DskipTests verify
```

### 4.4 Chạy

```powershell
java -jar nexus-app\target\nexus-app-1.0.0-SNAPSHOT.jar
```

- Swagger UI: <http://localhost:8080/swagger-ui.html>
- Health: <http://localhost:8080/actuator/health>
- OpenAPI JSON: <http://localhost:8080/v3/api-docs>

### 4.5 Dùng thử API

1. `POST /api/v1/auth/login` với tài khoản demo (seeder tự tạo ở lần chạy đầu):
   `admin@nexus.local` / `Admin@123` → nhận `accessToken`.
2. Bấm **Authorize** trên Swagger UI, dán token (`Bearer` đã tự thêm).
3. Gọi các API `/api/v1/admin/...`, `/api/v1/seller/...`, `/api/v1/buyer/...`.

Cần tài khoản Seller/Buyer thì gọi `POST /api/v1/auth/register` với `role` là `SELLER` hoặc `BUYER`.

---

## 5. Bản đồ API theo role

| Role | Nhóm chức năng | Ví dụ endpoint |
|---|---|---|
| **Công khai** | Đăng ký, đăng nhập | `POST /api/v1/auth/register`, `POST /api/v1/auth/login` |
| **Buyer** | Giỏ hàng, checkout, đơn của tôi, đặt giá, đánh giá, xem vận đơn, thông báo | `POST /api/v1/buyer/commerce/cart/items`, `POST /api/v1/buyer/auction/auctions/{id}/bids` |
| **Seller** | Quản lý sản phẩm, tồn kho, đơn đến, vận đơn, phiên đấu giá | `POST /api/v1/seller/catalog/products`, `PATCH /api/v1/seller/fulfillment/inventories/{id}` |
| **Admin** | Người dùng, danh mục, sản phẩm, tồn kho, đơn, đấu giá, khuyến mãi, kiểm duyệt đánh giá | `PATCH /api/v1/admin/users/{id}/status`, `POST /api/v1/admin/commerce/campaigns` |
| **Mọi role** | Xem sản phẩm/danh mục/đấu giá, lịch sử bid, thông báo của mình | `GET /api/v1/catalog/products`, `GET /api/v1/auction/auctions/{id}` |

---

## 6. Những điểm **cố ý làm khác** khuyến nghị trong tài liệu review (đọc để trả lời hội đồng)

| # | Điểm | Lý do |
|---|---|---|
| 1 | `skus.seller_id` **được thêm** (denormalized) | FR-13 yêu cầu "Seller xem tồn kho của **sản phẩm mình**". Không có cột này thì phải gọi sang module catalog ngay ở giai đoạn CRUD. Nguồn sự thật của seller vẫn là `products.seller_id`; khi làm business logic có thể bỏ và thay bằng lời gọi service. |
| 2 | `CartItem.unitPrice` / `productName` **nhận từ request** ở giai đoạn CRUD | Giai đoạn CRUD chưa nối module catalog/fulfillment. Đã đánh dấu `TODO (business logic)` trong code: giá và tên phải lấy từ Catalog, tồn kho phải kiểm tra qua Fulfillment. |
| 3 | `OrderStatus` **không có `PAID`** | FR-24 quy định đúng `PENDING → CONFIRMED → SHIPPING → COMPLETED` (+ `CANCELLED`). Thanh toán thành công thể hiện ở `Payment.status = SUCCESS`; điều kiện tạo Shipment (FR-38) kiểm tra theo `Payment.status`, không theo order status. |
| 4 | Luật bid là `amount > currentPrice` (bid đầu `>= startingPrice`) | FR-30 chỉ yêu cầu "lớn hơn giá cao nhất hiện tại". **Không** dùng `bid_increment` vì baseline 59 FR không có khái niệm này. |
| 5 | `Bid` **có** cột `status` (ACCEPTED/REJECTED) | FR-30 nêu rõ hai kết quả này. |
| 6 | **Không** làm anti-sniping, đặt cọc, `AuctionRegistration`, reputation, inventory reservation, idempotency webhook, tích hợp GHN/GHTK/Stripe thật | Đều **không thuộc 59 FR** (chỉ có trong SRS đầy đủ của thầy). Ghi rõ trong báo cáo là phần hoãn, không phải phần bỏ sót. |
| 7 | Mỗi order giới hạn **một Seller** | Giả định của nhóm cho MVP; đã ghi rõ trong code checkout và trong tài liệu. |
| 8 | Đăng nhập trả **token ký HMAC nội bộ** thay vì JWT thư viện | Đủ cho FR-02 (có token + hạn dùng + chữ ký), không thêm dependency ngoài. Muốn chuẩn JWT: viết thêm một implementation `TokenService` và đánh dấu `@Primary` — không phải sửa controller. |

---

## 7. Lưu ý vận hành trên máy hiện tại

- Maven trên máy này **không ghi được vào `~/.m2`**. Vì vậy `build.ps1` trỏ local repository về `<repo>/.m2repo`.
  Điểm cần nhớ: **Maven bỏ qua `-Dmaven.repo.local` truyền trên command line** — phải đặt qua biến môi trường `MAVEN_OPTS` (script đã làm sẵn).
- Từ **JDK 23** trở đi, javac **không** tự chạy annotation processor tìm thấy trên classpath. Parent POM đã khai báo `annotationProcessorPaths` cho Lombok — **không được xoá**, nếu xoá thì Lombok không sinh getter/builder và mọi module lỗi compile.
- Mỗi module có `src/test/resources/mockito-extensions/org.mockito.plugins.MockMaker` = `mock-maker-subclass` để Mockito chạy được trong môi trường chặn cơ chế tự gắn agent. Trên máy bình thường có thể xoá file này.

---

## 8. Kiểm thử

Theo `CONVENTIONS.md` §14:

1. **Chính:** unit test nghiệp vụ bằng `@ExtendWith(MockitoExtension.class)` — không cần Spring context, không cần DB.
2. Mapper: JUnit thuần.
3. HTTP/phân quyền: dùng `@SpringBootTest(webEnvironment = RANDOM_PORT)` + token thật (lưu ý `@WebMvcTest` **không** nạp cấu hình bảo mật của dự án, và `@WithMockUser` không hoạt động với session STATELESS).
4. Chưa dùng `@DataJpaTest` vì máy dev chưa có PostgreSQL local/Docker.

```powershell
.\build.ps1 test
```

---

## 9. Việc còn lại (giai đoạn business logic)

Các `TODO (business logic)` đã được đánh dấu sẵn trong code, tập trung ở:

- **FR-05**: tạo Product kèm SKU + tồn kho ban đầu (nối catalog → fulfillment).
- **FR-16**: kiểm tra tồn kho thật khi thêm vào giỏ (commerce → fulfillment); lấy giá/tên từ catalog.
- **FR-25**: huỷ đơn phải trả lại tồn kho.
- **FR-32**: outbid → tạo notification cho người bị đè giá.
- **FR-36**: settlement của auction → tạo Order loại `AUCTION` bên commerce.
- **FR-38**: chỉ cho tạo Shipment khi `Payment.status = SUCCESS`.
- **FR-08**: chặn xoá sản phẩm đang có auction/đơn hàng đang hoạt động.

---

## 10. Tài liệu liên quan

| File | Nội dung |
|---|---|
| `CONVENTIONS.md` | Hợp đồng code: cấu trúc, quy ước, lớp dùng chung, đặc tả entity, ma trận FR → endpoint |
| `../Doc/NEXUS-Review-Tong-hop-va-Quyet-dinh.md` | Review độc lập: ai đúng/sai, lỗi còn sót, tính khả thi, kiểm chứng phiên bản |
| `../scope.xlsx` | **Baseline 59 FR** — nguồn yêu cầu duy nhất |
| `db/*.sql` | DDL PostgreSQL theo từng module |
