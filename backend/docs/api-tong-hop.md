# NEXUS — TỔNG HỢP TOÀN BỘ API BACKEND

> Tài liệu này liệt kê **đầy đủ 91 endpoint** hiện có trong backend (`backend/`), giải thích
> từng endpoint: quyền truy cập, request, response, lỗi thường gặp và ghi chú nghiệp vụ.
>
> **Nguồn dữ liệu:** đọc trực tiếp từ 19 lớp `@RestController` trong `backend/nexus-*/src/main/java/**/controller/`.
> Không có endpoint nào trong tài liệu này là suy đoán.

---

## MỤC LỤC

1. [Tổng quan & bản đồ module](#1-tổng-quan--bản-đồ-module)
2. [Quy ước chung (đọc trước)](#2-quy-ước-chung-đọc-trước)
3. [Bảng tra cứu nhanh 91 endpoint](#3-bảng-tra-cứu-nhanh-91-endpoint)
4. [Module User — FR-01, 02, 03, 04, 52](#4-module-user)
5. [Module Catalog — FR-05..12, 41, 42, 45, 53, 54, 59](#5-module-catalog)
6. [Module Fulfillment — FR-13, 14, 38, 39, 40, 55](#6-module-fulfillment)
7. [Module Commerce — FR-15..25, 43, 44, 46, 47, 48, 56, 58](#7-module-commerce)
8. [Module Auction — FR-26..37, 57](#8-module-auction)
9. [Module Notification — FR-49, 50, 51](#9-module-notification)
10. [Phụ lục A — Toàn bộ enum](#phụ-lục-a--toàn-bộ-enum)
11. [Phụ lục B — Luồng nghiệp vụ end-to-end](#phụ-lục-b--luồng-nghiệp-vụ-end-to-end)
12. [Phụ lục C — Endpoint hạ tầng & điểm chưa hoàn thiện](#phụ-lục-c--endpoint-hạ-tầng--điểm-chưa-hoàn-thiện)

---

## 1. Tổng quan & bản đồ module

Backend là **một ứng dụng Spring Boot 4.1.1 / Java 21** duy nhất, chia thành 6 module nghiệp vụ
+ 1 module hạ tầng. Mỗi module có **schema PostgreSQL riêng**, tham chiếu chéo module chỉ bằng `UUID`
(không join JPA xuyên module).

```
nexus-app  (jar chạy được — cổng 8080)
   ├── nexus-user          schema nexus_user         FR-01..04, FR-52
   ├── nexus-catalog       schema nexus_catalog      FR-05..12, 41, 42, 45, 53, 54, 59
   ├── nexus-fulfillment   schema nexus_fulfillment  FR-13, 14, 38..40, 55
   ├── nexus-commerce      schema nexus_commerce     FR-15..25, 43, 44, 46..48, 56, 58
   ├── nexus-auction       schema nexus_auction      FR-26..37, 57
   ├── nexus-notification  schema nexus_notification FR-49..51
   └── nexus-common        (hạ tầng: security, exception, PageResponse, ApiError)
```

### Số lượng controller / endpoint theo module

| Module | Số controller | Số endpoint | Tiền tố API |
|---|---:|---:|---|
| nexus-user | 4 | **12** | `/api/v1/auth`, `/api/v1/buyer/profile`, `/api/v1/seller/profile`, `/api/v1/admin/users` |
| nexus-catalog | 4 | **20** | `/api/v1/catalog`, `/api/v1/buyer/catalog`, `/api/v1/seller/catalog`, `/api/v1/admin/catalog` |
| nexus-fulfillment | 3 | **13** | `/api/v1/buyer/fulfillment`, `/api/v1/seller/fulfillment`, `/api/v1/admin/fulfillment` |
| nexus-commerce | 3 | **30** | `/api/v1/buyer/commerce`, `/api/v1/seller/commerce`, `/api/v1/admin/commerce` |
| nexus-auction | 4 | **10** | `/api/v1/auction/auctions`, `/api/v1/buyer/auction`, `/api/v1/seller/auction`, `/api/v1/admin/auction` |
| nexus-notification | 1 | **6** | `/api/v1/notification/notifications` |
| **TỔNG** | **19** | **91** | |

Chi tiết theo từng controller:

| Controller | Endpoint |
|---|---:|
| `AuthController` | 5 |
| `BuyerProfileController` | 2 |
| `SellerProfileController` | 2 |
| `AdminUserController` | 3 |
| `CatalogQueryController` | 4 |
| `CatalogBuyerController` | 1 |
| `CatalogSellerController` | 5 |
| `CatalogAdminController` | 10 |
| `FulfillmentBuyerController` | 1 |
| `FulfillmentSellerController` | 7 |
| `FulfillmentAdminController` | 5 |
| `CommerceBuyerController` | 12 |
| `CommerceSellerController` | 4 |
| `CommerceAdminController` | 14 |
| `AuctionQueryController` | 4 |
| `AuctionBuyerController` | 1 |
| `AuctionSellerController` | 3 |
| `AuctionAdminController` | 2 |
| `NotificationController` | 6 |
| **TỔNG** | **91** |

### Cấu trúc controller phân theo role

Đây là quy ước **quan trọng nhất** để đọc tài liệu này — tiền tố URL nói luôn ai được gọi:

| Gói | Tiền tố | Ai gọi được |
|---|---|---|
| `controller/publicapi` | `/api/v1/auth/**` | Không cần token |
| `controller/common` | `/api/v1/<module>/**` | Mọi role đã đăng nhập |
| `controller/buyer` | `/api/v1/buyer/**` | Chỉ `ROLE_BUYER` |
| `controller/seller` | `/api/v1/seller/**` | Chỉ `ROLE_SELLER` |
| `controller/admin` | `/api/v1/admin/**` | Chỉ `ROLE_ADMIN` |

> Ngoại lệ: `CatalogQueryController` (`/api/v1/catalog/**`) là `permitAll` cho **cả khách chưa đăng nhập**
> — sàn TMĐT công khai sản phẩm.

---

## 2. Quy ước chung (đọc trước)

### 2.1 Base URL

```
http://localhost:8080        (biến môi trường SERVER_PORT)
```

Mọi đường dẫn bên dưới đều **đã bao gồm** tiền tố `/api/v1`.

### 2.2 Xác thực

Hệ thống **stateless**, xác thực bằng Bearer token (HMAC ký nội bộ, không phải JWT thư viện):

```http
Authorization: Bearer <accessToken>
```

- Token có hạn dùng, mặc định **480 phút** (`TOKEN_TTL_MINUTES`).
- Lấy token qua `POST /api/v1/auth/login` hoặc `POST /api/v1/auth/register`… (register không trả token)
  hoặc `POST /api/v1/auth/oauth2/exchange` (luồng Google).
- **Không client nào gửi `userId`/`buyerId`/`sellerId` của chính mình trong body hay query.**
  Danh tính luôn lấy từ token ở server (`SecurityUtils.currentUserId()`). Đây là biện pháp chống giả mạo
  được áp dụng xuyên suốt 91 endpoint.
  - Ngoại lệ duy nhất: `POST /api/v1/notification/notifications` — `userId` trong body là **người nhận**
    thông báo (endpoint nội bộ cho module khác gọi), không phải người đang đăng nhập.
  - Ngoại lệ thứ hai: các filter của Admin như `?buyerId=`, `?sellerId=` là **điều kiện lọc**, không phải danh tính.

### 2.3 Phân trang — chuẩn chung

Mọi endpoint trả danh sách đều nhận **tham số `Pageable` chuẩn của Spring**:

| Tham số | Mặc định | Ý nghĩa |
|---|---|---|
| `page` | `0` | Chỉ số trang, **bắt đầu từ 0** |
| `size` | `20` | Số phần tử mỗi trang |
| `sort` | tuỳ endpoint | `sort=field,asc` / `sort=field,desc` (lặp lại được nhiều lần) |

Response **luôn** là `PageResponse<T>`, **không bao giờ** trả `Page<T>` thô của Spring:

```json
{
  "content": [ /* mảng phần tử của trang hiện tại */ ],
  "page": 0,
  "size": 20,
  "totalElements": 137,
  "totalPages": 7,
  "first": true,
  "last": false
}
```

### 2.4 Hợp đồng lỗi — `ApiError`

Mọi lỗi (kể cả lỗi xác thực ở tầng filter) trả về **cùng một cấu trúc**:

```json
{
  "timestamp": "2025-06-14T08:12:33.441Z",
  "status": 422,
  "error": "BUSINESS_RULE_VIOLATION",
  "message": "Đơn hàng đã ở trạng thái kết thúc nên không thể huỷ",
  "path": "/api/v1/buyer/commerce/orders/8f3a.../cancel",
  "details": [
    { "field": "quantity", "message": "quantity phải lớn hơn 0" }
  ]
}
```

`details` chỉ có nội dung với lỗi validate; các lỗi khác là mảng rỗng.

### 2.5 Bảng mã lỗi (`ErrorCode`)

| `error` | HTTP | Khi nào |
|---|---:|---|
| `VALIDATION_ERROR` | **400** | Dữ liệu vi phạm `@NotNull`, `@Size`, `@Min`… (`details` liệt kê từng field) |
| `BAD_REQUEST` | **400** | JSON sai cú pháp, sai kiểu tham số, thiếu query param bắt buộc |
| `UNAUTHORIZED` | **401** | Không có token / token sai / token hết hạn |
| `FORBIDDEN` | **403** | Đã đăng nhập nhưng sai role, hoặc truy cập tài nguyên của người khác |
| `NOT_FOUND` | **404** | Không tìm thấy tài nguyên |
| `CONFLICT` | **409** | Trùng dữ liệu duy nhất (email, username, `code` mã giảm giá, `skuCode`, mã kho) |
| `BUSINESS_RULE_VIOLATION` | **422** | Vi phạm quy tắc nghiệp vụ (nhảy cóc trạng thái, huỷ đơn đã kết thúc, giỏ trống…) |
| `INTERNAL_ERROR` | **500** | Lỗi không mong đợi |

> Lưu ý: dự án dùng **422** (không phải 400) cho lỗi nghiệp vụ. Khi client xử lý lỗi, hãy đọc
> trường `error` chứ đừng chỉ dựa vào HTTP status.

### 2.6 CORS

Cho phép origin từ `CORS_ALLOWED_ORIGINS` (mặc định `http://localhost:3000,http://localhost:5173`),
credentials bật, method `GET/POST/PUT/PATCH/DELETE/OPTIONS`.

---

## 3. Bảng tra cứu nhanh 91 endpoint

Ký hiệu role: 🌐 = công khai (không cần token), 🔓 = mọi role đã đăng nhập, 🛒 = BUYER,
🏪 = SELLER, 👑 = ADMIN.

| # | Method | Đường dẫn | Role | FR | Mô tả ngắn |
|---:|---|---|---|---|---|
| | | **— USER / AUTH —** | | | |
| 1 | POST | `/api/v1/auth/register` | 🌐 | 01 | Đăng ký Buyer/Seller |
| 2 | POST | `/api/v1/auth/login` | 🌐 | 02 | Đăng nhập email + mật khẩu |
| 3 | POST | `/api/v1/auth/logout` | 🔓 | 02 | Đăng xuất (stateless) |
| 4 | GET | `/api/v1/auth/me` | 🔓 | 02 | Thông tin người đang đăng nhập |
| 5 | POST | `/api/v1/auth/oauth2/exchange` | 🌐 | 02 | Đổi mã Google lấy token |
| 6 | GET | `/api/v1/buyer/profile` | 🛒 | 03 | Buyer xem hồ sơ |
| 7 | PUT | `/api/v1/buyer/profile` | 🛒 | 03 | Buyer cập nhật hồ sơ |
| 8 | GET | `/api/v1/seller/profile` | 🏪 | 03 | Seller xem hồ sơ |
| 9 | PUT | `/api/v1/seller/profile` | 🏪 | 03 | Seller cập nhật hồ sơ |
| 10 | GET | `/api/v1/admin/users` | 👑 | 04, 52 | Danh sách/tìm kiếm người dùng |
| 11 | GET | `/api/v1/admin/users/{id}` | 👑 | 04 | Chi tiết người dùng |
| 12 | PATCH | `/api/v1/admin/users/{id}/status` | 👑 | 04 | Đổi trạng thái tài khoản |
| | | **— CATALOG —** | | | |
| 13 | GET | `/api/v1/catalog/products` | 🌐 | 06, 11, 12 | Tìm/lọc/sắp xếp sản phẩm |
| 14 | GET | `/api/v1/catalog/products/{id}` | 🌐 | 06 | Chi tiết sản phẩm |
| 15 | GET | `/api/v1/catalog/categories` | 🌐 | 09 | Cây danh mục đang hoạt động |
| 16 | GET | `/api/v1/catalog/products/{id}/reviews` | 🌐 | 41 | Đánh giá VISIBLE của sản phẩm |
| 17 | POST | `/api/v1/buyer/catalog/products/{id}/reviews` | 🛒 | 41, 42 | Buyer đánh giá sản phẩm |
| 18 | POST | `/api/v1/seller/catalog/products` | 🏪 | 05 | Tạo sản phẩm |
| 19 | PUT | `/api/v1/seller/catalog/products/{id}` | 🏪 | 07 | Cập nhật sản phẩm |
| 20 | DELETE | `/api/v1/seller/catalog/products/{id}` | 🏪 | 08 | Xoá mềm sản phẩm |
| 21 | PATCH | `/api/v1/seller/catalog/products/{id}/category` | 🏪 | 10 | Gán/đổi danh mục |
| 22 | POST | `/api/v1/seller/catalog/products/{id}/images/upload` | 🏪 | 05, 07 | Upload ảnh lên Supabase |
| 23 | GET | `/api/v1/admin/catalog/categories` | 👑 | 09, 54 | Danh sách danh mục |
| 24 | GET | `/api/v1/admin/catalog/categories/{id}` | 👑 | 09, 54 | Chi tiết danh mục |
| 25 | POST | `/api/v1/admin/catalog/categories` | 👑 | 09, 54 | Tạo danh mục |
| 26 | PUT | `/api/v1/admin/catalog/categories/{id}` | 👑 | 09, 54 | Cập nhật danh mục |
| 27 | DELETE | `/api/v1/admin/catalog/categories/{id}` | 👑 | 09, 54 | Ngừng hoạt động danh mục |
| 28 | GET | `/api/v1/admin/catalog/products` | 👑 | 53 | Danh sách sản phẩm cho Admin |
| 29 | PATCH | `/api/v1/admin/catalog/products/{id}/status` | 👑 | 53 | Đổi trạng thái sản phẩm |
| 30 | DELETE | `/api/v1/admin/catalog/products/{id}` | 👑 | 08 | Admin xoá mềm sản phẩm |
| 31 | GET | `/api/v1/admin/catalog/reviews` | 👑 | 45 | Danh sách đánh giá chờ duyệt |
| 32 | PATCH | `/api/v1/admin/catalog/reviews/{id}/status` | 👑 | 59 | Duyệt/ẩn đánh giá |
| | | **— FULFILLMENT —** | | | |
| 33 | GET | `/api/v1/buyer/fulfillment/shipments` | 🛒 | 40 | Theo dõi vận đơn theo `orderId` |
| 34 | POST | `/api/v1/seller/fulfillment/skus` | 🏪 | 05 | Tạo SKU + tồn kho ban đầu |
| 35 | GET | `/api/v1/seller/fulfillment/skus` | 🏪 | 05 | Danh sách SKU của tôi |
| 36 | GET | `/api/v1/seller/fulfillment/inventories` | 🏪 | 13 | Tồn kho của tôi (có lọc) |
| 37 | GET | `/api/v1/seller/fulfillment/inventories/{id}` | 🏪 | 13 | Chi tiết một dòng tồn kho |
| 38 | PATCH | `/api/v1/seller/fulfillment/inventories/{id}` | 🏪 | 14 | Tăng/giảm/đặt lại tồn |
| 39 | POST | `/api/v1/seller/fulfillment/shipments` | 🏪 | 38 | Tạo vận đơn |
| 40 | PATCH | `/api/v1/seller/fulfillment/shipments/{id}/status` | 🏪 | 39 | Cập nhật trạng thái vận đơn |
| 41 | GET | `/api/v1/admin/fulfillment/inventories` | 👑 | 55 | Giám sát tồn kho toàn hệ thống |
| 42 | GET | `/api/v1/admin/fulfillment/warehouses` | 👑 | 55 | Danh sách kho |
| 43 | GET | `/api/v1/admin/fulfillment/warehouses/{id}` | 👑 | 55 | Chi tiết kho |
| 44 | POST | `/api/v1/admin/fulfillment/warehouses` | 👑 | 55 | Tạo kho |
| 45 | PUT | `/api/v1/admin/fulfillment/warehouses/{id}` | 👑 | 55 | Cập nhật/ngừng kho |
| | | **— COMMERCE —** | | | |
| 46 | GET | `/api/v1/buyer/commerce/cart` | 🛒 | 15 | Giỏ đang ACTIVE (tạo nếu chưa có) |
| 47 | POST | `/api/v1/buyer/commerce/cart/items` | 🛒 | 16 | Thêm dòng hàng vào giỏ |
| 48 | PUT | `/api/v1/buyer/commerce/cart/items/{itemId}` | 🛒 | 17 | Đổi số lượng dòng hàng |
| 49 | DELETE | `/api/v1/buyer/commerce/cart/items/{itemId}` | 🛒 | 18 | Xoá dòng hàng |
| 50 | POST | `/api/v1/buyer/commerce/checkout` | 🛒 | 19, 22 | Đặt hàng từ giỏ |
| 51 | POST | `/api/v1/buyer/commerce/checkout/apply-discount` | 🛒 | 20, 48 | Xem trước số tiền giảm |
| 52 | GET | `/api/v1/buyer/commerce/orders` | 🛒 | 23 | Đơn của tôi |
| 53 | GET | `/api/v1/buyer/commerce/orders/{id}` | 🛒 | 23 | Chi tiết đơn của tôi |
| 54 | POST | `/api/v1/buyer/commerce/orders/{id}/cancel` | 🛒 | 25 | Huỷ đơn của tôi |
| 55 | POST | `/api/v1/buyer/commerce/orders/{id}/payments` | 🛒 | 21 | Tạo giao dịch thanh toán |
| 56 | POST | `/api/v1/buyer/commerce/payments/{id}/confirm` | 🛒 | 21 | Xác nhận kết quả giao dịch |
| 57 | POST | `/api/v1/buyer/commerce/seller-ratings` | 🛒 | 43, 44 | Đánh giá Seller sau COMPLETED |
| 58 | GET | `/api/v1/seller/commerce/orders` | 🏪 | 23 | Đơn đến của tôi |
| 59 | GET | `/api/v1/seller/commerce/orders/{id}` | 🏪 | 23 | Chi tiết đơn của tôi |
| 60 | PATCH | `/api/v1/seller/commerce/orders/{id}/status` | 🏪 | 24 | Chuyển trạng thái đơn |
| 61 | POST | `/api/v1/seller/commerce/orders/{id}/cancel` | 🏪 | 25 | Seller huỷ đơn |
| 62 | GET | `/api/v1/admin/commerce/orders` | 👑 | 56 | Mọi đơn hàng (có lọc) |
| 63 | GET | `/api/v1/admin/commerce/orders/{id}` | 👑 | 56 | Chi tiết đơn bất kỳ |
| 64 | PATCH | `/api/v1/admin/commerce/orders/{id}/status` | 👑 | 56 | Admin đổi trạng thái đơn |
| 65 | POST | `/api/v1/admin/commerce/orders/{id}/cancel` | 👑 | 25 | Admin huỷ đơn |
| 66 | GET | `/api/v1/admin/commerce/campaigns` | 👑 | 46 | Danh sách chiến dịch |
| 67 | GET | `/api/v1/admin/commerce/campaigns/{id}` | 👑 | 46 | Chi tiết chiến dịch |
| 68 | POST | `/api/v1/admin/commerce/campaigns` | 👑 | 46 | Tạo chiến dịch |
| 69 | PUT | `/api/v1/admin/commerce/campaigns/{id}` | 👑 | 46 | Cập nhật chiến dịch |
| 70 | DELETE | `/api/v1/admin/commerce/campaigns/{id}` | 👑 | 46, 58 | Kết thúc chiến dịch |
| 71 | GET | `/api/v1/admin/commerce/discount-codes` | 👑 | 47 | Danh sách mã giảm giá |
| 72 | GET | `/api/v1/admin/commerce/discount-codes/{id}` | 👑 | 47 | Chi tiết mã giảm giá |
| 73 | POST | `/api/v1/admin/commerce/discount-codes` | 👑 | 47 | Tạo mã giảm giá |
| 74 | PUT | `/api/v1/admin/commerce/discount-codes/{id}` | 👑 | 47 | Cập nhật mã giảm giá |
| 75 | PATCH | `/api/v1/admin/commerce/discount-codes/{id}/status` | 👑 | 58 | Bật/tắt mã giảm giá |
| | | **— AUCTION —** | | | |
| 76 | GET | `/api/v1/auction/auctions` | 🔓 | 29 | Danh sách phiên đấu giá |
| 77 | GET | `/api/v1/auction/auctions/{id}` | 🔓 | 28 | Chi tiết phiên |
| 78 | GET | `/api/v1/auction/auctions/{id}/bids` | 🔓 | 31 | Lịch sử bid ACCEPTED |
| 79 | GET | `/api/v1/auction/auctions/{id}/settlement` | 🔓 | 35 | Kết quả chốt phiên |
| 80 | POST | `/api/v1/buyer/auction/auctions/{id}/bids` | 🛒 | 30 | Buyer đặt giá |
| 81 | POST | `/api/v1/seller/auction/auctions` | 🏪 | 26 | Tạo phiên đấu giá |
| 82 | PUT | `/api/v1/seller/auction/auctions/{id}` | 🏪 | 27 | Cấu hình lại phiên (SCHEDULED) |
| 83 | POST | `/api/v1/seller/auction/auctions/{id}/cancel` | 🏪 | 37 | Seller huỷ phiên |
| 84 | GET | `/api/v1/admin/auction/auctions` | 👑 | 57 | Mọi phiên + lịch sử bid |
| 85 | POST | `/api/v1/admin/auction/auctions/{id}/cancel` | 👑 | 37 | Admin huỷ phiên |
| | | **— NOTIFICATION —** | | | |
| 86 | POST | `/api/v1/notification/notifications` | 🔓 | 49 | Tạo thông báo (nội bộ) |
| 87 | GET | `/api/v1/notification/notifications` | 🔓 | 50 | Thông báo của tôi |
| 88 | GET | `/api/v1/notification/notifications/unread-count` | 🔓 | 50 | Số chưa đọc (badge) |
| 89 | GET | `/api/v1/notification/notifications/{id}` | 🔓 | 50 | Chi tiết thông báo |
| 90 | PATCH | `/api/v1/notification/notifications/{id}/read` | 🔓 | 51 | Đánh dấu đã đọc |
| 91 | PATCH | `/api/v1/notification/notifications/read-all` | 🔓 | 51 | Đánh dấu tất cả đã đọc |

> Bảng trên có đúng **91 dòng endpoint**, khớp với số method mapping thực tế trong 19 controller.

---

## 4. Module User

**Controller:** `AuthController`, `BuyerProfileController`, `SellerProfileController`, `AdminUserController`
**Schema:** `nexus_user` — bảng `users`, `roles`, `user_roles`

### 4.1 `POST /api/v1/auth/register` — Đăng ký (FR-01)

- **Quyền:** 🌐 công khai (`permitAll`)
- **Mô tả:** Buyer hoặc Seller tự đăng ký. **Không cho phép tự đăng ký ADMIN** — ràng buộc ở 2 lớp
  (`@Pattern` trong DTO + kiểm tra lại trong service).
- **Request:**
  ```json
  {
    "email": "an.nguyen@example.com",
    "username": "annguyen",
    "password": "MatKhau@123",
    "fullName": "Nguyễn Văn An",
    "phone": "0912345678",
    "role": "BUYER"
  }
  ```
  | Field | Bắt buộc | Ràng buộc |
  |---|---|---|
  | `email` | ✅ | Đúng định dạng email, ≤ 255 ký tự |
  | `username` | ✅ | 3–50 ký tự, chỉ `a-zA-Z0-9._-` |
  | `password` | ✅ | 8–72 ký tự (BCrypt chỉ dùng 72 byte đầu) |
  | `fullName` | ✅ | ≤ 150 ký tự |
  | `phone` | ❌ | Bỏ trống hoặc 8–20 ký tự số/`+()-. ` |
  | `role` | ✅ | **Chỉ `BUYER` hoặc `SELLER`** |

- **Response `201 Created`** — `UserResponse`:
  ```json
  {
    "id": "3f2b...-...",
    "email": "an.nguyen@example.com",
    "username": "annguyen",
    "fullName": "Nguyễn Văn An",
    "phone": "0912345678",
    "gender": null,
    "status": "ACTIVE",
    "roles": ["BUYER"],
    "createdAt": "2025-06-14T08:00:00Z"
  }
  ```
  **Không trả token** — client phải gọi `/auth/login` sau khi đăng ký.
- **Lỗi:** `400 VALIDATION_ERROR`, `409 CONFLICT` ("Email hoặc tên đăng nhập đã tồn tại").
- **Ghi chú:** `roles` trả về dạng chuỗi không có tiền tố `ROLE_` (`["BUYER"]`), nhưng khi phân quyền
  nội bộ dùng `ROLE_BUYER` — client không cần quan tâm.

### 4.2 `POST /api/v1/auth/login` — Đăng nhập (FR-02)

- **Quyền:** 🌐 công khai
- **Request:**
  ```json
  { "email": "admin@nexus.local", "password": "Admin@123" }
  ```
- **Response `200 OK`** — `AuthResponse`:
  ```json
  {
    "accessToken": "eyJhbGciOi...",
    "tokenType": "Bearer",
    "expiresIn": 28800,
    "user": { "id": "...", "email": "...", "roles": ["ADMIN"], "status": "ACTIVE" }
  }
  ```
  `expiresIn` tính bằng **giây** (mặc định 28800 = 8 giờ).
- **Lỗi:** `401 UNAUTHORIZED` — cố tình trả **cùng một thông báo** "Email hoặc mật khẩu không đúng"
  cho cả hai trường hợp sai email và sai mật khẩu, để không tiết lộ tài khoản nào tồn tại.
- **Ghi chú:** tài khoản `INACTIVE`/`BANNED` cũng bị từ chối ở bước này.

### 4.3 `POST /api/v1/auth/logout` — Đăng xuất (FR-02)

- **Quyền:** 🔓 đã đăng nhập
- **Request:** không có body
- **Response:** `204 No Content`
- **Ghi chú:** hệ thống **stateless** — server không giữ danh sách token thu hồi, nên đây chủ yếu là
  endpoint "hợp đồng": **client phải tự xoá token** khỏi storage sau khi gọi.

### 4.4 `GET /api/v1/auth/me` — Thông tin người đang đăng nhập (FR-02)

- **Quyền:** 🔓 đã đăng nhập
- **Response `200`** — `UserResponse` (giống response của register)
- **Ghi chú:** danh tính lấy từ token, **không nhận `userId` từ client**.

### 4.5 `POST /api/v1/auth/oauth2/exchange` — Đổi mã Google lấy token (FR-02)

- **Quyền:** 🌐 công khai (bắt buộc: ở thời điểm này client **chưa có** token — chính mã là bằng chứng xác thực)
- **Request:**
  ```json
  { "code": "a1b2c3d4-..." }
  ```
- **Response `200`** — `AuthResponse` (cùng hình dạng với `/auth/login`)
- **Lỗi:** `401 UNAUTHORIZED` — mã không hợp lệ, đã dùng, hoặc đã hết hạn.
- **Mô tả luồng đầy đủ:**
  1. Browser mở `GET /oauth2/authorization/google?role=BUYER` (có thể thêm `?role=SELLER`).
  2. Backend chuyển hướng sang Google; Google gọi lại `/login/oauth2/code/google`.
  3. Backend tạo/lấy user, sinh **mã dùng-một-lần sống 60 giây**, chuyển hướng về
     `http://localhost:5173/oauth2/callback?code=<mã>`.
  4. Frontend đọc `?code=`, gọi endpoint này để đổi lấy `AuthResponse`.
- **Điều kiện bật:** chỉ hoạt động khi **cả** `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` đều có giá trị.
  Nếu thiếu, các URL `/oauth2/**` trả 404 nhưng endpoint `exchange` **vẫn tồn tại** và trả lỗi rõ ràng
  (nhờ `OAuth2SupportConfig` tách riêng) — ứng dụng không bị sập.
- **Vai trò mặc định** khi client không gửi `?role=`: `OAUTH2_DEFAULT_ROLE` (mặc định `BUYER`).

### 4.6 `GET /api/v1/buyer/profile` — Buyer xem hồ sơ (FR-03)

- **Quyền:** 🛒 `hasRole('BUYER')`
- **Response `200`** — `ProfileResponse`:
  ```json
  {
    "id": "...", "email": "...", "username": "...", "fullName": "...",
    "phone": "...", "address": "...", "dateOfBirth": "2003-05-01",
    "gender": "MALE", "status": "ACTIVE",
    "createdAt": "...", "updatedAt": "..."
  }
  ```
- **Ghi chú thiết kế:** đường dẫn **không có `{id}`** — người dùng chỉ thao tác trên hồ sơ của chính mình.
  Đây là biện pháp chống IDOR (truy cập hồ sơ người khác bằng cách đổi id trên URL).

### 4.7 `PUT /api/v1/buyer/profile` — Buyer cập nhật hồ sơ (FR-03)

- **Quyền:** 🛒
- **Request:** tất cả field đều **tuỳ chọn**
  ```json
  {
    "fullName": "Nguyễn Văn An",
    "phone": "0912345679",
    "address": "123 Lê Lợi, Q.1, TP.HCM",
    "dateOfBirth": "2003-05-01",
    "gender": "MALE"
  }
  ```
  | Field | Ràng buộc |
  |---|---|
  | `fullName` | ≤ 150 ký tự |
  | `phone` | định dạng như register, hoặc chuỗi rỗng |
  | `address` | ≤ 255 ký tự |
  | `dateOfBirth` | phải là **ngày trong quá khứ** |
  | `gender` | `MALE` \| `FEMALE` \| `OTHER` |

- **Ngữ nghĩa cập nhật:** field `null` = **giữ nguyên**; gửi chuỗi rỗng `""` = **xoá giá trị**.
- **Response `200`** — `ProfileResponse` sau khi cập nhật
- **Quan trọng:** **KHÔNG thể đổi `email`/`username`** ở endpoint này. Đó là định danh đăng nhập
  (khoá duy nhất, gắn với token và mọi tham chiếu chéo module). Muốn đổi phải đi luồng riêng
  có xác minh quyền sở hữu (OTP/email) — nằm ngoài phạm vi FR-03.

### 4.8 `GET /api/v1/seller/profile` — Seller xem hồ sơ (FR-03)

- **Quyền:** 🏪 `hasRole('SELLER')`
- **Response `200`** — `ProfileResponse` (dùng chung DTO với Buyer)
- **Ghi chú:** Buyer và Seller dùng chung bảng `users` với đúng cùng các trường được phép sửa,
  nên controller này **tái sử dụng** DTO của gói `dto.buyer` thay vì nhân bản. Khi nào hồ sơ Seller
  có thêm trường riêng (ví dụ thông tin gian hàng) thì mới tách DTO sang `dto.seller`.

### 4.9 `PUT /api/v1/seller/profile` — Seller cập nhật hồ sơ (FR-03)

- **Quyền:** 🏪
- **Request/Response/Lỗi:** giống hệt 4.7 nhưng cho Seller.

### 4.10 `GET /api/v1/admin/users` — Danh sách/tìm kiếm người dùng (FR-04, FR-52)

- **Quyền:** 👑 `hasRole('ADMIN')` ở cấp class
- **Query params:**

  | Tham số | Bắt buộc | Ý nghĩa |
  |---|---|---|
  | `keyword` | ❌ | Tìm mờ theo email/username/họ tên |
  | `status` | ❌ | `ACTIVE` \| `INACTIVE` \| `BANNED` |
  | `role` | ❌ | Lọc theo tên vai trò (ví dụ `BUYER`) |
  | `page`, `size`, `sort` | ❌ | Phân trang chuẩn |

  Ví dụ: `GET /api/v1/admin/users?keyword=an&status=ACTIVE&role=BUYER&page=0&size=20`
- **Response `200`** — `PageResponse<AdminUserSummaryResponse>`:
  ```json
  {
    "content": [
      {
        "id": "...", "email": "...", "username": "...", "fullName": "...",
        "status": "ACTIVE", "roles": ["BUYER"], "createdAt": "..."
      }
    ],
    "page": 0, "size": 20, "totalElements": 1, "totalPages": 1,
    "first": true, "last": true
  }
  ```
- **Ghi chú:** bản `Summary` rút gọn (không có `phone`/`address`/`identityNumber`) để trang danh sách nhẹ.

### 4.11 `GET /api/v1/admin/users/{id}` — Chi tiết người dùng (FR-04)

- **Quyền:** 👑
- **Path param:** `id` (UUID)
- **Response `200`** — `AdminUserResponse` (đầy đủ hơn Summary):
  ```json
  {
    "id": "...", "email": "...", "username": "...", "fullName": "...",
    "phone": "...", "identityNumber": "079203001234",
    "address": "...", "dateOfBirth": "2003-05-01", "gender": "MALE",
    "status": "ACTIVE", "roles": ["BUYER"],
    "createdAt": "...", "updatedAt": "..."
  }
  ```
- **Lỗi:** `404 NOT_FOUND`
- **Ghi chú:** có thêm `identityNumber` so với hồ sơ thường vì Admin cần đối soát danh tính.
  **Không bao giờ** trả `passwordHash` hay `deletedAt`.

### 4.12 `PATCH /api/v1/admin/users/{id}/status` — Đổi trạng thái tài khoản (FR-04)

- **Quyền:** 👑
- **Request:**
  ```json
  { "status": "BANNED" }
  ```
  Giá trị hợp lệ: `ACTIVE` (kích hoạt) \| `INACTIVE` (vô hiệu hoá/tạm khoá) \| `BANNED` (khoá vĩnh viễn).
- **Response `200`** — `AdminUserResponse` sau khi đổi
- **Lỗi:** `404`, `422` khi Admin cố **tự khoá chính mình** (danh tính Admin lấy từ token để kiểm tra).
- **Ghi chú:** không có endpoint xoá cứng người dùng — "xoá" = đổi `status`.

---

## 5. Module Catalog

**Controller:** `CatalogQueryController` (common), `CatalogBuyerController`, `CatalogSellerController`, `CatalogAdminController`
**Schema:** `nexus_catalog` — bảng `categories`, `products`, `product_images`, `product_reviews`

### 5.1 `GET /api/v1/catalog/products` — Tìm/lọc/sắp xếp sản phẩm (FR-06, FR-11, FR-12)

- **Quyền:** 🌐 công khai **và** 🔓 (mở cho cả khách lẫn mọi role đã đăng nhập)
- **Query params:**

  | Tham số | Ý nghĩa |
  |---|---|
  | `keyword` | Tìm theo tên sản phẩm |
  | `categoryId` | Lọc theo danh mục (UUID) |
  | `minPrice`, `maxPrice` | Khoảng giá (BigDecimal) |
  | `status` | `DRAFT` \| `ACTIVE` \| `INACTIVE` — **chỉ có tác dụng với người đã đăng nhập** |
  | `sort` | `sort=basePrice,asc` \| `sort=basePrice,desc` \| `sort=createdAt,desc` (mặc định `createdAt DESC`) |
  | `page`, `size` | Phân trang |

- **Response `200`** — `PageResponse<ProductSummaryResponse>`:
  ```json
  {
    "content": [
      {
        "id": "...", "name": "iPhone 15 Pro", "basePrice": 28990000.00,
        "status": "ACTIVE", "sellerId": "...", "categoryId": "...",
        "categoryName": "Điện thoại", "primaryImageUrl": "https://.../1.jpg",
        "createdAt": "..."
      }
    ],
    "page": 0, "size": 20, "totalElements": 42, "totalPages": 3,
    "first": true, "last": false
  }
  ```
- **Quy tắc bảo mật quan trọng (dễ hiểu sai):**
  - **Khách chưa đăng nhập** luôn bị ép `status = ACTIVE`, kể cả khi không truyền `status`
    hoặc truyền `?status=DRAFT`. Nếu không chặn, bản nháp/ngừng kinh doanh của Seller sẽ lộ ra internet.
  - **Người đã đăng nhập** dùng đúng `status` họ truyền (hoặc không lọc nếu bỏ trống).
  - Sản phẩm đã xoá mềm **không bao giờ** xuất hiện ở endpoint này (kể cả với Admin —
    Admin dùng endpoint #28 riêng).
- **Lưu ý kỹ thuật:** quyền được mở ở **hai lớp độc lập** — `SecurityConfig` (filter chain) và
  `@PreAuthorize` trên controller. Sửa một lớp mà quên lớp kia thì vẫn nhận 401.

### 5.2 `GET /api/v1/catalog/products/{id}` — Chi tiết sản phẩm (FR-06)

- **Quyền:** 🌐 công khai
- **Response `200`** — `ProductResponse` (đầy đủ hơn Summary, có `description` và mảng `images`):
  ```json
  {
    "id": "...", "name": "iPhone 15 Pro",
    "description": "Mô tả chi tiết...", "basePrice": 28990000.00,
    "status": "ACTIVE", "sellerId": "...",
    "categoryId": "...", "categoryName": "Điện thoại",
    "primaryImageUrl": "https://.../1.jpg",
    "images": ["https://.../1.jpg", "https://.../2.jpg"],
    "createdAt": "...", "updatedAt": "..."
  }
  ```
- **Lỗi:** `404 NOT_FOUND`
- **Quy tắc bảo mật:** khách lạ truy cập sản phẩm `DRAFT`/`INACTIVE` nhận **404** (không phải 403).
  Lý do: trả 403 sẽ *xác nhận* rằng "có sản phẩm này nhưng bạn không được xem" — 404 giấu hoàn toàn sự tồn tại.
- **Ghi chú:** `sellerId` chỉ là UUID; thông tin hồ sơ Seller (tên/email) chưa có vì `nexus-catalog`
  **không được phép** phụ thuộc `nexus-user`. Sẽ bổ sung bằng lời gọi service sang module user.

### 5.3 `GET /api/v1/catalog/categories` — Cây danh mục (FR-09)

- **Quyền:** 🌐 công khai
- **Response `200`** — **mảng** `CategoryResponse` (không phân trang — trả dạng cây):
  ```json
  [
    {
      "id": "...", "name": "Điện tử", "description": "...",
      "parentId": null, "status": "ACTIVE", "sortOrder": 1,
      "children": [
        {
          "id": "...", "name": "Điện thoại", "parentId": "...",
          "status": "ACTIVE", "sortOrder": 1, "children": []
        }
      ]
    }
  ]
  ```
- **Ghi chú:** chỉ trả danh mục `ACTIVE`. Trả dạng cây nên **không** phân trang — client nhận toàn bộ
  trong một lần gọi.

### 5.4 `GET /api/v1/catalog/products/{id}/reviews` — Đánh giá của sản phẩm (FR-41)

- **Quyền:** 🌐 công khai
- **Query params:** `page`, `size`, `sort`
- **Response `200`** — `PageResponse<ReviewResponse>`:
  ```json
  {
    "content": [
      {
        "id": "...", "productId": "...", "buyerId": "...", "orderId": "...",
        "score": 5, "comment": "Hàng tốt", "status": "VISIBLE",
        "createdAt": "..."
      }
    ],
    "page": 0, "size": 20, "totalElements": 8, "totalPages": 1,
    "first": true, "last": true
  }
  ```
- **Ghi chú:** chỉ trả đánh giá `VISIBLE` — đánh giá bị Admin ẩn (`HIDDEN`) không xuất hiện với công chúng.

### 5.5 `POST /api/v1/buyer/catalog/products/{id}/reviews` — Buyer đánh giá sản phẩm (FR-41, FR-42)

- **Quyền:** 🛒 `hasRole('BUYER')`
- **Path param:** `id` = `productId`
- **Request:**
  ```json
  { "score": 5, "comment": "Hàng tốt, giao nhanh", "orderId": "..." }
  ```
  | Field | Bắt buộc | Ràng buộc |
  |---|---|---|
  | `score` | ✅ | **1..5** |
  | `comment` | ❌ | ≤ 2000 ký tự |
  | `orderId` | ❌ | Đơn hàng làm căn cứ đánh giá (FR-42) — có thể bỏ trống |

- **Response `201 Created`** — `ReviewResponse` (đánh giá mới **luôn** ở `status = VISIBLE`)
- **Lỗi:** `400` (score ngoài 1..5), `404` (sản phẩm không tồn tại / đã xoá mềm),
  `409 CONFLICT` (đã đánh giá sản phẩm này cho **cùng `orderId`**)
- **Ghi chú quan trọng:**
  - `buyerId` **không có trong request** — lấy từ token.
  - Chống trùng **chỉ áp dụng khi `orderId` có giá trị**. Nếu client bỏ trống `orderId`, Buyer có thể
    gửi nhiều đánh giá cho cùng một sản phẩm (không bị chặn).
  - **⚠️ TODO:** FR-42 yêu cầu chỉ được đánh giá khi **đơn hàng đã `COMPLETED`** — điều kiện này
    **chưa được kiểm tra** (cần gọi sang `nexus-commerce`). Hiện tại đánh giá được tạo bất kể trạng thái đơn.
    Điều này **khác** với đánh giá Seller (#7.12) — endpoint đó **đã** enforce `COMPLETED`.

### 5.6 `POST /api/v1/seller/catalog/products` — Tạo sản phẩm (FR-05)

- **Quyền:** 🏪 `hasRole('SELLER')`
- **Request:**
  ```json
  {
    "name": "iPhone 15 Pro 256GB",
    "description": "Máy mới nguyên seal",
    "basePrice": 28990000.00,
    "categoryId": "b1e2...",
    "images": [
      { "imageUrl": "https://.../1.jpg", "primary": true },
      { "imageUrl": "https://.../2.jpg", "primary": false }
    ]
  }
  ```
  | Field | Bắt buộc | Ràng buộc |
  |---|---|---|
  | `name` | ✅ | ≤ 200 ký tự |
  | `description` | ❌ | ≤ 5000 ký tự |
  | `basePrice` | ✅ | **> 0**, tối đa 17 chữ số nguyên + 2 thập phân |
  | `categoryId` | ✅ | UUID danh mục có thật |
  | `images` | ✅ | Tối đa **10** ảnh; `imageUrl` ≤ 500 ký tự |

  `primary`: `true` = ảnh chính. Nếu không ảnh nào đánh dấu, **ảnh đầu tiên** thành ảnh chính.
  Nếu nhiều ảnh cùng `true`, chỉ ảnh đầu tiên được giữ.
- **Response `201 Created`** — `ProductResponse`
- **Lỗi:** `400`, `404` (categoryId không tồn tại)
- **Ghi chú:** `sellerId` **không có trong request** — lấy từ token. Trạng thái khởi tạo là
  **`ACTIVE`** — sản phẩm **hiển thị công khai ngay** sau khi tạo (Admin có thể hạ xuống `DRAFT`/`INACTIVE`
  qua #29 nếu cần).
- **⚠️ Chưa hoàn thiện:** FR-05 yêu cầu tạo Product **kèm SKU + tồn kho ban đầu**, hiện là 2 lời gọi
  rời (`POST /seller/catalog/products` rồi `POST /seller/fulfillment/skus`), chưa nối thành 1 transaction.
  Xem [Phụ lục C](#phụ-lục-c--endpoint-hạ-tầng--điểm-chưa-hoàn-thiện).

### 5.7 `PUT /api/v1/seller/catalog/products/{id}` — Cập nhật sản phẩm (FR-07)

- **Quyền:** 🏪 — và **phải là chủ sở hữu** sản phẩm, nếu không → `403`
- **Request** — `PUT` nên là **thay thế toàn bộ**:
  ```json
  {
    "name": "iPhone 15 Pro 256GB (giá mới)",
    "description": "...",
    "basePrice": 27990000.00,
    "images": [ { "imageUrl": "https://.../new.jpg", "primary": true } ]
  }
  ```
  Ràng buộc giống tạo mới. **Không có `categoryId`** — đổi danh mục dùng endpoint #21 riêng.
  Mảng `images` rỗng `[]` = **xoá hết ảnh** của sản phẩm.
- **Response `200`** — `ProductResponse`
- **Lỗi:** `403 FORBIDDEN` (không phải chủ), `404`
- **Ghi chú:** không đổi được `status` qua đây — đó là quyền của Admin (#29).

### 5.8 `DELETE /api/v1/seller/catalog/products/{id}` — Xoá mềm (FR-08)

- **Quyền:** 🏪 — phải là chủ sở hữu
- **Response:** `204 No Content`
- **Lỗi:** `403`, `404`
- **Ghi chú:** **xoá mềm** (đặt `deleted_at`), không xoá khỏi DB → đơn hàng cũ vẫn tham chiếu được.
  Sản phẩm sau đó không còn xuất hiện ở bất kỳ API danh sách nào.

### 5.9 `PATCH /api/v1/seller/catalog/products/{id}/category` — Gán/đổi danh mục (FR-10)

- **Quyền:** 🏪 — phải là chủ sở hữu
- **Request:** `{ "categoryId": "b1e2..." }` (`@NotNull`)
- **Response `200`** — `ProductResponse`
- **Lỗi:** `403`, `404` (sản phẩm hoặc danh mục không tồn tại)
- **Ghi chú:** tách riêng khỏi `PUT` để đổi danh mục không bắt client gửi lại toàn bộ sản phẩm.

### 5.10 `POST /api/v1/seller/catalog/products/{id}/images/upload` — Upload ảnh (FR-05, FR-07)

- **Quyền:** 🏪 — service **kiểm tra quyền sở hữu sản phẩm trước khi nhận file**
- **Content-Type:** `multipart/form-data` (**bắt buộc** — endpoint `consumes` đúng loại này)
- **Request:** field `file` chứa file ảnh
- **Response `200`** — `ImageUploadResponse`:
  ```json
  { "publicUrl": "https://<project>.supabase.co/storage/v1/object/public/product-images/..." }
  ```
- **Lỗi:** `400` (sai loại file / quá dung lượng), `403`, `404`
- **Giới hạn:**
  - Dung lượng tối đa **5MB** (cấu hình `spring.servlet.multipart.max-file-size`)
  - Loại cho phép: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- **Lưu ý:** endpoint này **chỉ upload và trả URL** — không tự gắn ảnh vào sản phẩm.
  Luồng đúng: upload → lấy `publicUrl` → gửi vào `images[]` của request tạo/sửa sản phẩm.

### 5.11 `GET /api/v1/admin/catalog/categories` — Danh sách danh mục (FR-09, FR-54)

- **Quyền:** 👑
- **Query params:** `status` (`ACTIVE` \| `INACTIVE`, tuỳ chọn), `page`, `size`, `sort`
- **Response `200`** — `PageResponse<CategoryResponse>` (**dạng phẳng** — `children` luôn rỗng,
  khác với #15 trả dạng cây)
- **Ghi chú:** Admin thấy **cả** danh mục `INACTIVE`, khác endpoint công khai chỉ trả `ACTIVE`.

### 5.12 `GET /api/v1/admin/catalog/categories/{id}` — Chi tiết danh mục (FR-09, FR-54)

- **Quyền:** 👑
- **Response `200`** — `CategoryResponse`
- **Lỗi:** `404`

### 5.13 `POST /api/v1/admin/catalog/categories` — Tạo danh mục (FR-09, FR-54)

- **Quyền:** 👑
- **Request:**
  ```json
  {
    "name": "Điện thoại",
    "description": "Điện thoại di động các loại",
    "parentId": "b1e2...",
    "sortOrder": 1,
    "status": "ACTIVE"
  }
  ```
  | Field | Bắt buộc | Ràng buộc |
  |---|---|---|
  | `name` | ✅ | ≤ 150 ký tự |
  | `description` | ❌ | ≤ 1000 ký tự |
  | `parentId` | ❌ | Bỏ trống = **danh mục gốc** |
  | `sortOrder` | ❌ | `>= 0` |
  | `status` | ❌ | Bỏ trống ⇒ **`ACTIVE`** |

- **Response `201 Created`** — `CategoryResponse`
- **Lỗi:** `400`, `404` (parentId không tồn tại)

### 5.14 `PUT /api/v1/admin/catalog/categories/{id}` — Cập nhật danh mục (FR-09, FR-54)

- **Quyền:** 👑
- **Request:** thay thế toàn bộ (`name`, `description`, `parentId`, `sortOrder`, `status`)
  - `status` **bắt buộc** (`@NotNull`) ở endpoint này (khác lúc tạo)
  - `parentId: null` = đưa danh mục về **cấp gốc**
- **Response `200`** — `CategoryResponse`
- **Lỗi:** `400`, `404`, `422` nếu đặt **chính nó** làm danh mục cha (hoặc tạo vòng lặp cha–con)

### 5.15 `DELETE /api/v1/admin/catalog/categories/{id}` — Ngừng hoạt động danh mục (FR-09, FR-54)

- **Quyền:** 👑
- **Response:** `204 No Content`
- **Lỗi:** `404`, `422` khi danh mục **còn sản phẩm đang hoạt động**
- **Ghi chú:** không hard delete — chuyển `status = INACTIVE`. Sản phẩm cũ vẫn giữ tham chiếu.

### 5.16 `GET /api/v1/admin/catalog/products` — Danh sách sản phẩm cho quản trị (FR-53)

- **Quyền:** 👑
- **Query params:**

  | Tham số | Ý nghĩa |
  |---|---|
  | `keyword` | Tìm theo tên |
  | `categoryId` | Lọc theo danh mục |
  | `status` | `DRAFT` \| `ACTIVE` \| `INACTIVE` |
  | `includeDeleted` | Mặc định `false` (bỏ qua sản phẩm xoá mềm); đặt `true` để xem **tất cả** |
  | `page`, `size`, `sort` | Phân trang |

- **Response `200`** — `PageResponse<ProductSummaryResponse>`
- **Ghi chú:** đây là endpoint **duy nhất** có thể thấy sản phẩm đã xoá mềm.

### 5.17 `PATCH /api/v1/admin/catalog/products/{id}/status` — Đổi trạng thái sản phẩm (FR-53)

- **Quyền:** 👑
- **Request:** `{ "status": "INACTIVE" }` — `DRAFT` \| `ACTIVE` \| `INACTIVE` (`@NotNull`)
- **Response `200`** — `ProductResponse`
- **Lỗi:** `404`
- **Dùng để:** ẩn tạm sản phẩm vi phạm (về `DRAFT`), hoặc ngừng kinh doanh (về `INACTIVE`).

### 5.18 `DELETE /api/v1/admin/catalog/products/{id}` — Admin xoá mềm sản phẩm (FR-08)

- **Quyền:** 👑
- **Response:** `204 No Content`
- **Ghi chú:** giống hành vi của #20 nhưng **không kiểm tra chủ sở hữu** (Admin xoá được mọi sản phẩm).
- **⚠️ Chưa hoàn thiện:** README ghi rõ cần chặn xoá sản phẩm đang có **auction** hoặc **đơn hàng đang hoạt động** —
  logic này chưa được nối.

### 5.19 `GET /api/v1/admin/catalog/reviews` — Danh sách đánh giá để kiểm duyệt (FR-45)

- **Quyền:** 👑
- **Query params:** `status` (`VISIBLE` \| `HIDDEN`), `productId`, `page`, `size`, `sort`
- **Response `200`** — `PageResponse<ReviewResponse>`

### 5.20 `PATCH /api/v1/admin/catalog/reviews/{id}/status` — Duyệt/ẩn đánh giá (FR-59)

- **Quyền:** 👑
- **Request:** `{ "status": "HIDDEN" }` — `VISIBLE` (hiển thị) \| `HIDDEN` (ẩn)
- **Response `200`** — `ReviewResponse`
- **Ghi chú:** `HIDDEN` không xoá đánh giá, chỉ khiến nó biến mất khỏi API công khai (#16).
  Admin có thể bật lại `VISIBLE` bất cứ lúc nào.

> **Lưu ý:** module Catalog chỉ có **21 endpoint** — không có endpoint xoá cứng và không có endpoint
> upload ảnh cho Admin (Admin sửa ảnh qua chính sản phẩm nếu cần, bằng dữ liệu URL có sẵn).

---

## 6. Module Fulfillment

**Controller:** `FulfillmentBuyerController`, `FulfillmentSellerController`, `FulfillmentAdminController`
**Schema:** `nexus_fulfillment` — bảng `skus`, `inventories`, `warehouses`, `shipments`

### 6.1 `GET /api/v1/buyer/fulfillment/shipments` — Theo dõi vận đơn (FR-40)

- **Quyền:** 🛒 `hasRole('BUYER')`
- **Query param:** `orderId` (**bắt buộc**, UUID)
- **Response `200`** — **mảng** `ShipmentResponse` (không phân trang, mới nhất trước):
  ```json
  [
    {
      "id": "...", "orderId": "...", "sellerId": "...",
      "warehouseId": "...", "trackingNumber": "GHN123456",
      "status": "SHIPPED",
      "createdAt": "...", "updatedAt": "..."
    }
  ]
  ```
- **Lỗi:** `403` (đơn thuộc Buyer khác), `404` (không tìm thấy đơn)
- **Ghi chú:** Buyer **chỉ** tra được vận đơn của đơn hàng thuộc tài khoản mình — kiểm tra ở tầng service.

### 6.2 `POST /api/v1/seller/fulfillment/skus` — Tạo SKU + tồn kho ban đầu (FR-05)

- **Quyền:** 🏪 `hasRole('SELLER')`
- **Request:**
  ```json
  {
    "productId": "...",
    "name": "iPhone 15 Pro 256GB Đen",
    "price": 28990000.00,
    "initialTotalQuantity": 100,
    "initialAvailableQuantity": 100
  }
  ```
  | Field | Bắt buộc | Ràng buộc |
  |---|---|---|
  | `productId` | ✅ | Sản phẩm đã tồn tại (thuộc Seller) |
  | `name` | ❌ | ≤ 200 ký tự |
  | `price` | ❌ | `>= 0` |
  | `initialTotalQuantity` | ❌ | `>= 0`, bỏ trống = 0 |
  | `initialAvailableQuantity` | ❌ | `>= 0`, bỏ trống = 0 |

- Mã `skuCode` không nhận từ client; hệ thống cấp tuần tự theo dạng `ORD-001`, `ORD-002`, ...
- **Response `201 Created`** — `SkuResponse`:
  ```json
  {
    "id": "...", "productId": "...", "sellerId": "...",
    "skuCode": "ORD-001", "name": "...", "price": 28990000.00,
    "createdAt": "...", "updatedAt": "..."
  }
  ```
- **Lỗi:** `400` nếu dữ liệu không hợp lệ (ví dụ tồn khả dụng lớn hơn tồn tổng)
- **Ghi chú:** endpoint này **đồng thời tạo bản ghi tồn kho** ở kho `ACTIVE` đầu tiên — nên Seller
  không cần gọi thêm API nào để có tồn kho ban đầu.
- **⚠️ Chưa hoàn thiện:** luồng "tạo Product kèm SKU trong **một** transaction" (FR-05) chưa nối;
  hiện client phải gọi 2 API liên tiếp và tự xử lý nếu API thứ 2 thất bại.

### 6.3 `GET /api/v1/seller/fulfillment/skus` — Danh sách SKU của tôi

- **Quyền:** 🏪
- **Query params:** `page`, `size`, `sort`
- **Response `200`** — `PageResponse<SkuResponse>`
- **Ghi chú:** chỉ trả SKU của Seller đang đăng nhập.

### 6.4 `GET /api/v1/seller/fulfillment/inventories` — Tồn kho của tôi (FR-13)

- **Quyền:** 🏪
- **Query params (tất cả tuỳ chọn):**

  | Tham số | Ý nghĩa |
  |---|---|
  | `skuId` | Lọc theo SKU |
  | `productId` | Lọc theo sản phẩm |
  | `warehouseId` | Lọc theo kho |
  | `status` | `IN_STOCK` \| `LOW_STOCK` \| `OUT_OF_STOCK` |
  | `keyword` | Tìm theo **`skuCode`** |
  | `page`, `size`, `sort` | Phân trang |

- **Response `200`** — `PageResponse<InventoryResponse>`:
  ```json
  {
    "content": [
      {
        "id": "...", "skuId": "...", "productId": "...",
        "skuCode": "IP15P-256-BLK", "skuName": "iPhone 15 Pro 256GB Đen",
        "warehouseId": "...",
        "totalQuantity": 100, "availableQuantity": 97,
        "status": "IN_STOCK",
        "createdAt": "...", "updatedAt": "..."
      }
    ],
    "page": 0, "size": 20, "totalElements": 3, "totalPages": 1,
    "first": true, "last": true
  }
  ```
- **Ghi chú:** chỉ trả tồn kho thuộc SKU của **Seller đang đăng nhập** (lọc bằng `sellerId` từ token).
  `productId`/`skuCode`/`skuName` được lấy từ bảng `skus` cùng module để client không phải gọi thêm API catalog.

### 6.5 `GET /api/v1/seller/fulfillment/inventories/{id}` — Chi tiết tồn kho (FR-13)

- **Quyền:** 🏪 (phải là chủ)
- **Response `200`** — `InventoryResponse`
- **Lỗi:** `403` (SKU của Seller khác), `404`

### 6.6 `PATCH /api/v1/seller/fulfillment/inventories/{id}` — Cập nhật tồn kho (FR-14)

- **Quyền:** 🏪 (phải là chủ)
- **Request:**
  ```json
  { "operation": "DECREASE", "quantity": 3 }
  ```
  | Field | Bắt buộc | Ý nghĩa |
  |---|---|---|
  | `operation` | ✅ | `INCREASE` \| `DECREASE` \| `SET_AVAILABLE` |
  | `quantity` | ✅ | `>= 0` |

  Tác dụng của từng `operation`:

  | Operation | `availableQuantity` | `totalQuantity` |
  |---|---|---|
  | `INCREASE` | `+ quantity` | `+ quantity` |
  | `DECREASE` | `- quantity` | `max(0, total - quantity)` |
  | `SET_AVAILABLE` | `= quantity` | `max(total, quantity)` — nâng lên nếu cần cho khớp |

- **Response `200`** — `InventoryResponse` sau khi cập nhật
- **Lỗi:** `422` — kết quả sẽ **âm** (ví dụ `DECREASE` nhiều hơn tồn hiện có), `403`, `404`
- **Ghi chú:** `status` **tự tính lại** sau mỗi lần cập nhật, client không set được:
  - `availableQuantity == 0` → `OUT_OF_STOCK`
  - `0 < availableQuantity <= 5` → `LOW_STOCK`
  - còn lại → `IN_STOCK`

### 6.7 `POST /api/v1/seller/fulfillment/shipments` — Tạo vận đơn (FR-38)

- **Quyền:** 🏪
- **Request:**
  ```json
  {
    "orderId": "...",
    "warehouseId": "...",
    "trackingNumber": "GHN123456"
  }
  ```
  | Field | Bắt buộc | Ràng buộc |
  |---|---|---|
  | `orderId` | ✅ | UUID đơn hàng |
  | `warehouseId` | ❌ | Bỏ trống = vận đơn chưa gắn kho xuất |
  | `trackingNumber` | ❌ | ≤ 100 ký tự |

- **Response `201 Created`** — `ShipmentResponse`, **`status` khởi tạo luôn là `PENDING`**
- **Lỗi:** `400`, `404`
- **⚠️ Chưa hoàn thiện:** điều kiện "Order đã thanh toán thành công" và "Seller phải sở hữu Order"
  **chưa được kiểm tra** — cần nối với `nexus-commerce` (xem [Phụ lục C](#phụ-lục-c--endpoint-hạ-tầng--điểm-chưa-hoàn-thiện)).

### 6.8 `PATCH /api/v1/seller/fulfillment/shipments/{id}/status` — Cập nhật trạng thái vận đơn (FR-39)

- **Quyền:** 🏪 (phải là chủ)
- **Request:** `{ "status": "SHIPPED" }`
- **Chuỗi trạng thái hợp lệ:** `PENDING → SHIPPED → DELIVERED` (chỉ tiến, không lùi, không nhảy cóc)
- **Response `200`** — `ShipmentResponse`
- **Lỗi:** `422` — nhảy cóc hoặc lùi trạng thái, `403`, `404`

### 6.9 `GET /api/v1/admin/fulfillment/inventories` — Giám sát tồn kho toàn hệ thống (FR-55)

- **Quyền:** 👑
- **Query params:** giống #36 (`skuId`, `productId`, `warehouseId`, `status`, `keyword`, phân trang)
- **Response `200`** — `PageResponse<InventoryResponse>`
- **Ghi chú:** **không** giới hạn theo Seller — thấy tồn kho của **toàn bộ** hệ thống (service truyền `sellerId = null`).

### 6.10 `GET /api/v1/admin/fulfillment/warehouses` — Danh sách kho (FR-55)

- **Quyền:** 👑
- **Query params:** `status` (`ACTIVE` \| `INACTIVE`), `page`, `size`, `sort`
- **Response `200`** — `PageResponse<WarehouseResponse>`:
  ```json
  {
    "content": [
      { "id": "...", "code": "WH-HCM", "name": "Kho TP.HCM",
        "address": "...", "status": "ACTIVE",
        "createdAt": "...", "updatedAt": "..." }
    ],
    "page": 0, "size": 20, "totalElements": 1, "totalPages": 1,
    "first": true, "last": true
  }
  ```

### 6.11 `GET /api/v1/admin/fulfillment/warehouses/{id}` — Chi tiết kho (FR-55)

- **Quyền:** 👑
- **Response `200`** — `WarehouseResponse`
- **Lỗi:** `404`

### 6.12 `POST /api/v1/admin/fulfillment/warehouses` — Tạo kho (FR-55)

- **Quyền:** 👑
- **Request:**
  ```json
  { "code": "WH-HN", "name": "Kho Hà Nội", "address": "..." }
  ```
  | Field | Bắt buộc | Ràng buộc |
  |---|---|---|
  | `code` | ✅ | ≤ 50 ký tự, **duy nhất** |
  | `name` | ✅ | ≤ 150 ký tự |
  | `address` | ❌ | ≤ 500 ký tự |

- **Response `201 Created`** — `WarehouseResponse`, **`status` luôn là `ACTIVE`** (service tự set)
- **Lỗi:** `409` (mã kho trùng)

### 6.13 `PUT /api/v1/admin/fulfillment/warehouses/{id}` — Cập nhật/ngừng kho (FR-55)

- **Quyền:** 👑
- **Request:**
  ```json
  { "name": "Kho Hà Nội (cũ)", "address": "...", "status": "INACTIVE" }
  ```
  `status` **bắt buộc** (`@NotNull`). **`code` không đổi được** qua endpoint này.
- **Response `200`** — `WarehouseResponse`
- **Ghi chú:** "xoá" kho = gửi `status = INACTIVE` — **không hard delete**, vì tồn kho và vận đơn cũ
  còn tham chiếu tới kho.

---

## 7. Module Commerce

**Controller:** `CommerceBuyerController`, `CommerceSellerController`, `CommerceAdminController`
**Schema:** `nexus_commerce` — bảng `carts`, `cart_items`, `orders`, `order_items`, `payments`,
`seller_ratings`, `campaigns`, `discount_codes`

Đây là module **nhiều endpoint nhất (28)** và cũng là module có logic trạng thái phức tạp nhất.

### 7.1 `GET /api/v1/buyer/commerce/cart` — Xem giỏ hàng (FR-15)

- **Quyền:** 🛒 `hasRole('BUYER')` ở cấp class
- **Mô tả:** trả giỏ `ACTIVE` của Buyer. **Nếu chưa có giỏ, hệ thống tự tạo mới** — nên endpoint này
  không bao giờ trả `404`.
- **Response `200`** — `CartResponse`:
  ```json
  {
    "id": "...", "buyerId": "...", "status": "ACTIVE",
    "subtotal": 58980000.00, "itemCount": 2,
    "items": [
      {
        "id": "...", "productId": "...", "skuId": "...", "sellerId": "...",
        "quantity": 2, "unitPrice": 28990000.00, "lineTotal": 57980000.00
      }
    ],
    "createdAt": "...", "updatedAt": "..."
  }
  ```
  `lineTotal` = `unitPrice * quantity`, **tính sẵn ở server** để client không phải nhân.
  `subtotal` = tổng `lineTotal` của mọi dòng.

### 7.2 `POST /api/v1/buyer/commerce/cart/items` — Thêm vào giỏ (FR-16)

- **Quyền:** 🛒
- **Request:**
  ```json
  {
    "productId": "...",
    "skuId": "...",
    "sellerId": "...",
    "productName": "iPhone 15 Pro 256GB",
    "quantity": 2,
    "unitPrice": 28990000.00
  }
  ```
  | Field | Bắt buộc | Ràng buộc |
  |---|---|---|
  | `productId` | ✅ | UUID |
  | `skuId` | ❌ | Bỏ trống nếu sản phẩm chưa phân loại |
  | `sellerId` | ✅ | UUID |
  | `productName` | ❌ | ≤ 255 ký tự |
  | `quantity` | ✅ | `>= 1` |
  | `unitPrice` | ✅ | `> 0` |

- **Response `201 Created`** — `CartResponse` (**giỏ sau khi cập nhật**, không phải riêng dòng vừa thêm)
- **Lỗi:** `422` (số lượng/đơn giá không hợp lệ)
- **Quy tắc gộp dòng:** thêm **trùng `productId` + `skuId`** → **cộng dồn số lượng** vào dòng đã có,
  không tạo dòng mới.
- **⚠️ TODO nghiệp vụ (quan trọng):** đơn giá và tên sản phẩm hiện **nhận từ request** thay vì lấy từ
  Catalog, và **tồn kho chưa được kiểm tra**. Đã đánh dấu `TODO (business logic)` trong code.

### 7.3 `PUT /api/v1/buyer/commerce/cart/items/{itemId}` — Đổi số lượng dòng hàng (FR-17)

- **Quyền:** 🛒 (dòng hàng phải thuộc giỏ của mình)
- **Path param:** `itemId` (UUID) — **không phải `productId`**
- **Request:** `{ "quantity": 5 }` (`>= 1`) — gửi **số lượng tuyệt đối**, không phải số chênh lệch
- **Response `200`** — `CartResponse` (server tính lại `lineTotal` và `subtotal`)
- **Lỗi:** `403`, `404`, `400`

### 7.4 `DELETE /api/v1/buyer/commerce/cart/items/{itemId}` — Xoá dòng hàng (FR-18)

- **Quyền:** 🛒 (phải là chủ giỏ)
- **Response:** `204 No Content`
- **Lỗi:** `403`, `404`

### 7.5 `POST /api/v1/buyer/commerce/checkout` — Đặt hàng (FR-19, FR-22)

- **Quyền:** 🛒
- **Mô tả:** biến giỏ `ACTIVE` thành `Order` + các `OrderItem`, giỏ chuyển sang `CONVERTED`.
- **Request:**
  ```json
  {
    "receiverName": "Nguyễn Văn An",
    "receiverPhone": "0912345678",
    "shippingAddress": "123 Lê Lợi, Q.1, TP.HCM",
    "paymentMethod": "COD",
    "discountCode": "SALE10"
  }
  ```
  | Field | Bắt buộc | Ràng buộc |
  |---|---|---|
  | `receiverName` | ✅ | ≤ 150 ký tự |
  | `receiverPhone` | ✅ | pattern `^[0-9+][0-9\-\s]{7,19}$` |
  | `shippingAddress` | ✅ | ≤ 500 ký tự |
  | `paymentMethod` | ✅ | `COD` \| `BANK_TRANSFER` \| `E_WALLET` \| `MOCK` |
  | `discountCode` | ❌ | ≤ 50 ký tự, ví dụ `SALE10` |

- **Response `201 Created`** — `OrderResponse`:
  ```json
  {
    "id": "...", "orderNumber": "ORD-20250614-A1B2C3",
    "buyerId": "...", "sellerId": "...", "orderType": "DIRECT",
    "status": "PENDING",
    "subtotal": 58980000.00, "discount": 5898000.00,
    "shippingFee": 0.00, "totalAmount": 53082000.00,
    "shippingAddress": "...", "receiverName": "...", "receiverPhone": "...",
    "discountCode": "SALE10",
    "items": [
      {
        "id": "...", "productId": "...", "skuId": "...", "sellerId": "...",
        "productNameSnapshot": "iPhone 15 Pro 256GB",
        "skuCodeSnapshot": "IP15P-256-BLK",
        "quantity": 2, "unitPrice": 28990000.00, "subtotal": 57980000.00
      }
    ],
    "createdAt": "...", "updatedAt": "..."
  }
  ```
  `orderNumber` dạng `ORD-yyyyMMdd-XXXXXX`. Đơn mới **luôn bắt đầu ở `status = PENDING`**.
  `OrderItem` lưu **snapshot** tên/giá/mã SKU tại thời điểm đặt — để đơn cũ không đổi khi Seller sửa sản phẩm.
- **Lỗi:** `422` — **giỏ trống**, **giỏ có nhiều Seller** (giới hạn MVP), **mã giảm giá không hợp lệ**
- **Ghi chú quan trọng:**
  - **Giới hạn MVP: mỗi đơn chỉ chứa sản phẩm của MỘT Seller.** Giỏ có hàng của 2 Seller trở lên
    → `422`, buộc Buyer tách đơn.
  - Mã giảm giá được **kiểm tra lại trên dữ liệu DB** và số tiền giảm **tính lại ở server** —
    không tin số tiền client gửi lên.

### 7.6 `POST /api/v1/buyer/commerce/checkout/apply-discount` — Xem trước số tiền giảm (FR-20, FR-48)

- **Quyền:** 🛒
- **Request:**
  ```json
  { "code": "SALE10", "orderAmount": 58980000.00, "orderType": "DIRECT" }
  ```
  | Field | Bắt buộc | Ràng buộc |
  |---|---|---|
  | `code` | ✅ | ≤ 50 ký tự |
  | `orderAmount` | ✅ | `>= 0` |
  | `orderType` | ❌ | `DIRECT` \| `AUCTION`; bỏ trống ⇒ `DIRECT` |

- **Response `200`** — `ApplyDiscountResponse`:
  ```json
  {
    "code": "SALE10", "discountType": "PERCENTAGE",
    "orderAmount": 58980000.00,
    "discountAmount": 5898000.00,
    "finalAmount": 53082000.00
  }
  ```
- **Ghi chú cực kỳ quan trọng:** endpoint này **KHÔNG tiêu thụ lượt dùng** của mã.
  `usedCount` **chỉ tăng khi checkout thành công** (#7.5). Nhờ vậy Buyer có thể thử mã bao nhiêu lần tuỳ ý.
- **Quy tắc tính:**
  - `PERCENTAGE`: `giảm = amount * discountValue / 100`, ràng buộc `0 < discountValue <= 100`
  - `FIXED_AMOUNT`: giảm thẳng `discountValue`, nhưng **không vượt quá** `orderAmount`
  - `finalAmount = orderAmount - discountAmount`, làm tròn **HALF_UP**, **không âm**
  - Nếu `orderType = AUCTION` → mã giảm giá **không được áp dụng** (đơn đấu giá dùng giá thắng cuộc)
- **Lỗi:** `422` — mã không tồn tại / `INACTIVE` / hết hạn / hết lượt / chưa đạt `minOrderAmount`

### 7.7 `GET /api/v1/buyer/commerce/orders` — Đơn của tôi (FR-23)

- **Quyền:** 🛒
- **Query params:** `status` (`PENDING` \| `CONFIRMED` \| `SHIPPING` \| `COMPLETED` \| `CANCELLED`), `page`, `size`, `sort`
- **Response `200`** — `PageResponse<OrderSummaryResponse>`:
  ```json
  {
    "content": [
      {
        "id": "...", "orderNumber": "ORD-20250614-A1B2C3",
        "buyerId": "...", "sellerId": "...", "orderType": "DIRECT",
        "status": "PENDING", "totalAmount": 53082000.00, "itemCount": 1,
        "createdAt": "..."
      }
    ],
    "page": 0, "size": 20, "totalElements": 3, "totalPages": 1,
    "first": true, "last": true
  }
  ```
  Bản `Summary` **không kèm danh sách dòng hàng** (tránh N+1, payload nhỏ); muốn xem dòng hàng gọi #7.8.
- **Ghi chú:** luôn lọc theo `buyerId` từ token.

### 7.8 `GET /api/v1/buyer/commerce/orders/{id}` — Chi tiết đơn của tôi (FR-23)

- **Quyền:** 🛒 (phải là chủ đơn)
- **Response `200`** — `OrderResponse` (đầy đủ, có `items`)
- **Lỗi:** `403 FORBIDDEN` (đơn thuộc Buyer khác), `404`

### 7.9 `POST /api/v1/buyer/commerce/orders/{id}/cancel` — Buyer huỷ đơn (FR-25)

- **Quyền:** 🛒 (phải là chủ đơn)
- **Request:** không có body
- **Response `200`** — `OrderResponse` với `status = "CANCELLED"`
- **Lỗi:** `422` — đơn **đã ở trạng thái kết thúc** (`COMPLETED` hoặc `CANCELLED`), `403`, `404`
- **⚠️ TODO nghiệp vụ:** huỷ đơn **phải trả lại tồn kho** (gọi sang Fulfillment) — chưa nối.

### 7.10 `POST /api/v1/buyer/commerce/orders/{id}/payments` — Tạo giao dịch thanh toán (FR-21)

- **Quyền:** 🛒 (phải là chủ đơn)
- **Request:**
  ```json
  {
    "paymentMethod": "MOCK",
    "amount": 53082000.00,
    "idempotencyKey": "2f9c1a7e-4b3d-4e8f-9a1b-7c6d5e4f3a2b"
  }
  ```
  | Field | Bắt buộc | Ràng buộc |
  |---|---|---|
  | `paymentMethod` | ✅ | `COD` \| `BANK_TRANSFER` \| `E_WALLET` \| `MOCK` |
  | `amount` | ✅ | `> 0` |
  | `idempotencyKey` | ✅ | ≤ 255 ký tự, **client tự sinh** (UUID) |

- **Response `201 Created`** — `PaymentResponse`:
  ```json
  {
    "id": "...", "orderId": "...",
    "paymentMethod": "MOCK", "paymentReference": "...",
    "amount": 53082000.00, "status": "PENDING",
    "idempotencyKey": "2f9c1a7e-...",
    "paidAt": null, "createdAt": "..."
  }
  ```
- **Lỗi:** `422` — đơn **đã huỷ** hoặc **đã có giao dịch thành công**, `403`, `404`
- **Idempotency (quan trọng):** gửi lại **cùng `idempotencyKey`** ⇒ server trả về **giao dịch đã tạo
  trước đó**, **không** tạo bản ghi mới và **không** trừ tiền lần hai. Client có thể retry an toàn
  khi mạng lỗi.

### 7.11 `POST /api/v1/buyer/commerce/payments/{id}/confirm` — Xác nhận kết quả giao dịch (FR-21)

- **Quyền:** 🛒 (giao dịch thuộc đơn của mình)
- **Path param:** `id` = `paymentId` (**không phải `orderId`**)
- **Request:** `{ "result": "SUCCESS" }` — chỉ nhận `SUCCESS` hoặc `FAILED` (không phân biệt hoa/thường)
- **Response `200`** — `PaymentResponse`
- **Tác dụng phụ:** khi `result = SUCCESS` → **đơn hàng chuyển sang `CONFIRMED`** (và `paidAt` được ghi)
- **Lỗi:** `422` — `result` không phải `SUCCESS`/`FAILED`, hoặc giao dịch không hợp lệ
- **Ghi chú:** trạng thái `PENDING` **không thể** set từ API — đó là trạng thái mặc định lúc tạo.
  Endpoint này mô phỏng webhook của cổng thanh toán.

### 7.12 `POST /api/v1/buyer/commerce/seller-ratings` — Đánh giá Seller (FR-43, FR-44)

- **Quyền:** 🛒
- **Request:**
  ```json
  {
    "orderId": "...",
    "sellerId": "...",
    "score": 5,
    "comment": "Đóng gói cẩn thận, giao nhanh"
  }
  ```
  | Field | Bắt buộc | Ràng buộc |
  |---|---|---|
  | `orderId` | ✅ | UUID đơn hàng |
  | `sellerId` | ✅ | UUID Seller cần đánh giá |
  | `score` | ✅ | **1..5** |
  | `comment` | ❌ | ≤ 2000 ký tự |

- **Response `201 Created`** — `SellerRatingResponse`
- **Lỗi:**
  - `409 CONFLICT` — đã đánh giá Seller này cho đơn hàng này rồi
  - `422` — đơn **chưa `COMPLETED`**, hoặc đơn không thuộc Buyer này
- **Ghi chú:** **chỉ đánh giá được sau khi đơn ở trạng thái `COMPLETED`** — điều kiện này **đã được
  enforce** ở đây (khác với đánh giá sản phẩm #5.5, nơi điều kiện `COMPLETED` còn là TODO).

### 7.13 `GET /api/v1/seller/commerce/orders` — Đơn đến của tôi (FR-23)

- **Quyền:** 🏪 `hasRole('SELLER')` ở cấp class
- **Query params:** `status`, `page`, `size`, `sort`
- **Response `200`** — `PageResponse<OrderSummaryResponse>`
- **Ghi chú:** lọc theo `sellerId` từ token — Seller **không thể** đọc đơn của Seller khác.

### 7.14 `GET /api/v1/seller/commerce/orders/{id}` — Chi tiết đơn của tôi (FR-23)

- **Quyền:** 🏪 (phải là chủ đơn)
- **Response `200`** — `OrderResponse`
- **Lỗi:** `403 FORBIDDEN` (đơn của Seller khác), `404`

### 7.15 `PATCH /api/v1/seller/commerce/orders/{id}/status` — Chuyển trạng thái đơn (FR-24)

- **Quyền:** 🏪 (phải là chủ đơn)
- **Request:** `{ "status": "CONFIRMED" }`
- **Chuỗi trạng thái hợp lệ:**
  ```
  PENDING → CONFIRMED → SHIPPING → COMPLETED
  ```
  Cộng thêm: **bất kỳ trạng thái chưa kết thúc** đều chuyển được sang `CANCELLED` ngay qua PATCH này
  (`canTransitionTo` cho phép `target == CANCELLED` khi `!isTerminal()`). Endpoint `POST .../cancel`
  (#7.16) là cách viết tường minh cho cùng kết quả.
- **Response `200`** — `OrderResponse`
- **Lỗi:** `422` — **nhảy cóc** (PENDING → SHIPPING), **lùi** (SHIPPING → CONFIRMED), target trùng
  trạng thái hiện tại, hoặc đơn đã ở trạng thái kết thúc; `403`, `404`
- **Ghi chú:** kiểm tra bằng `OrderStatus#canTransitionTo` — được enforce chặt ở tầng domain.
  **`OrderStatus` không có `PAID`** (khác nhiều thiết kế TMĐT khác) — trạng thái thanh toán thể hiện
  ở `Payment.status = SUCCESS`, không phải ở `order.status`.

### 7.16 `POST /api/v1/seller/commerce/orders/{id}/cancel` — Seller huỷ đơn (FR-25)

- **Quyền:** 🏪 (phải là chủ đơn)
- **Response `200`** — `OrderResponse` với `status = "CANCELLED"`
- **Lỗi:** `422` — đơn đã kết thúc; `403`, `404`

### 7.17 `GET /api/v1/admin/commerce/orders` — Mọi đơn hàng (FR-56)

- **Quyền:** 👑 `hasRole('ADMIN')` ở cấp class
- **Query params:** `buyerId`, `sellerId`, `status`, `page`, `size`, `sort`
- **Response `200`** — `PageResponse<OrderSummaryResponse>`
- **Ghi chú:** **duy nhất** endpoint đơn hàng không bị lọc theo danh tính người gọi — Admin thấy toàn bộ.

### 7.18 `GET /api/v1/admin/commerce/orders/{id}` — Chi tiết đơn bất kỳ (FR-56)

- **Quyền:** 👑
- **Response `200`** — `OrderResponse`
- **Lỗi:** `404`

### 7.19 `PATCH /api/v1/admin/commerce/orders/{id}/status` — Admin đổi trạng thái đơn (FR-56)

- **Quyền:** 👑
- **Request:** `{ "status": "COMPLETED" }`
- **Response `200`** — `OrderResponse`
- **Lỗi:** `422` — **vẫn phải tuân chuỗi trạng thái hợp lệ** (Admin không được nhảy cóc); `404`
- **Ghi chú thiết kế:** Admin có quyền rộng hơn Seller về **phạm vi** (mọi đơn) nhưng **không** rộng hơn
  về **luật chuyển trạng thái** — đây là chủ ý để bảo vệ tính toàn vẹn dữ liệu. Admin cũng `CANCELLED`
  được qua PATCH này (giống Seller), ngoài endpoint `POST .../cancel` riêng (#7.20).

### 7.20 `POST /api/v1/admin/commerce/orders/{id}/cancel` — Admin huỷ đơn (FR-25)

- **Quyền:** 👑
- **Response `200`** — `OrderResponse` với `status = "CANCELLED"`
- **Lỗi:** `422` — đơn đã kết thúc; `404`

### 7.21 `GET /api/v1/admin/commerce/campaigns` — Danh sách chiến dịch (FR-46)

- **Quyền:** 👑
- **Query params:** `status` (`DRAFT` \| `ACTIVE` \| `ENDED`), `page`, `size`, `sort`
- **Response `200`** — `PageResponse<CampaignResponse>`:
  ```json
  {
    "content": [
      { "id": "...", "name": "Sale hè 2025", "description": "...",
        "startDate": "2025-06-01", "endDate": "2025-06-30",
        "status": "ACTIVE", "createdAt": "...", "updatedAt": "..." }
    ],
    "page": 0, "size": 20, "totalElements": 1, "totalPages": 1,
    "first": true, "last": true
  }
  ```

### 7.22 `GET /api/v1/admin/commerce/campaigns/{id}` — Chi tiết chiến dịch (FR-46)

- **Quyền:** 👑
- **Response `200`** — `CampaignResponse`
- **Lỗi:** `404`

### 7.23 `POST /api/v1/admin/commerce/campaigns` — Tạo chiến dịch (FR-46)

- **Quyền:** 👑
- **Request:**
  ```json
  {
    "name": "Sale hè 2025",
    "description": "Giảm giá toàn sàn",
    "startDate": "2025-06-01",
    "endDate": "2025-06-30",
    "status": "ACTIVE"
  }
  ```
  | Field | Bắt buộc | Ràng buộc |
  |---|---|---|
  | `name` | ✅ | ≤ 200 ký tự, **duy nhất** |
  | `description` | ❌ | ≤ 2000 ký tự |
  | `startDate`, `endDate` | ❌ | `LocalDate` (`yyyy-MM-dd`) |
  | `status` | ❌ | Bỏ trống ⇒ **`DRAFT`** |

- **Response `201 Created`** — `CampaignResponse`
- **Lỗi:** `409` (tên chiến dịch đã tồn tại)

### 7.24 `PUT /api/v1/admin/commerce/campaigns/{id}` — Cập nhật chiến dịch (FR-46)

- **Quyền:** 👑
- **Request:** thay thế toàn bộ (`name`, `description`, `startDate`, `endDate`, `status`)
  - `status` bỏ trống ⇒ **giữ nguyên** trạng thái hiện tại
- **Response `200`** — `CampaignResponse`
- **Lỗi:** `404`, `409` (đổi sang tên đã tồn tại)

### 7.25 `DELETE /api/v1/admin/commerce/campaigns/{id}` — Kết thúc chiến dịch (FR-46, FR-58)

- **Quyền:** 👑
- **Response:** `204 No Content`
- **Ghi chú:** **không hard delete** — chuyển `status = ENDED`. Chiến dịch vẫn còn để tra cứu lịch sử
  và để các mã giảm giá cũ vẫn tham chiếu được.

### 7.26 `GET /api/v1/admin/commerce/discount-codes` — Danh sách mã giảm giá (FR-47)

- **Quyền:** 👑
- **Query params:** `status` (`ACTIVE` \| `INACTIVE`), `campaignId`, `page`, `size`, `sort`
- **Response `200`** — `PageResponse<DiscountCodeResponse>`:
  ```json
  {
    "content": [
      {
        "id": "...", "campaignId": "...", "code": "SALE10",
        "discountType": "PERCENTAGE", "discountValue": 10.00,
        "minOrderAmount": 1000000.00,
        "usageLimit": 100, "usedCount": 12,
        "startAt": "...", "endAt": "...", "status": "ACTIVE",
        "createdAt": "...", "updatedAt": "..."
      }
    ],
    "page": 0, "size": 20, "totalElements": 1, "totalPages": 1,
    "first": true, "last": true
  }
  ```
- **Ghi chú:** `usedCount` là **read-only** — chỉ service tăng khi checkout thành công, không sửa được qua API.

### 7.27 `GET /api/v1/admin/commerce/discount-codes/{id}` — Chi tiết mã giảm giá (FR-47)

- **Quyền:** 👑
- **Response `200`** — `DiscountCodeResponse`
- **Lỗi:** `404`

### 7.28 `POST /api/v1/admin/commerce/discount-codes` — Tạo mã giảm giá (FR-47)

- **Quyền:** 👑
- **Request:**
  ```json
  {
    "campaignId": "...",
    "code": "sale10",
    "discountType": "PERCENTAGE",
    "discountValue": 10,
    "minOrderAmount": 1000000,
    "usageLimit": 100,
    "startAt": "2025-06-01T00:00:00Z",
    "endAt": "2025-06-30T23:59:59Z",
    "status": "ACTIVE"
  }
  ```
  | Field | Bắt buộc | Ràng buộc |
  |---|---|---|
  | `campaignId` | ❌ | Chiến dịch chứa mã |
  | `code` | ✅ | ≤ 50 ký tự, **duy nhất** — tự chuẩn hoá về **CHỮ HOA** |
  | `discountType` | ✅ | `PERCENTAGE` \| `FIXED_AMOUNT` |
  | `discountValue` | ✅ | `> 0` (PERCENTAGE còn phải `<= 100`) |
  | `minOrderAmount` | ✅ | `>= 0` |
  | `usageLimit` | ❌ | `> 0`; bỏ trống ⇒ **không giới hạn** |
  | `startAt`, `endAt` | ❌ | `Instant` (ISO-8601 UTC) |
  | `status` | ❌ | Bỏ trống ⇒ **`ACTIVE`** |

- **Response `201 Created`** — `DiscountCodeResponse`
- **Lỗi:** `409` (**`code` là duy nhất**, kể cả khác hoa/thường vì đã chuẩn hoá), `400`, `404`
- **Ghi chú:** ràng buộc chéo `discountType`/`discountValue` (PERCENTAGE phải ≤ 100) được kiểm tra
  **trong service** vì phụ thuộc lẫn nhau — không diễn đạt được bằng annotation trên từng field.

### 7.29 `PUT /api/v1/admin/commerce/discount-codes/{id}` — Cập nhật mã giảm giá (FR-47)

- **Quyền:** 👑
- **Request:** như #7.28 (`status` bỏ trống ⇒ giữ nguyên)
- **Response `200`** — `DiscountCodeResponse`
- **Lỗi:** `404`, `409` (code mới trùng mã khác)
- **Ghi chú:** **`usedCount` không cho sửa** qua API.

### 7.30 `PATCH /api/v1/admin/commerce/discount-codes/{id}/status` — Bật/tắt mã (FR-58)

- **Quyền:** 👑
- **Request:** `{ "status": "INACTIVE" }`
- **Response `200`** — `DiscountCodeResponse`
- **Ghi chú:** "xoá" mã = `INACTIVE` (không hard delete). Mã `INACTIVE` bị từ chối ở #7.6 và #7.5.

---

## 8. Module Auction

**Controller:** `AuctionQueryController` (common), `AuctionBuyerController`, `AuctionSellerController`, `AuctionAdminController`
**Schema:** `nexus_auction` — bảng `auctions`, `bids`, `settlements`

### 8.1 Vòng đời phiên đấu giá (đọc trước)

```
SCHEDULED ──(tới startTime)──> ACTIVE ──(quá endTime)──> ENDED
    │                            │
    └───────────┬────────────────┘
             CANCELLED  (Seller hoặc Admin chủ động huỷ — FR-37)
```

- Job `@Scheduled` (mặc định **mỗi 15 giây**, `AUCTION_SCHEDULER_INTERVAL_MS`) tự chuyển
  `SCHEDULED → ACTIVE → ENDED` (FR-33, FR-34) và chốt người thắng (FR-35).
- **Chỉ ở `ACTIVE`** mới nhận bid (FR-30).
- **Luật giá:** bid phải `amount > currentPrice`; **bid đầu tiên** phải `>= startingPrice`.
  **Không có** khái niệm `bid_increment` — baseline 59 FR không có.

### 8.2 `GET /api/v1/auction/auctions` — Danh sách phiên (FR-29)

- **Quyền:** Công khai chỉ đọc danh sách phiên; API chi tiết, lịch sử bid và settlement vẫn yêu cầu đăng nhập.
- **Query params:**

  | Tham số | Ý nghĩa |
  |---|---|
  | `status` | **Chuỗi** (không phải enum): `SCHEDULED` \| `ACTIVE` \| `ENDED` \| `CANCELLED` |
  | `keyword` | Tìm mờ |
  | `page`, `size`, `sort` | Phân trang |

- **Response `200`** — `PageResponse<AuctionSummaryResponse>`:
  ```json
  {
    "content": [
      {
        "id": "...", "productId": "...", "sellerId": "...",
        "startingPrice": 5000000.00, "currentPrice": 6500000.00,
        "startTime": "...", "endTime": "...",
        "status": "ACTIVE", "highestBidderId": "..."
      }
    ],
    "page": 0, "size": 20, "totalElements": 4, "totalPages": 1,
    "first": true, "last": true
  }
  ```
- **Lưu ý:** tham số `status` ở đây là **`String`**, không phải enum — truyền giá trị sai sẽ **không** gây
  lỗi 400 mà bị bỏ qua/không khớp. Hãy dùng đúng chữ hoa.

### 8.3 `GET /api/v1/auction/auctions/{id}` — Chi tiết phiên (FR-28)

- **Quyền:** 🔓
- **Response `200`** — `AuctionResponse`:
  ```json
  {
    "id": "...", "productId": "...", "sellerId": "...",
    "startingPrice": 5000000.00, "currentPrice": 6500000.00,
    "startTime": "...", "endTime": "...",
    "status": "ACTIVE", "highestBidderId": "...",
    "acceptedBidCount": 7,
    "createdAt": "...", "updatedAt": "..."
  }
  ```
- **Lỗi:** `404`

### 8.4 `GET /api/v1/auction/auctions/{id}/bids` — Lịch sử bid (FR-31)

- **Quyền:** 🔓
- **Query params:** `page`, `size`, `sort`
- **Response `200`** — `PageResponse<BidResponse>`:
  ```json
  {
    "content": [
      {
        "id": "...", "auctionId": "...", "bidderId": "...",
        "amount": 6500000.00, "status": "ACCEPTED",
        "placedAt": "..."
      }
    ],
    "page": 0, "size": 20, "totalElements": 7, "totalPages": 1,
    "first": true, "last": true
  }
  ```
- **Ghi chú quan trọng:** **chỉ trả bid `ACCEPTED`**, mới nhất trước. Bid `REJECTED` **vẫn được lưu**
  trong DB để truy vết/kiểm toán nhưng **không xuất hiện** ở API công khai.

### 8.5 `GET /api/v1/auction/auctions/{id}/settlement` — Kết quả chốt phiên (FR-35)

- **Quyền:** 🔓
- **Response `200`** — `SettlementResponse`:
  ```json
  {
    "id": "...", "auctionId": "...",
    "winnerId": "...",
    "orderId": null,
    "finalPrice": 6500000.00,
    "status": "WON",
    "settledAt": "...",
    "bidCount": 7
  }
  ```
  `status`: `WON` (có bid hợp lệ, đã xác định người thắng) \| `NO_BIDS` (không có bid ACCEPTED nào)
  \| `FAILED` (dành cho giai đoạn business logic khi người thắng không hoàn tất giao dịch).
- **Ghi chú:** `orderId` hiện **luôn `null`** vì FR-36 (sinh Order loại `AUCTION` từ kết quả đấu giá)
  thuộc giai đoạn business logic, chưa triển khai.
- **Lỗi:** `404` — phiên chưa kết thúc / chưa có settlement

### 8.6 `POST /api/v1/buyer/auction/auctions/{id}/bids` — Buyer đặt giá (FR-30)

- **Quyền:** 🛒 `hasRole('BUYER')`
- **Request:** `{ "amount": 7000000.00 }` (`> 0`)
- **Response `201 Created`** — `BidResponse` với **`status = "ACCEPTED"`**
- **Lỗi:**
  - `422` — phiên không `ACTIVE`, hoặc `amount` không lớn hơn `currentPrice`
    (bid đầu tiên phải `>= startingPrice`)
  - `403`, `404`
- **Ghi chú:** `bidderId` **không có trong request** — lấy từ token.
- **⚠️ TODO:** FR-32 (outbid detection → tạo notification cho người bị đè giá) chưa nối.

### 8.7 `POST /api/v1/seller/auction/auctions` — Tạo phiên đấu giá (FR-26)

- **Quyền:** 🏪 `hasRole('SELLER')`
- **Request:**
  ```json
  {
    "productId": "...",
    "startingPrice": 5000000.00,
    "startTime": "2025-06-20T00:00:00Z",
    "endTime": "2025-06-27T00:00:00Z"
  }
  ```
  Tất cả **bắt buộc**. `startingPrice > 0`. `startTime`/`endTime` là `Instant` (ISO-8601 UTC).
- **Response `201 Created`** — `AuctionResponse` với **`status = "SCHEDULED"`**
- **Lỗi:** `400`, `404` (sản phẩm không tồn tại / không thuộc Seller)
- **Ghi chú:** `sellerId` **không có trong request** — lấy từ token.

### 8.8 `PUT /api/v1/seller/auction/auctions/{id}` — Cấu hình lại phiên (FR-27)

- **Quyền:** 🏪 (phải là chủ phiên)
- **Điều kiện:** **chỉ áp dụng khi phiên còn `SCHEDULED`**
- **Request:** `{ "startingPrice": ..., "startTime": ..., "endTime": ... }` (tất cả bắt buộc)
- **Response `200`** — `AuctionResponse`
- **Lỗi:** `422` — phiên đã `ACTIVE`/`ENDED`/`CANCELLED`; `403`, `404`
- **Ghi chú:** **không đổi được `productId`** sau khi tạo.

### 8.9 `POST /api/v1/seller/auction/auctions/{id}/cancel` — Seller huỷ phiên (FR-37)

- **Quyền:** 🏪 (phải là chủ phiên)
- **Request:** không có body
- **Response `200`** — `AuctionResponse` với `status = "CANCELLED"`
- **Lỗi:** `403`, `404`, `422` (phiên đã kết thúc)

### 8.10 `GET /api/v1/admin/auction/auctions` — Mọi phiên + lịch sử bid (FR-57)

- **Quyền:** 👑 `hasRole('ADMIN')`
- **Query params:** `status` (chuỗi), `keyword`, `page`, `size`, `sort`
- **Response `200`** — `PageResponse<AdminAuctionResponse>`:
  ```json
  {
    "content": [
      {
        "id": "...", "productId": "...", "sellerId": "...",
        "startingPrice": 5000000.00, "currentPrice": 6500000.00,
        "startTime": "...", "endTime": "...", "status": "ACTIVE",
        "highestBidderId": "...",
        "bidCount": 9,
        "acceptedBidCount": 7,
        "bids": [ { "id": "...", "bidderId": "...", "amount": 6500000.00,
                    "status": "ACCEPTED", "placedAt": "..." } ]
      }
    ],
    "page": 0, "size": 20, "totalElements": 4, "totalPages": 1,
    "first": true, "last": true
  }
  ```
- **Ghi chú thiết kế:** endpoint này **gộp sẵn lịch sử bid** vào từng phiên (tối đa **50 bid ACCEPTED**
  gần nhất) để Admin không phải gọi thêm #8.4 cho từng phiên — tránh N+1 ở phía client.
  `bidCount` đếm **mọi** trạng thái; `acceptedBidCount` chỉ đếm `ACCEPTED`.

### 8.11 `POST /api/v1/admin/auction/auctions/{id}/cancel` — Admin huỷ phiên (FR-37)

- **Quyền:** 👑
- **Response `200`** — `AuctionResponse` với `status = "CANCELLED"`
- **Lỗi:** `404`, `422` (phiên đã kết thúc)
- **Ghi chú:** Admin huỷ được **mọi** phiên (không cần là chủ sở hữu).

---

## 9. Module Notification

**Controller:** `NotificationController` (`controller/common`)
**Schema:** `nexus_notification` — bảng `notifications`

Cả 3 role dùng chung, bảo vệ bằng `@PreAuthorize("isAuthenticated()")`.
**Không method nào nhận `userId` của người đang đăng nhập từ request** — luôn lấy từ token.
Ngoại lệ duy nhất là FR-49 (endpoint nội bộ, xem #9.1).

### 9.1 `POST /api/v1/notification/notifications` — Tạo thông báo (FR-49)

- **Quyền:** 🔓 `isAuthenticated()` — **endpoint nội bộ** để các module nghiệp vụ (Order, Auction,
  Shipment, User…) gọi vào ở giai đoạn business logic
- **Request:**
  ```json
  {
    "userId": "...",
    "eventType": "ORDER_CREATED",
    "title": "Đơn hàng mới",
    "content": "Đơn ORD-20250614-A1B2C3 đã được tạo",
    "referenceType": "ORDER",
    "referenceId": "..."
  }
  ```
  | Field | Bắt buộc | Ràng buộc |
  |---|---|---|
  | `userId` | ✅ | **Người NHẬN thông báo** — không phải người đang đăng nhập |
  | `eventType` | ✅ | 1 trong **23** giá trị (xem [Phụ lục A](#phụ-lục-a--toàn-bộ-enum)) |
  | `title` | ✅ | ≤ 255 ký tự |
  | `content` | ❌ | ≤ 4000 ký tự |
  | `referenceType` | ❌ | ≤ 50 ký tự (ví dụ `ORDER`, `AUCTION`, `PRODUCT`) |
  | `referenceId` | ❌ | UUID của đối tượng liên quan |

- **Response `201 Created`** — `NotificationResponse`
- **Lỗi:** `400`, `401`
- **Ghi chú:** đây là **ngoại lệ duy nhất** của nguyên tắc "không nhận `userId` từ client" —
  vì đây là API nội bộ, người nhận do module gọi vào quyết định, không phải người đang đăng nhập.

### 9.2 `GET /api/v1/notification/notifications` — Thông báo của tôi (FR-50)

- **Quyền:** 🔓
- **Query params:**

  | Tham số | Mặc định | Ý nghĩa |
  |---|---|---|
  | `unreadOnly` | `false` | `true` = chỉ lấy thông báo **chưa đọc** |
  | `eventType` | — | Lọc theo 1 trong 23 loại sự kiện |
  | `page`, `size`, `sort` | — | Phân trang |

- **Response `200`** — `PageResponse<NotificationSummaryResponse>` (mới nhất trước):
  ```json
  {
    "content": [
      {
        "id": "...", "eventType": "ORDER_CREATED",
        "title": "Đơn hàng mới",
        "referenceType": "ORDER", "referenceId": "...",
        "read": false, "readAt": null,
        "createdAt": "..."
      }
    ],
    "page": 0, "size": 20, "totalElements": 12, "totalPages": 1,
    "first": true, "last": true
  }
  ```
- **Ghi chú:** bản `Summary` **bỏ `content`** để payload nhẹ — UI danh sách chỉ cần badge + tiêu đề;
  nội dung đầy đủ lấy qua #9.4.

### 9.3 `GET /api/v1/notification/notifications/unread-count` — Số chưa đọc (FR-50)

- **Quyền:** 🔓
- **Response `200`** — **một con số** (JSON number thô, không bọc object):
  ```
  5
  ```
- **Ghi chú kỹ thuật:** route này được khai báo **TRƯỚC** `/{id}` trong controller, nếu không Spring
  sẽ hiểu `unread-count` là một UUID → lỗi 400. Đây là chi tiết dễ gây bug khi refactor.

### 9.4 `GET /api/v1/notification/notifications/{id}` — Chi tiết thông báo (FR-50)

- **Quyền:** 🔓 (phải là **chủ** thông báo)
- **Response `200`** — `NotificationResponse`:
  ```json
  {
    "id": "...", "userId": "...", "eventType": "ORDER_CREATED",
    "title": "...", "content": "...",
    "referenceType": "ORDER", "referenceId": "...",
    "read": true, "readAt": "...",
    "createdAt": "...", "updatedAt": "..."
  }
  ```
- **Lỗi:** `403` (thông báo của người khác), `404`

### 9.5 `PATCH /api/v1/notification/notifications/{id}/read` — Đánh dấu đã đọc (FR-51)

- **Quyền:** 🔓 (phải là chủ thông báo)
- **Request:** không có body
- **Response `200`** — `NotificationResponse` với `read: true` và `readAt` đã được ghi
- **Lỗi:** `403`, `404`
- **Ghi chú:** gọi lại lần 2 trên thông báo đã đọc **không lỗi** (idempotent trên thực tế).

### 9.6 `PATCH /api/v1/notification/notifications/read-all` — Đánh dấu tất cả đã đọc (FR-51)

- **Quyền:** 🔓
- **Request:** không có body
- **Response `200`** — `MarkAllReadResponse`:
  ```json
  { "updated": 12 }
  ```
- **Ghi chú:** thực hiện **một câu UPDATE hàng loạt**, chỉ tính thông báo của **chính người gọi**.
  `updated` = số bản ghi thực sự được cập nhật (thông báo đã đọc trước đó không tính).

---

## Phụ lục A — Toàn bộ enum

### A.1 User (`nexus-user`)

| Enum | Giá trị | Dùng ở |
|---|---|---|
| `UserStatus` | `ACTIVE`, `INACTIVE`, `BANNED` | `PATCH /admin/users/{id}/status` |
| `Gender` | `MALE`, `FEMALE`, `OTHER` | Hồ sơ (`PUT /buyer/profile`) |

### A.2 Catalog (`nexus-catalog`)

| Enum | Giá trị | Ghi chú |
|---|---|---|
| `ProductStatus` | `DRAFT`, `ACTIVE`, `INACTIVE` | `DRAFT` = bản nháp, chưa công khai |
| `CategoryStatus` | `ACTIVE`, `INACTIVE` | "Xoá" danh mục = `INACTIVE` |
| `ReviewStatus` | `VISIBLE`, `HIDDEN` | Đánh giá mới luôn `VISIBLE` |

### A.3 Fulfillment (`nexus-fulfillment`)

| Enum | Giá trị | Ghi chú |
|---|---|---|
| `InventoryStatus` | `IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK` | **Tự tính lại**, ngưỡng LOW = 5 |
| `InventoryOperation` | `INCREASE`, `DECREASE`, `SET_AVAILABLE` | Phép toán của FR-14 |
| `ShipmentStatus` | `PENDING`, `SHIPPED`, `DELIVERED` | Chỉ tiến, không lùi |
| `WarehouseStatus` | `ACTIVE`, `INACTIVE` | "Xoá" kho = `INACTIVE` |

### A.4 Commerce (`nexus-commerce`)

| Enum | Giá trị | Ghi chú |
|---|---|---|
| `CartStatus` | `ACTIVE`, `CONVERTED` | Giỏ chuyển `CONVERTED` sau checkout |
| `OrderStatus` | `PENDING`, `CONFIRMED`, `SHIPPING`, `COMPLETED`, `CANCELLED` | **Không có `PAID`** |
| `OrderType` | `DIRECT`, `AUCTION` | `AUCTION` do FR-36 sinh (chưa triển khai) |
| `PaymentMethod` | `COD`, `BANK_TRANSFER`, `E_WALLET`, `MOCK` | `MOCK` để test không cần cổng thật |
| `PaymentStatus` | `PENDING`, `SUCCESS`, `FAILED` | Client chỉ set được `SUCCESS`/`FAILED` |
| `RatingStatus` | `VISIBLE`, `HIDDEN` | Đánh giá Seller |
| `CampaignStatus` | `DRAFT`, `ACTIVE`, `ENDED` | "Xoá" chiến dịch = `ENDED` |
| `DiscountType` | `PERCENTAGE`, `FIXED_AMOUNT` | PERCENTAGE: `0 < value <= 100` |
| `DiscountCodeStatus` | `ACTIVE`, `INACTIVE` | "Xoá" mã = `INACTIVE` |

### A.5 Auction (`nexus-auction`)

| Enum | Giá trị | Ghi chú |
|---|---|---|
| `AuctionStatus` | `SCHEDULED`, `ACTIVE`, `ENDED`, `CANCELLED` | Xem sơ đồ vòng đời §8.1 |
| `BidStatus` | `ACCEPTED`, `REJECTED` | `REJECTED` vẫn lưu DB, không hiện ở API |
| `SettlementStatus` | `WON`, `FAILED`, `NO_BIDS` | `FAILED` dành cho giai đoạn business logic |

### A.6 Notification (`nexus-notification`) — `NotificationEventType` (đúng **23** giá trị theo FR-49)

```
USER_REGISTERED
PRODUCT_CREATED      PRODUCT_UPDATED
CART_ITEM_ADDED      CART_ITEM_UPDATED     CART_ITEM_REMOVED
ORDER_CREATED        ORDER_PAID            ORDER_PAYMENT_FAILED
ORDER_COMPLETED      ORDER_CANCELLED
AUCTION_CREATED      AUCTION_STARTED       BID_PLACED
OUTBID               AUCTION_CANCELLED     AUCTION_ENDED
AUCTION_WON          AUCTION_FAILED
SHIPMENT_CREATED     SHIPMENT_DELIVERED
REVIEW_RECEIVED
```

---

## Phụ lục B — Luồng nghiệp vụ end-to-end

### B.1 Luồng mua hàng trực tiếp (happy path)

```
1. POST /api/v1/auth/register            (role=BUYER)          → tạo tài khoản
2. POST /api/v1/auth/login                                         → accessToken
3. GET  /api/v1/catalog/products          (không cần token)      → tìm sản phẩm
4. GET  /api/v1/catalog/products/{id}     (không cần token)      → xem chi tiết
5. GET  /api/v1/buyer/commerce/cart                              → giỏ (tự tạo nếu chưa có)
6. POST /api/v1/buyer/commerce/cart/items                        → thêm hàng
7. PUT  /api/v1/buyer/commerce/cart/items/{itemId}               → đổi số lượng (tuỳ chọn)
8. POST /api/v1/buyer/commerce/checkout/apply-discount           → xem trước giảm giá (tuỳ chọn)
9. POST /api/v1/buyer/commerce/checkout                          → Order (status=PENDING)
10. POST /api/v1/buyer/commerce/orders/{id}/payments             → Payment (status=PENDING)
11. POST /api/v1/buyer/commerce/payments/{id}/confirm            → result=SUCCESS
                                                                   → Order chuyển CONFIRMED
-- phía Seller --
12. GET  /api/v1/seller/commerce/orders                          → thấy đơn mới
13. PATCH /api/v1/seller/commerce/orders/{id}/status             → SHIPPING
14. POST /api/v1/seller/fulfillment/shipments                    → Shipment (PENDING)
15. PATCH /api/v1/seller/fulfillment/shipments/{id}/status       → SHIPPED
-- phía Buyer --
16. GET  /api/v1/buyer/fulfillment/shipments?orderId=...         → theo dõi vận đơn
-- hoàn tất --
17. PATCH /api/v1/seller/commerce/orders/{id}/status             → COMPLETED
18. POST /api/v1/buyer/catalog/products/{id}/reviews            → đánh giá sản phẩm
19. POST /api/v1/buyer/commerce/seller-ratings                   → đánh giá Seller (bắt buộc COMPLETED)
```

### B.2 Luồng bán hàng (Seller thiết lập gian hàng)

```
1. POST /api/v1/auth/register            (role=SELLER)
2. POST /api/v1/auth/login
3. POST /api/v1/seller/catalog/products/{id}/images/upload       → publicUrl
4. POST /api/v1/seller/catalog/products  (images=[publicUrl])    → Product (status=ACTIVE)
5. POST /api/v1/seller/fulfillment/skus  (productId, initial*)   → SKU + tồn kho ban đầu
6. PATCH /api/v1/seller/fulfillment/inventories/{id}             → nhập thêm hàng khi cần
```

> **Lưu ý:** sản phẩm tạo mới ở trạng thái **`ACTIVE`** nên **hiển thị công khai ngay** (không cần
> Admin duyệt). Admin có thể hạ xuống `DRAFT`/`INACTIVE` qua `PATCH /admin/catalog/products/{id}/status`.
> Bước 3 có thể đảo lên trước bước 4 tuỳ cách client tổ chức form.

### B.3 Luồng đấu giá

```
1. POST /api/v1/seller/auction/auctions                   → Auction (SCHEDULED)
2. PUT  /api/v1/seller/auction/auctions/{id}              → sửa khi còn SCHEDULED
   -- job @Scheduled tự chuyển ---
3. GET  /api/v1/auction/auctions?status=ACTIVE             → Buyer tìm phiên
4. GET  /api/v1/auction/auctions/{id}                      → xem chi tiết/giá hiện tại
5. POST /api/v1/buyer/auction/auctions/{id}/bids           → đặt giá (ACCEPTED)
6. GET  /api/v1/auction/auctions/{id}/bids                 → xem lịch sử
   -- job tự chuyển ENDED + chốt winner ---
7. GET  /api/v1/auction/auctions/{id}/settlement           → WON / NO_BIDS
```

### B.4 Luồng khuyến mãi (Admin)

```
1. POST /api/v1/admin/commerce/campaigns                         → Campaign (DRAFT)
2. PUT  /api/v1/admin/commerce/campaigns/{id}                    → status=ACTIVE
3. POST /api/v1/admin/commerce/discount-codes (campaignId=...)   → DiscountCode
4. -- Buyer dùng mã: checkout/apply-discount rồi checkout --
5. GET  /api/v1/admin/commerce/discount-codes/{id}               → xem usedCount
6. PATCH /api/v1/admin/commerce/discount-codes/{id}/status       → INACTIVE khi hết hạn
7. DELETE /api/v1/admin/commerce/campaigns/{id}                  → ENDED
```

---

## Phụ lục C — Endpoint hạ tầng & điểm chưa hoàn thiện

### C.1 Endpoint hạ tầng (không thuộc 91 endpoint nghiệp vụ)

| Endpoint | Quyền | Mô tả |
|---|---|---|
| `GET /actuator/health` | 🌐 | Health check (chi tiết đầy đủ: DB, disk…) |
| `GET /actuator/info` | 🌐 | Thông tin build |
| `GET /actuator/metrics` | 🔒 | Metrics (yêu cầu xác thực) |
| `GET /swagger-ui.html` | 🌐 | Swagger UI |
| `GET /v3/api-docs` | 🌐 | OpenAPI JSON |
| `GET /oauth2/authorization/google` | 🌐 | Bắt đầu luồng Google login (chỉ tồn tại khi có Google credential) |
| `GET /login/oauth2/code/google` | 🌐 | Callback Google (nội bộ Spring Security) |

> **Cách xem danh sách API luôn khớp với code:** mở `http://localhost:8080/swagger-ui.html`
> — springdoc tự sinh từ annotation, nên đây là nguồn sự thật nhanh nhất khi code thay đổi.

### C.2 Các điểm CHƯA hoàn thiện (quan trọng khi demo/bảo vệ)

Đây là danh sách các `TODO (business logic)` đã được đánh dấu **trong chính code** — không phải
suy đoán của tài liệu. Chúng là khoảng trống giữa "CRUD đủ API" và "nghiệp vụ chạy đúng".

| # | FR | Vấn đề | Hệ quả nếu gọi API theo đúng thứ tự tự nhiên |
|---:|---|---|---|
| 1 | **FR-05** | Tạo Product **kèm SKU + tồn kho** phải là một transaction; hiện là 2 API rời | Gọi `POST /seller/catalog/products` xong, nếu `POST /seller/fulfillment/skus` thất bại → có sản phẩm **không có SKU/tồn kho**, không ai rollback |
| 2 | **FR-16** | `CartItem.unitPrice` và `productName` **nhận từ request**; **chưa kiểm tra tồn kho** | Client có thể gửi `unitPrice` tuỳ ý (ví dụ 1đ) → **sai giá**. Thêm hàng vượt tồn kho vẫn thành công |
| 3 | **FR-25** | Huỷ đơn **chưa trả lại tồn kho** | Huỷ đơn xong, `availableQuantity` không tăng lại → kho bị "treo" |
| 4 | **FR-32** | Outbid **chưa tạo notification** cho người bị đè giá | Buyer bị đè giá không nhận được thông báo `OUTBID` |
| 5 | **FR-36** | Settlement **chưa tạo Order loại `AUCTION`** | `SettlementResponse.orderId` luôn `null`; người thắng đấu giá **không có đơn hàng** để thanh toán |
| 6 | **FR-38** | Tạo Shipment **chưa kiểm tra** `Payment.status = SUCCESS` và **chưa kiểm tra** Seller sở hữu Order | Seller có thể tạo vận đơn cho đơn chưa thanh toán, hoặc cho đơn của Seller khác |
| 7 | **FR-08** | Xoá sản phẩm **chưa chặn** khi đang có auction / đơn hàng hoạt động | Xoá sản phẩm đang đấu giá → phiên đấu giá trỏ tới sản phẩm đã xoá |
| 8 | **FR-49** | Endpoint tạo notification tồn tại nhưng **chưa module nào gọi vào** | Không có thông báo nào được sinh tự động trong toàn hệ thống |
| 9 | **FR-42** | Đánh giá **sản phẩm** chưa kiểm tra đơn đã `COMPLETED` | Buyer đánh giá được dù đơn còn `PENDING`. (Đánh giá **Seller** thì đã kiểm tra đúng.) |

**Cách đọc bảng này khi bảo vệ:** đây là phần **hoãn có chủ ý** trong giai đoạn CRUD, không phải
phần bỏ sót. Baseline 59 FR vẫn được cover về mặt **API/hợp đồng**; phần *nối nghiệp vụ xuyên module*
là bước tiếp theo. Xem `backend/README.md` §6 và §9 để biết lý do thiết kế của từng quyết định.

### C.3 Ghi chú kỹ thuật dễ gây lỗi khi tích hợp

| Vấn đề | Chi tiết |
|---|---|
| **Route `unread-count` vs `/{id}`** | `GET /notification/notifications/unread-count` phải khai báo **trước** `GET /{id}`, nếu không Spring hiểu `unread-count` là UUID → 400. Đừng đổi thứ tự method khi refactor. |
| **`status` của Auction là `String`** | `GET /auction/auctions?status=` nhận `String`, không phải enum. Truyền sai chữ hoa/thường **không** trả 400 mà bị bỏ qua → client tưởng "không có dữ liệu". |
| **Mật khẩu tối đa 72 ký tự** | BCrypt chỉ dùng 72 byte đầu — vượt quá bị `@Size` từ chối (400) chứ không bị cắt âm thầm. |
| **`PUT` là thay thế toàn bộ** | Ở `PUT /seller/catalog/products/{id}`, gửi `images: []` = **xoá hết ảnh**. Không phải "giữ nguyên". |
| **`null` vs `""` ở profile** | Field `null` = giữ nguyên; chuỗi rỗng `""` = xoá giá trị. Hai ngữ nghĩa khác nhau. |
| **Phân trang bắt đầu từ 0** | `page=1` là **trang thứ hai**, không phải trang đầu. |
| **`code` mã giảm giá tự viết HOA** | Gửi `sale10` sẽ lưu thành `SALE10`. `409` khi trùng kể cả khác hoa/thường. |
| **Lỗi nghiệp vụ là 422, không phải 400** | Đọc trường `error` trong body, đừng chỉ dựa vào HTTP status (xem §2.5). |
| **`sellerId` trong cart là của SẢN PHẨM** | `POST /buyer/commerce/cart/items` **bắt buộc** có `sellerId` trong body — đó là Seller bán sản phẩm, không phải người đang đăng nhập (người đăng nhập lấy từ token). |

### C.4 Ma trận FR → endpoint (đối chiếu nhanh)

| Dải FR | Module | Số FR | Endpoint phụ trách |
|---|---|---:|---|
| FR-01 – FR-04 | User | 4 | #1–#12 |
| FR-05 – FR-12 | Catalog | 8 | #13–#22, #28–#30 |
| FR-13, FR-14 | Fulfillment | 2 | #36–#38 |
| FR-15 – FR-25 | Commerce | 11 | #46–#65 |
| FR-26 – FR-37 | Auction | 12 | #76–#85 |
| FR-38 – FR-40 | Fulfillment | 3 | #33, #39, #40 |
| FR-41, FR-42 | Catalog | 2 | #16, #17 |
| FR-43, FR-44 | Commerce | 2 | #57 |
| FR-45 | Catalog | 1 | #31 |
| FR-46 – FR-48 | Commerce | 3 | #51, #66–#75 |
| FR-49 – FR-51 | Notification | 3 | #86–#91 |
| FR-52 | User | 1 | #10 (dùng lại FR-04) |
| FR-53, FR-54 | Catalog | 2 | #23–#32 |
| FR-55 | Fulfillment | 1 | #41–#45 |
| FR-56 | Commerce | 1 | #62–#65 |
| FR-57 | Auction | 1 | #84, #85 |
| FR-58 | Commerce | 1 | #75 (dùng lại FR-46/47) |
| FR-59 | Catalog | 1 | #32 |

> Nhiều FR được phục vụ bởi cùng một endpoint (ví dụ FR-06/11/12 dùng chung `GET /catalog/products`)
> vì baseline ghi **nhiều actor / nhiều mục đích** cho một thao tác đọc. Đây là chủ ý, không phải thiếu API.

---

## Kết luận — đọc gì trước

| Bạn muốn… | Đọc mục |
|---|---|
| Biết toàn cảnh có bao nhiêu API | §1 + bảng §3 |
| Tích hợp frontend, cần biết header/phân trang/lỗi | §2 |
| Tìm đúng endpoint cho một màn hình | §3 (bảng tra cứu) rồi nhảy tới mục 4–9 |
| Hiểu một endpoint cụ thể | Mục 4–9 theo module |
| Tra giá trị enum hợp lệ | Phụ lục A |
| Dựng luồng demo end-to-end | Phụ lục B |
| Biết cái gì **chưa** chạy đúng | Phụ lục C.2 |

**Nguồn sự thật khi code thay đổi:**

1. `http://localhost:8080/swagger-ui.html` — springdoc tự sinh, luôn khớp code.
2. `http://localhost:8080/v3/api-docs` — OpenAPI JSON (dùng để sinh client SDK).
3. Các file controller trong `backend/nexus-*/src/main/java/**/controller/` — nguồn gốc.
