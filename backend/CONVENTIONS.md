# NEXUS BACKEND — QUY ƯỚC CODE (CONVENTIONS)

> **Đây là hợp đồng bắt buộc.** Mọi module phải tuân thủ file này. Nếu bạn (người hoặc AI) cần một lớp dùng chung chưa có trong §5, **hãy báo lại**, đừng tự tạo trong module của mình.
>
> Nguồn yêu cầu: `../scope.xlsx` (59 FR) + `../Doc/NEXUS-Review-Tong-hop-va-Quyet-dinh.md` (v1.1).

---

## 1. STACK ĐÃ CHỐT

| Thành phần | Version | Ghi chú |
|---|---|---|
| Java | **21** (LTS) | `<java.version>21</java.version>`; build trên JDK 25 cũng OK |
| Spring Boot | **4.1.1** | OSS tới 31/07/2027 |
| springdoc-openapi | **3.1.1** | dòng 3.x dành cho Boot 4 (2.9.x là cho Boot 3) |
| Maven | 3.9.x | multi-module |
| PostgreSQL | 15+ (Supabase) | mỗi module một **schema** riêng |
| Lombok | theo Boot BOM | `@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor @RequiredArgsConstructor` |
| MapStruct | **KHÔNG dùng** | mapper viết tay (static method) để dễ đọc và dễ sửa |
| Flyway/Liquibase | **KHÔNG dùng** ở Release 1 | DDL nằm ở `db/*.sql`, chạy tay một lần |

**Kiến trúc:** 1 Spring Boot app (`nexus-app`) + 6 module nghiệp vụ (jar) + 1 module dùng chung.
Không API gateway, không service discovery, không message broker, không Redis, không Docker, không Kubernetes.

---

## 2. SƠ ĐỒ MODULE & SCHEMA

| Module (artifactId) | Base package | Postgres schema | FR phụ trách |
|---|---|---|---|
| `nexus-common` | `com.nexus.common` | — | Hạ tầng dùng chung |
| `nexus-user` | `com.nexus.user` | `nexus_user` | FR-01–04, FR-52 |
| `nexus-catalog` | `com.nexus.catalog` | `nexus_catalog` | FR-05–12, FR-41, FR-42, FR-45, FR-53, FR-54, FR-59 |
| `nexus-fulfillment` | `com.nexus.fulfillment` | `nexus_fulfillment` | FR-13, FR-14, FR-38–40, FR-55 |
| `nexus-commerce` | `com.nexus.commerce` | `nexus_commerce` | FR-15–25, FR-43, FR-44, FR-46–48, FR-56, FR-58 |
| `nexus-auction` | `com.nexus.auction` | `nexus_auction` | FR-26–37, FR-57 |
| `nexus-notification` | `com.nexus.notification` | `nexus_notification` | FR-49–51 |
| `nexus-app` | `com.nexus` | — | Bootstrap: main class, `application.yml`, cấu hình chung |

**Quy tắc phụ thuộc (rất quan trọng):**
- Mọi module nghiệp vụ **chỉ** phụ thuộc `nexus-common`.
- **Không** module nào phụ thuộc module nghiệp vụ khác trong giai đoạn CRUD này. Khi làm business logic (giai đoạn sau) mới thêm `nexus-commerce → nexus-catalog`, `nexus-commerce → nexus-fulfillment`, `nexus-auction → nexus-catalog` và gọi **service** (không gọi repository, không join bảng).
- **Không** có JPA relationship, `@JoinColumn`, FK hay `@ManyToOne` trỏ sang entity của module khác. Tham chiếu chéo module chỉ là `UUID` (tên field kết thúc bằng `Id`).

---

## 3. CẤU TRÚC THƯ MỤC (BẮT BUỘC)

```
backend/
├── pom.xml                          # parent POM (dependencyManagement + modules)
├── README.md
├── CONVENTIONS.md
├── .env.example
├── db/
│   ├── 00-create-schemas.sql
│   ├── 01-user.sql
│   ├── 02-catalog.sql  03-fulfillment.sql  04-commerce.sql
│   ├── 05-auction.sql  06-notification.sql
│   └── 99-seed.sql
├── nexus-common/                    # jar, không chạy độc lập
├── nexus-user/
│   └── src/main/java/com/nexus/user/
│       ├── config/                  # cấu hình riêng của module (nếu có)
│       ├── controller/
│       │   ├── publicapi/           # KHÔNG cần token  (/api/v1/auth/**)
│       │   ├── common/              # mọi role đã đăng nhập
│       │   ├── buyer/               # BUYER
│       │   ├── seller/              # SELLER
│       │   └── admin/               # ADMIN
│       ├── dto/
│       │   ├── common/              # request/response dùng chung nhiều role
│       │   ├── buyer/
│       │   ├── seller/
│       │   └── admin/
│       ├── entity/
│       ├── enums/
│       ├── exception/               # exception riêng của module (nếu có)
│       ├── mapper/                  # static mapper, viết tay
│       ├── repository/              # Spring Data JPA
│       └── service/
│           ├── XxxService.java      # interface
│           └── impl/XxxServiceImpl.java
├── nexus-catalog/  nexus-fulfillment/  nexus-commerce/
├── nexus-auction/  nexus-notification/
└── nexus-app/
    └── src/main/java/com/nexus/NexusApplication.java
        src/main/resources/application.yml
```

**Quy ước package quan trọng:** main class đặt ở package **`com.nexus`** (không phải `com.nexus.app`) để `@SpringBootApplication` tự quét được `com.nexus.**` — tức là mọi module. **Không** cần `scanBasePackages` thủ công.

### Đặt tên lớp

| Loại | Quy ước | Ví dụ |
|---|---|---|
| Entity | danh từ số ít | `Product`, `CartItem` |
| Repository | `<Entity>Repository` | `ProductRepository` |
| DTO request | `<Hành động><Đối tượng>Request` | `CreateProductRequest`, `UpdateProfileRequest` |
| DTO response | `<Đối tượng>Response` / `<Đối tượng>SummaryResponse` | `ProductResponse`, `ProductSummaryResponse` |
| Mapper | `<Entity>Mapper` (final class, private constructor) | `ProductMapper` |
| Service | `<Đối tượng>Service` (interface) + `XxxServiceImpl` | `ProductService` |
| Controller | `<Module><Role>Controller` | `CatalogSellerController`, `CommerceBuyerController` |
| Enum | số ít, hằng số `UPPER_SNAKE` | `OrderStatus.COMPLETED` |

### Đường dẫn API (role-first — đây là yêu cầu của chủ dự án)

| Nhóm controller | Prefix | Bảo vệ |
|---|---|---|
| `controller/publicapi/` | `/api/v1/auth/**` | `permitAll` |
| `controller/common/` | `/api/v1/<module>/**` | `authenticated()` — dùng cho FR mà **nhiều role cùng dùng** (vd FR-06, FR-28) |
| `controller/buyer/` | `/api/v1/buyer/**` | `hasRole('BUYER')` |
| `controller/seller/` | `/api/v1/seller/**` | `hasRole('SELLER')` |
| `controller/admin/` | `/api/v1/admin/**` | `hasRole('ADMIN')` |

Quy tắc: **nếu một FR chỉ có một actor → đặt vào controller của role đó.** Nếu FR ghi nhiều actor (Buyer, Seller, Administrator) → đặt ở `common/` với `@PreAuthorize("isAuthenticated()")`, **không** nhân bản 3 endpoint giống nhau.

---

## 4. QUY ƯỚC ENTITY

```java
@Entity
@Table(name = "products", schema = "nexus_catalog")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Product extends BaseEntity {   // BaseEntity có sẵn id/createdAt/updatedAt
    @Column(name = "seller_id", nullable = false, updatable = false)
    private UUID sellerId;                  // tham chiếu chéo module = UUID trần

    @Column(name = "base_price", nullable = false, precision = 19, scale = 2)
    private BigDecimal basePrice;           // FR-05

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ProductStatus status;

    @Column(name = "deleted_at")
    private Instant deletedAt;             // soft delete (FR-08)
}
```

Bắt buộc:
1. `extends BaseEntity` (trừ entity có khoá ghép — xem `UserRole`).
2. `@Table(name=..., schema=...)` — **luôn ghi rõ schema**.
3. Tên cột **snake_case**, ghi rõ `@Column(name=...)`.
4. `BigDecimal` cho tiền: `precision = 19, scale = 2`.
5. Thời gian: `Instant` (không dùng `LocalDateTime`).
6. Enum: `@Enumerated(EnumType.STRING)` + `length = 20`.
7. Soft delete: cột `deleted_at` + repository query lọc `deletedAt IS NULL`. **Không** hard delete bản ghi nghiệp vụ (Order, Payment, Bid, Inventory, Shipment).
8. Field cần chống đua (tồn kho, auction): thêm `@Version private Long version;`.
9. `@Data` **KHÔNG** dùng trên entity (vòng lặp equals/hashCode). Dùng `@Getter @Setter`.
10. **Không** `@ManyToOne`/`@OneToMany` sang module khác. Trong cùng module thì được (`UserRole` → `User`, `Role`).

---

## 5. CÁC LỚP DÙNG CHUNG ĐÃ CÓ TRONG `nexus-common`

Dùng đúng những lớp này, **không tạo bản sao trong module**:

| FQCN | Mô tả / API |
|---|---|
| `com.nexus.common.entity.BaseEntity` | `@MappedSuperclass`: `UUID id`, `Instant createdAt`, `Instant updatedAt` (JPA auditing). Không khai báo lại 3 field này. |
| `com.nexus.common.api.ErrorCode` | enum: `VALIDATION_ERROR, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT, BUSINESS_RULE_VIOLATION, INTERNAL_ERROR`. Method: `HttpStatus status()`, `String code()`. |
| `com.nexus.common.api.ApiError` | record `(Instant timestamp, int status, String error, String message, String path, List<FieldViolation> details)` |
| `com.nexus.common.api.PageResponse<T>` | record `(List<T> content, int page, int size, long totalElements, int totalPages, boolean first, boolean last)`. Factory: `PageResponse.from(Page<T>)`, `PageResponse.of(List<T> content, int page, int size, long total)`. **Trả về lớp này, KHÔNG trả `Page<T>` trực tiếp.** |
| `com.nexus.common.exception.BusinessException` | `new BusinessException(ErrorCode, String message)` |
| `com.nexus.common.exception.ResourceNotFoundException` | `new ResourceNotFoundException(String resource, Object id)` → 404 |
| `com.nexus.common.exception.DuplicateResourceException` | `new DuplicateResourceException(String resource, String field, Object value)` → 409 |
| `com.nexus.common.exception.ForbiddenOperationException` | `new ForbiddenOperationException(String message)` → 403 |
| `com.nexus.common.exception.GlobalExceptionHandler` | `@RestControllerAdvice` xử lý validation/404/409/403/500 → `ApiError`. **Không viết lại trong module.** |
| `com.nexus.common.security.CurrentUser` | record `(UUID userId, String email, List<String> roles)` — principal của `Authentication` |
| `com.nexus.common.security.SecurityUtils` | `static CurrentUser currentUser()`, `static UUID currentUserId()`, `static boolean hasRole(String role)` |
| `com.nexus.common.config.OpenApiConfig` | Bean `OpenAPI` (title/version + Bearer auth). Không cấu hình lại springdoc ở module. |
| `com.nexus.common.config.AuditingConfig` | `@EnableJpaAuditing` |

**Trong controller, lấy người dùng hiện tại bằng `SecurityUtils.currentUserId()`** — không nhận `userId` từ request body/param (tránh giả mạo).

---

## 6. QUY ƯỚC DTO & VALIDATION

- DTO là **record** Java (bất biến), không phải class Lombok, không expose entity.
- Request có `jakarta.validation` annotation; controller dùng `@Valid @RequestBody`.
- Response **không** chứa `passwordHash`, `deletedAt`, `version`.
- Response tiền dùng `BigDecimal`; thời gian dùng `Instant` (ISO-8601).
- Mọi request tạo/sửa phải có ràng buộc: `@NotBlank`, `@NotNull`, `@Size(max=...)`, `@Positive`/`@PositiveOrZero` cho tiền và số lượng.
- DTO chia theo role: DTO chỉ Admin dùng → `dto/admin/`, chỉ Seller dùng → `dto/seller/`, v.v. DTO nhiều role dùng → `dto/common/`.

---

## 7. QUY ƯỚC CONTROLLER

```java
@RestController
@RequestMapping("/api/v1/seller/catalog/products")
@Tag(name = "Catalog — Seller", description = "FR-05, FR-07, FR-08")
@RequiredArgsConstructor
public class CatalogSellerController {

    private final ProductService productService;

    @PostMapping
    @PreAuthorize("hasRole('SELLER')")
    @Operation(summary = "FR-05 — Seller tạo sản phẩm")
    @ApiResponse(responseCode = "201", description = "Tạo thành công")
    public ResponseEntity<ProductResponse> create(@Valid @RequestBody CreateProductRequest request) {
        UUID sellerId = SecurityUtils.currentUserId();
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.create(sellerId, request));
    }
}
```

Bắt buộc:
1. Mọi controller có `@Tag` ghi rõ **FR nào** nó phục vụ; mọi method có `@Operation(summary = "FR-xx — ...")`.
2. `@PreAuthorize` ở **class** hoặc **method** (không bỏ trống).
3. List endpoint: nhận `Pageable` (Spring chuẩn `page`, `size`, `sort`) và trả `PageResponse<T>`.
4. `POST` → 201; `DELETE` (soft) → 204; `PUT`/`PATCH` → 200.
5. **Không** nhận `userId`/`sellerId` từ request — lấy từ token.
6. Không đặt business logic ở controller; chỉ map request → service → response.
7. Tìm kiếm/lọc: dùng `@RequestParam(required = false)` (keyword, status, categoryId, minPrice, maxPrice) rồi truyền xuống service.

---

## 8. QUY ƯỚC SERVICE & REPOSITORY

- Service = interface + `impl/XxxServiceImpl` (`@Service`, `@RequiredArgsConstructor`, `@Transactional`).
- `@Transactional(readOnly = true)` cho method đọc; `@Transactional` cho method ghi.
- Kiểm tra quyền sở hữu **trong service** (ví dụ Seller chỉ sửa product của mình) → ném `ForbiddenOperationException`.
- Không tìm thấy → `ResourceNotFoundException`.
- Trùng khoá (email, sku_code, discount code) → `DuplicateResourceException`.
- Repository: `JpaRepository<Entity, UUID>` + `JpaSpecificationExecutor<Entity>` khi cần filter động.
- Query luôn lọc soft delete: `findByIdAndDeletedAtIsNull(...)`.
- **Không** dùng native query trừ khi bắt buộc; nếu dùng phải ghi comment lý do.

---

## 9. MAPPER

```java
public final class ProductMapper {

    private ProductMapper() {
    }

    public static ProductResponse toResponse(Product entity) {
        return new ProductResponse(entity.getId(), entity.getName(), ...);
    }

    public static List<ProductSummaryResponse> toSummaryList(List<Product> entities) {
        return entities.stream().map(ProductMapper::toSummary).toList();
    }
}
```

Không dùng MapStruct, không dùng reflection, không `BeanUtils.copyProperties`.

---

## 10. MA TRẬN FR → MODULE → ENDPOINT (nguồn: `scope.xlsx`)

### 5.1 Account Management — `nexus-user`
| FR | Actor | Method + Path | Controller |
|---|---|---|---|
| FR-01 Register | Buyer, Seller | `POST /api/v1/auth/register` | `publicapi/AuthController` |
| FR-02 Login/Logout | all | `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me` | `publicapi/AuthController` |
| FR-03 Profile | Buyer, Seller | `GET/PUT /api/v1/buyer/profile`, `GET/PUT /api/v1/seller/profile` | `buyer/BuyerProfileController`, `seller/SellerProfileController` |
| FR-04 Manage User Accounts | Admin | `GET /api/v1/admin/users`, `GET /api/v1/admin/users/{id}`, `PATCH /api/v1/admin/users/{id}/status` | `admin/AdminUserController` |
| FR-52 Manage Users | Admin | (dùng lại FR-04) | `admin/AdminUserController` |

### 5.2–5.4 Product / Category / Search — `nexus-catalog`
| FR | Actor | Method + Path | Controller |
|---|---|---|---|
| FR-05 Create Product | Seller | `POST /api/v1/seller/catalog/products` | `seller/CatalogSellerController` |
| FR-07 Update Product | Seller | `PUT /api/v1/seller/catalog/products/{id}` | `seller/CatalogSellerController` |
| FR-08 Delete/Deactivate | Seller, Admin | `DELETE /api/v1/seller/catalog/products/{id}`, `DELETE /api/v1/admin/catalog/products/{id}` | `seller/…`, `admin/CatalogAdminController` |
| FR-06 View Product | all 3 | `GET /api/v1/catalog/products`, `GET /api/v1/catalog/products/{id}` | `common/CatalogQueryController` |
| FR-11 Search | Buyer | `GET /api/v1/catalog/products?keyword=&categoryId=&minPrice=&maxPrice=` | `common/CatalogQueryController` |
| FR-12 Filter & Sort | Buyer | `GET /api/v1/catalog/products?sort=basePrice,asc\|desc&sort=createdAt,desc` | `common/CatalogQueryController` |
| FR-09 Manage Categories | Admin | `GET/POST/PUT/DELETE /api/v1/admin/catalog/categories[/{id}]` | `admin/CatalogAdminController` |
| FR-10 Assign Category | Seller | `PATCH /api/v1/seller/catalog/products/{id}/category` | `seller/CatalogSellerController` |
| FR-41/42 Rate & Review Product | Buyer | `POST /api/v1/buyer/catalog/products/{id}/reviews`, `GET /api/v1/catalog/products/{id}/reviews` | `buyer/CatalogBuyerController`, `common/CatalogQueryController` |
| FR-45/59 Moderate Reviews | Admin | `GET /api/v1/admin/catalog/reviews`, `PATCH /api/v1/admin/catalog/reviews/{id}/status` | `admin/CatalogAdminController` |
| FR-53 Manage Products | Admin | `GET /api/v1/admin/catalog/products`, `PATCH /api/v1/admin/catalog/products/{id}/status` | `admin/CatalogAdminController` |
| FR-54 Manage Categories | Admin | (dùng lại FR-09) | `admin/CatalogAdminController` |

### 5.5 Inventory — `nexus-fulfillment`
| FR | Actor | Method + Path | Controller |
|---|---|---|---|
| FR-13 View Inventory | Seller, Admin | `GET /api/v1/seller/fulfillment/inventories`, `GET /api/v1/admin/fulfillment/inventories` | `seller/FulfillmentSellerController`, `admin/FulfillmentAdminController` |
| FR-14 Update Inventory | Seller | `PATCH /api/v1/seller/fulfillment/inventories/{id}` (increase/decrease/set available) | `seller/FulfillmentSellerController` |
| FR-55 Monitor Inventory | Admin | `GET /api/v1/admin/fulfillment/inventories` | `admin/FulfillmentAdminController` |
| FR-38 Create Shipment | Seller | `POST /api/v1/seller/fulfillment/shipments` | `seller/FulfillmentSellerController` |
| FR-39 Update Shipment Status | Seller | `PATCH /api/v1/seller/fulfillment/shipments/{id}/status` | `seller/FulfillmentSellerController` |
| FR-40 Track Order/Shipment | Buyer | `GET /api/v1/buyer/fulfillment/shipments?orderId=` | `buyer/FulfillmentBuyerController` |
| (SKU CRUD nội bộ, phục vụ FR-05) | Seller | `POST /api/v1/seller/fulfillment/skus`, `GET /api/v1/seller/fulfillment/skus` | `seller/FulfillmentSellerController` |
| (Warehouse) | Admin | `GET/POST /api/v1/admin/fulfillment/warehouses` | `admin/FulfillmentAdminController` |

### 5.6–5.8 Cart / Checkout / Order — `nexus-commerce`
| FR | Actor | Method + Path | Controller |
|---|---|---|---|
| FR-15 Create/View Cart | Buyer | `GET /api/v1/buyer/commerce/cart` | `buyer/CommerceBuyerController` |
| FR-16 Add to Cart | Buyer | `POST /api/v1/buyer/commerce/cart/items` | `buyer/CommerceBuyerController` |
| FR-17 Update Cart Item | Buyer | `PUT /api/v1/buyer/commerce/cart/items/{itemId}` | `buyer/CommerceBuyerController` |
| FR-18 Remove Cart Item | Buyer | `DELETE /api/v1/buyer/commerce/cart/items/{itemId}` | `buyer/CommerceBuyerController` |
| FR-19 Checkout | Buyer | `POST /api/v1/buyer/commerce/checkout` | `buyer/CommerceBuyerController` |
| FR-20/48 Apply Discount | Buyer | `POST /api/v1/buyer/commerce/checkout/apply-discount` | `buyer/CommerceBuyerController` |
| FR-21 Make Payment | Buyer | `POST /api/v1/buyer/commerce/orders/{id}/payments`, `POST /api/v1/buyer/commerce/payments/{id}/confirm` | `buyer/CommerceBuyerController` |
| FR-22 Create Order | Buyer/System | (sinh từ checkout FR-19) | — |
| FR-23 View Order | Buyer, Seller, Admin | `GET /api/v1/buyer/commerce/orders`, `GET /api/v1/seller/commerce/orders`, `GET /api/v1/admin/commerce/orders` + `/{id}` | 3 controller theo role |
| FR-24 Update Order Status | Seller | `PATCH /api/v1/seller/commerce/orders/{id}/status` | `seller/CommerceSellerController` |
| FR-25 Cancel Order | Buyer, Seller, Admin | `POST /api/v1/buyer/commerce/orders/{id}/cancel`, `POST /api/v1/seller/...`, `POST /api/v1/admin/...` | 3 controller theo role |
| FR-43/44 Rate & Review Seller | Buyer | `POST /api/v1/buyer/commerce/seller-ratings` | `buyer/CommerceBuyerController` |
| FR-46 Create Campaign | Admin | `GET/POST/PUT/DELETE /api/v1/admin/commerce/campaigns[/{id}]` | `admin/CommerceAdminController` |
| FR-47 Manage Discount Code | Admin | `GET/POST/PUT /api/v1/admin/commerce/discount-codes[/{id}]`, `PATCH .../{id}/status` | `admin/CommerceAdminController` |
| FR-56 Manage Orders | Admin | `GET /api/v1/admin/commerce/orders`, `PATCH .../{id}/status` | `admin/CommerceAdminController` |
| FR-58 Manage Promotions | Admin | (dùng lại FR-46/47) | `admin/CommerceAdminController` |

### 5.9 Auction — `nexus-auction`
| FR | Actor | Method + Path | Controller |
|---|---|---|---|
| FR-26 Create Auction | Seller | `POST /api/v1/seller/auction/auctions` | `seller/AuctionSellerController` |
| FR-27 Configure Auction | Seller | `PUT /api/v1/seller/auction/auctions/{id}` (chỉ khi SCHEDULED) | `seller/AuctionSellerController` |
| FR-28 View Auction | all 3 | `GET /api/v1/auction/auctions/{id}` | `common/AuctionQueryController` |
| FR-29 List Auctions | all 3 | `GET /api/v1/auction/auctions?status=&keyword=` | `common/AuctionQueryController` |
| FR-30 Place Bid | Buyer | `POST /api/v1/buyer/auction/auctions/{id}/bids` | `buyer/AuctionBuyerController` |
| FR-31 View Bid History | Buyer, Seller, Admin | `GET /api/v1/auction/auctions/{id}/bids` | `common/AuctionQueryController` |
| FR-32 Outbid Detection | System | (sinh trong service khi có bid mới) | — |
| FR-33/34 Auction Start/End | System | `@Scheduled` job | `service/impl/AuctionScheduler` |
| FR-35 Determine Winner | System | (trong scheduler) | — |
| FR-36 Create Auction Order | System | (giai đoạn business logic) | — |
| FR-37 Cancel Auction | Seller, Admin | `POST /api/v1/seller/auction/auctions/{id}/cancel`, `POST /api/v1/admin/auction/auctions/{id}/cancel` | `seller/…`, `admin/AuctionAdminController` |
| FR-57 Manage Auctions | Admin | `GET /api/v1/admin/auction/auctions` | `admin/AuctionAdminController` |

### 5.13 Notification — `nexus-notification`
| FR | Actor | Method + Path | Controller |
|---|---|---|---|
| FR-49 Create Notification | System | `POST /api/v1/notification/notifications` (nội bộ, gọi từ module khác sau này) | `common/NotificationController` |
| FR-50 View Notifications | all | `GET /api/v1/notification/notifications` (+ `?unreadOnly=true`), `GET /{id}` | `common/NotificationController` |
| FR-51 Mark as Read | all | `PATCH /api/v1/notification/notifications/{id}/read`, `PATCH /api/v1/notification/notifications/read-all` | `common/NotificationController` |

---

## 11. NHỮNG ĐIỀU **KHÔNG** ĐƯỢC LÀM

1. Không thêm entity/field **ngoài** danh sách ở §2 và §10. Cần thêm → báo lại.
2. Không tạo: `AuctionRegistration`, `InventoryReservation`, `InventoryMovement`, `OrderStatusHistory`, `seller_payouts`, `event_logs`, `Product.allowAuction`, `AuctionSettlement.paymentDeadline`, `Notification.channel`, entity `Address`.
3. Không `bid_increment`; luật bid là **`amount > currentPrice`** (FR-30). Bid đầu tiên phải `>= startingPrice`.
4. `OrderStatus` **không có** `PAID`: chỉ `PENDING, CONFIRMED, SHIPPING, COMPLETED, CANCELLED`.
5. Không anti-sniping, không reputation, không deposit, không circuit breaker, không Kafka.
6. Không hard delete: Order, Payment, Bid, Inventory, Shipment, User (dùng `status`/`deleted_at`).
7. Không trả entity ra REST; không trả `Page<T>`; không nhận `userId` từ client.
8. Không viết lại `GlobalExceptionHandler`, `PageResponse`, `ApiError` trong module.
9. Không đổi version trong `pom.xml` (Java 21, Boot 4.1.1, springdoc 3.1.1).
10. Không `ddl-auto=create`, `create-drop`, `DROP`, `TRUNCATE` — đặc biệt trên Supabase.

---

## 12. CHECKLIST NGHIỆM THU MỘT MODULE

- [ ] `pom.xml` khai báo `nexus-common` (không khai báo module nghiệp vụ khác).
- [ ] Mọi entity có `@Table(schema = "nexus_<module>")` và `extends BaseEntity` (trừ khoá ghép).
- [ ] Không có annotation quan hệ JPA trỏ sang module khác.
- [ ] Không có field `passwordHash`/`deletedAt`/`version` trong DTO response.
- [ ] Mọi endpoint list trả `PageResponse<T>`; mọi list nhận `Pageable`.
- [ ] Mọi controller có `@Tag` + `@Operation(summary = "FR-xx ...")` + `@PreAuthorize`.
- [ ] Service interface + impl; có `@Transactional` đúng chỗ.
- [ ] Mapper viết tay (static, final class).
- [ ] `mvn -q -pl <module> -am compile` chạy xanh, không warning nghiêm trọng.
- [ ] Có ít nhất 1 unit test cho service chính (Mockito, không cần DB).

---

## 13. SPRING BOOT 4 — CÁC ĐIỂM **ĐÃ KIỂM CHỨNG THỰC TẾ**

> Các kết luận dưới đây được đọc trực tiếp từ jar/POM trong local repository, **không suy đoán**. Phần compile của probe build đã chạy xanh với đúng cấu hình này.

| # | Thay đổi của Boot 4 | Viết ĐÚNG trong dự án này |
|---|---|---|
| 1 | `spring-boot-starter-web` **không còn tồn tại** | dùng **`spring-boot-starter-webmvc`** |
| 2 | Boot 4 dùng **Jackson 3** (`tools.jackson.core:jackson-databind:3.1.5`) | import `tools.jackson.databind.ObjectMapper`. **KHÔNG** import `com.fasterxml.jackson.*` (Jackson 2) |
| 3 | Tách starter test theo công nghệ | `spring-boot-starter-webmvc-test` (cho `@WebMvcTest`), `spring-boot-starter-data-jpa-test` (cho `@DataJpaTest`), `spring-boot-starter-security-test` |
| 4 | `@WebMvcTest` đổi package | `org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest` |
| 5 | `@DataJpaTest` đổi package | `org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest` |
| 6 | `@SpringBootTest` giữ nguyên | `org.springframework.boot.test.context.SpringBootTest` |
| 7 | `@MockBean` đã bị bỏ | dùng `@MockitoBean` — `org.springframework.test.context.bean.override.mockito.MockitoBean` |
| 8 | Từ **JDK 23**, javac không tự chạy annotation processor trên classpath | `annotationProcessorPaths` cho Lombok **đã khai báo sẵn ở parent POM — KHÔNG được xoá**, nếu xoá thì Lombok không sinh getter/builder và mọi module lỗi compile |
| 9 | `@WebMvcTest` **không** nạp `@Configuration` của dự án | `@PreAuthorize` không có tác dụng trong slice → xem §14 |
| 10 | Session `STATELESS` + `@WithMockUser` | `@WithMockUser` không được nạp vào SecurityContext; phải dùng `SecurityMockMvcRequestPostProcessors.user(...)` |

---

## 14. CHIẾN LƯỢC TEST (bắt buộc theo)

1. **Test nghiệp vụ — loại test chính:** `@ExtendWith(MockitoExtension.class)`, thuần Mockito, **không** Spring context, **không** DB. Mỗi service phải có.
2. **Test mapper:** JUnit thuần.
3. **Test HTTP / phân quyền:** chỉ khi thật cần — `@SpringBootTest(webEnvironment = RANDOM_PORT)` và gọi API bằng token thật lấy từ `/api/v1/auth/login`.
4. **Không** dùng `@DataJpaTest` ở giai đoạn này (máy dev không có PostgreSQL local/Docker). Bổ sung sau khi có DB.
5. Mỗi module đặt file `src/test/resources/mockito-extensions/org.mockito.plugins.MockMaker` với nội dung `mock-maker-subclass`. Lý do: một số môi trường (kể cả máy build hiện tại) chặn cơ chế Mockito tự gắn agent vào JVM; trên máy bình thường có thể xoá file này.

---

## 15. MẪU `pom.xml` CHO MỘT MODULE NGHIỆP VỤ

```xml
<parent>
    <groupId>com.nexus</groupId>
    <artifactId>nexus-parent</artifactId>
    <version>1.0.0-SNAPSHOT</version>
</parent>
<artifactId>nexus-catalog</artifactId>

<dependencies>
    <dependency><groupId>com.nexus</groupId><artifactId>nexus-common</artifactId></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-webmvc</artifactId></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-data-jpa</artifactId></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-validation</artifactId></dependency>
    <dependency><groupId>org.projectlombok</groupId><artifactId>lombok</artifactId><optional>true</optional></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-test</artifactId><scope>test</scope></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-webmvc-test</artifactId><scope>test</scope></dependency>
    <dependency><groupId>org.springframework.security</groupId><artifactId>spring-security-test</artifactId><scope>test</scope></dependency>
</dependencies>
```

- **Không** cần khai báo `spring-boot-starter-security`: đã có sẵn qua `nexus-common` (compile scope) nên `@PreAuthorize` dùng được.
- **Không** khai báo module nghiệp vụ khác.
- **Không** khai báo version (parent đã quản lý).

---

## 16. ĐẶC TẢ ENTITY — NGUỒN SỰ THẬT DUY NHẤT

Quy ước chung: mọi entity (trừ bảng khoá ghép) `extends BaseEntity` → có sẵn `id`, `createdAt`, `updatedAt`.
Kiểu: `UUID` cho khoá và tham chiếu chéo module, `BigDecimal(precision=19, scale=2)` cho tiền, `Instant` cho thời gian, `LocalDate` cho ngày.

### nexus-user — schema `nexus_user`
| Bảng | Cột |
|---|---|
| `users` | `email` (unique, not null), `username` (unique, not null), `phone`, `full_name` (not null), `identity_number`, `gender` (enum `Gender`: MALE/FEMALE/OTHER), `address`, `date_of_birth` (LocalDate), `password_hash` (not null), `status` (enum `UserStatus`: ACTIVE/INACTIVE/BANNED), `deleted_at` |
| `roles` | `code` (unique, not null — BUYER/SELLER/ADMIN), `name` (not null), `description` |
| `user_roles` | khoá ghép `(user_id, role_id)` bằng `@EmbeddedId UserRoleId`; `@ManyToOne User user`, `@ManyToOne Role role`; `assigned_at` |

### nexus-catalog — schema `nexus_catalog`
| Bảng | Cột |
|---|---|
| `categories` | `name` (not null), `description`, `parent_id` (UUID nullable — tự tham chiếu), `status` (enum `CategoryStatus`: ACTIVE/INACTIVE), `sort_order` |
| `products` | `seller_id` (not null), `category_id` (nullable), `name` (not null), `description`, `base_price` (not null), `status` (enum `ProductStatus`: DRAFT/ACTIVE/INACTIVE), `deleted_at` |
| `product_images` | `product_id` (not null), `image_url` (not null), `is_primary`, `sort_order` |
| `product_reviews` | `product_id`, `buyer_id`, `order_id` (nullable), `score` (1..5), `comment`, `status` (enum `ReviewStatus`: VISIBLE/HIDDEN) |

### nexus-fulfillment — schema `nexus_fulfillment`
| Bảng | Cột |
|---|---|
| `warehouses` | `code` (unique, not null), `name` (not null), `address`, `status` (enum `WarehouseStatus`: ACTIVE/INACTIVE) |
| `skus` | `product_id` (not null), **`seller_id` (not null — denormalized để lọc tồn kho theo Seller cho FR-13; xem ghi chú trong README)**, `sku_code` (unique, not null), `name`, `price` (nullable) |
| `inventories` | `sku_id` (not null), `warehouse_id` (not null), `total_quantity`, `available_quantity`, `status` (enum `InventoryStatus`: IN_STOCK/LOW_STOCK/OUT_OF_STOCK), `@Version version`; unique `(sku_id, warehouse_id)` |
| `shipments` | `order_id` (not null), `warehouse_id`, `seller_id`, `tracking_number`, `status` (enum `ShipmentStatus`: PENDING/SHIPPED/DELIVERED) |

### nexus-commerce — schema `nexus_commerce`
| Bảng | Cột |
|---|---|
| `carts` | `buyer_id` (not null), `status` (enum `CartStatus`: ACTIVE/CONVERTED/ABANDONED), `subtotal` |
| `cart_items` | `cart_id` (not null), `product_id` (not null), `sku_id` (nullable), `seller_id` (not null), `quantity`, `unit_price` |
| `orders` | `order_number` (unique, not null), `buyer_id` (not null), `seller_id` (not null — MVP: 1 order = 1 seller), `order_type` (enum `OrderType`: DIRECT/AUCTION), `status` (enum `OrderStatus`: PENDING/CONFIRMED/SHIPPING/COMPLETED/CANCELLED), `subtotal`, `discount`, `shipping_fee`, `total_amount`, `shipping_address` (not null), `receiver_name`, `receiver_phone`, `discount_code` (nullable) |
| `order_items` | `order_id` (not null), `product_id`, `sku_id`, `seller_id`, `product_name_snapshot`, `sku_code_snapshot`, `quantity`, `unit_price`, `subtotal` |
| `payments` | `order_id` (not null), `payment_method` (enum `PaymentMethod`: COD/BANK_TRANSFER/E_WALLET/MOCK), `payment_reference`, `amount`, `status` (enum `PaymentStatus`: PENDING/SUCCESS/FAILED), `idempotency_key` (unique, not null), `paid_at` |
| `seller_ratings` | `order_id`, `seller_id`, `buyer_id`, `score` (1..5), `comment`, `status` (enum `RatingStatus`: VISIBLE/HIDDEN) |
| `promotion_campaigns` | `name` (not null), `description`, `start_date` (LocalDate), `end_date` (LocalDate), `status` (enum `CampaignStatus`: DRAFT/ACTIVE/ENDED) |
| `discount_codes` | `campaign_id` (nullable), `code` (unique, not null), `discount_type` (enum `DiscountType`: PERCENTAGE/FIXED_AMOUNT), `discount_value`, `min_order_amount`, `usage_limit`, `used_count`, `start_at` (Instant), `end_at` (Instant), `status` (enum `DiscountCodeStatus`: ACTIVE/INACTIVE) |

### nexus-auction — schema `nexus_auction`
| Bảng | Cột |
|---|---|
| `auctions` | `product_id` (not null), `seller_id` (not null), `starting_price` (not null), `current_price` (not null), `highest_bidder_id` (nullable), `start_time` (not null), `end_time` (not null), `status` (enum `AuctionStatus`: SCHEDULED/ACTIVE/ENDED/CANCELLED), `@Version version` |
| `bids` | `auction_id` (not null), `bidder_id` (not null), `amount` (not null), `status` (enum `BidStatus`: ACCEPTED/REJECTED — FR-30), `placed_at` |
| `auction_settlements` | `auction_id` (not null), `winner_id` (nullable), `order_id` (nullable), `final_price` (nullable), `status` (enum `SettlementStatus`: WON/FAILED/NO_BIDS), `settled_at` |

### nexus-notification — schema `nexus_notification`
| Bảng | Cột |
|---|---|
| `notifications` | `user_id` (not null), `event_type` (enum `NotificationEventType` — 23 giá trị theo FR-49), `title` (not null), `content`, `reference_type`, `reference_id` (UUID nullable), `is_read` (not null, default false), `read_at` (nullable) |

**`NotificationEventType` — đúng 23 giá trị theo FR-49:**
`USER_REGISTERED, PRODUCT_CREATED, PRODUCT_UPDATED, CART_ITEM_ADDED, CART_ITEM_UPDATED, CART_ITEM_REMOVED, ORDER_CREATED, ORDER_PAID, ORDER_PAYMENT_FAILED, ORDER_COMPLETED, ORDER_CANCELLED, AUCTION_CREATED, AUCTION_STARTED, BID_PLACED, OUTBID, AUCTION_CANCELLED, AUCTION_ENDED, AUCTION_WON, AUCTION_FAILED, SHIPMENT_CREATED, SHIPMENT_DELIVERED, REVIEW_RECEIVED, SYSTEM_ANNOUNCEMENT`

