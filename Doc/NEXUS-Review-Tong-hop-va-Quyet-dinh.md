# PROJECT NEXUS — TỔNG HỢP & HƯỚNG ĐI CHUẨN
### Review độc lập của Senior Software Architect — không mặc định đồng ý với Claude hay GPT

> **v1.1 — 07/10/2026 (đính chính v1.0).** v1.0 đã lấy ràng buộc từ **SRS đầy đủ của thầy** (anti-sniping, reputation gate, reservation, Stripe…) để khuyến nghị. Đó là sai baseline: yêu cầu cam kết của nhóm là **`scope.xlsx` — 59 FR (FR-01…FR-59)**, không phải toàn bộ SRS. Xem §0.1 để biết cái gì thuộc baseline và cái gì không.
>
> Nguồn đối chiếu: **`scope.xlsx` (baseline 59 FR)**, `ERD.drawio.png` (06/10), `Doc/project_nexus_sql_database_design.md` (27/09), `Doc/OJT-Team1-Backlog-Plan.xlsx` (01/10), `Form/srs-nexus-ecommerce-auction-v1.docx` (SRS đầy đủ — chỉ dùng để truy vết), `Doc/srs_nexus_comprehensive_analysis.md`.
> Phương pháp: đọc trực tiếp artifact gốc trong repo, không tin bản tóm tắt; kiểm chứng phiên bản bằng nguồn chính thức.

---

## 0. SÁU KẾT LUẬN LỚN (đọc cái này trước)

1. **Cuộc tranh luận GPT ↔ Claude đang giải một bài toán khác với kế hoạch nhóm đã cam kết.** Tranh luận giả định *6 microservice riêng biệt, Supabase, 2–3 sinh viên*. Kế hoạch thật (`OJT-Team1-Backlog-Plan.xlsx`, 01/10) là **1 dự án Spring Boot, 5 người (3 BE + 2 FE), 5 sprint 28/09→04/12/2026, thanh toán COD, không Notification service, không Review**. Cả hai AI đều không thấy file này.
2. **Bạn đang có 4 artifact mô tả 4 phiên bản khác nhau của cùng hệ thống:** `scope.xlsx` (59 FR — baseline yêu cầu), `ERD.drawio.png`, file SQL DDL, và bản tóm tắt trong hồ sơ tranh luận. ERD ảnh vs SQL DDL lệch nhau **~25 field**. Phần lớn các "ERD gap" đang tranh cãi là **tranh cãi trên bản tóm tắt sai**, không phải trên thiết kế thật.
3. **Hồ sơ tranh luận có lỗi sự kiện:** mục 3 nói `AuctionRegistration` "thiếu auction_id và bidder_id". **Sai** — ERD ảnh có đủ `auction_id (FK)` và `user_id (REF)`. Nhưng `AuctionRegistration`/đặt cọc **không có trong 59 FR** ⇒ bỏ là đúng, chỉ cần bỏ vì lý do đúng.
4. **Phát hiện nặng nhất: Scope Matrix của Claude hạ cấp 19 FR đang có trong baseline.** 5.11 Rating & Review (FR-41–45) → COULD; 5.12 Promotion Campaign (FR-46) → CUT; 5.13 Notification (FR-49–51) → SHOULD rút còn 5/23 event; 5.14 Admin (FR-52–59) → cắt. **19/59 FR = 32% phạm vi cam kết** bị đẩy ra khỏi MVP. Ngoài ra Claude còn **thêm** luật không có trong baseline: `bid_increment`, và phủ định `Bid.status` (FR-30 lại ghi ACCEPTED/REJECTED). Ngược lại, chỗ Claude nói "không thêm PAID vào OrderStatus" là **đúng theo FR-24**.
5. **Phiên bản: Claude đúng, GPT sai, nhưng phương án dự phòng của Claude cũng sai.** Đúng: `Spring Boot 4.1.x + Java 21`. Sai khi nói "nếu vướng thì lùi về Boot 3.5.x" — Boot 3.5 đã **hết hỗ trợ OSS từ 30/06/2026**. Dự phòng đúng phải là `Boot 4.0.x` (hỗ trợ tới 31/12/2026).
6. **Tính khả thi: với 5 người thì được, với 2–3 người thì không.** Kế hoạch 5 người đang ở mức **106/125 dev-day = 85%, buffer 0,096%** — không có chỗ cho một tuần ốm. Phải cắt ~20 dev-day, nhưng **cắt theo chiều sâu (depth), không cắt FR** — vì 59 FR là phạm vi đã cam kết.

### 0.1 BASELINE YÊU CẦU: `scope.xlsx` — 59 FR, 14 nhóm

| Nhóm | FR | Nội dung cam kết |
|---|---|---|
| 5.1 Account | FR-01–04 | Register, **Login/Logout (tạo token)**, Profile (+Address), Admin quản lý user |
| 5.2 Product | FR-05–08 | Create product (name, description, **base price**, category, **SKU, initial inventory**, image), View, Update, Delete/deactivate |
| 5.3 Category | FR-09–10 | Admin CRUD category (có **parent**), **Assign product to category** |
| 5.4 Search | FR-11–12 | Search theo name/category/price; filter/sort (giá ↑, giá ↓, mới nhất) |
| 5.5 Inventory | FR-13–14 | Xem/sửa tồn kho cấp SKU (Total/Available/Status), **không cho âm** |
| 5.6 Cart | FR-15–18 | 1 active cart/buyer, add (validate product + inventory), update, remove |
| 5.7 Checkout & Payment | FR-19–21 | Checkout (shipping address + payment method + review + confirm), **Discount code (không áp cho Auction)**, Payment Provider → Success/Failed/Pending |
| 5.8 Order | FR-22–25 | Tạo order từ Direct **hoặc Auction Winner**; xem; **PENDING→CONFIRMED→SHIPPING→COMPLETED (+CANCELLED)**; cancel (cập nhật lại inventory) |
| 5.9 Auction | FR-26–37 | Create/Configure (không sửa sau ACTIVE)/View/List; Place Bid (**> current highest**, ACCEPTED/REJECTED); Bid history; **Outbid detection**; **Auction Start/End theo thời gian**; Winner (Won/Failed); **Create Auction Order**; Cancel |
| 5.10 Shipment | FR-38–40 | Shipment sau khi **payment thành công**; PENDING→SHIPPED→DELIVERED; Buyer xem tracking (**không làm carrier thật**) |
| 5.11 Rating & Review | FR-41–45 | Rate Product (1–5 + comment), Review Product, Rate Seller, Review Seller, **Moderate Reviews (Admin)** |
| 5.12 Promotion | FR-46–48 | **Create Promotion Campaign**, Manage Discount Code (value, usage limit, disable), Apply at checkout (Direct only) |
| 5.13 Notification | FR-49–51 | In-app only; **23 event được liệt kê tên**; view (kể cả unread); mark one / mark all as read |
| 5.14 Admin | FR-52–59 | Manage Users/Products/Categories, Monitor Inventory, Manage Orders, Manage Auctions, **Manage Promotions**, **Moderate Reviews** |

**Không nằm trong baseline (chỉ có trong SRS đầy đủ của thầy — không phải nghĩa vụ của nhóm):**
anti-sniping (`ANTI_SNIPING_EXTENSION_MINUTES=5`) · đặt cọc / `AuctionRegistration` · reputation gate (`MIN_REPUTATION_TO_BID=40`, `MIN_REPUTATION_TO_SELL=50`) · `bid_increment` · inventory reservation + `ALLOW_OVERSELL=false` · `idempotency_key` / webhook Stripe · `AUCTION_PAYMENT_DEADLINE_HOURS=24` · `CATEGORY_MAX_LEVEL=3` · `MAX_PRODUCT_IMAGES=5` · cart hết hạn 7 ngày · checkout timeout 15' · Adapter GHN/GHTK + circuit breaker + `SHIPPING_API_TIMEOUT_MS` · SLA ≤300ms / 3000 bids phút · RTO/RPO.

> Các mục trên **không phải làm**. Chúng chỉ có giá trị như "câu trả lời thêm" khi hội đồng hỏi sâu về SRS — và chỉ làm nếu **còn budget**, không được lấy chỗ của FR.
> Ngược lại, đừng để bị hỏi ngược: nếu ai đó hỏi "sao không làm anti-sniping?", câu trả lời là "nằm ngoài 59 FR nhóm đã chốt với giảng viên; SRS gốc có, MVP thì không" — và nên **có một câu ghi chú như vậy trong báo cáo**.

**Một câu chốt:** đừng dành thêm thời gian cho cuộc tranh luận AI. Việc cần làm là **đóng băng một artifact thiết kế duy nhất** (đối chiếu với 59 FR) rồi bắt tay code, vì theo danh sách file trong repo, tính đến 06/10 **chưa có một dòng code nào** trong khi S1 (28/09–09/10) đã gần hết.

---

## 1. BỐN NGUỒN SỰ THẬT XUNG ĐỘT

| # | Artifact | Ngày | Vai trò thực tế | Mức chi tiết |
|---|---|---|---|---|
| 0 | **`scope.xlsx`** | 30/09 | **BASELINE YÊU CẦU — 59 FR, 14 nhóm** | Đầy đủ, có FR ID; là thứ phải đối chiếu |
| A | `ERD.drawio.png` | 06/10 | Hình vẽ mới nhất, hồ sơ coi là source of truth | Chỉ có tên field, ~28 bảng |
| B | `Doc/project_nexus_sql_database_design.md` | 27/09 | **DDL PostgreSQL chạy được** + ma trận 31 quan hệ | Chi tiết nhất, ~30 bảng |
| C | Hồ sơ tranh luận GPT↔Claude | 06/10 | Bản tóm tắt ERD dạng text | Không khớp A lẫn B |

### 1.1 Đối chiếu A vs B (trích các điểm chênh quan trọng)

| Hạng mục | ERD ảnh (A) | SQL design (B) | Baseline nói gì (scope.xlsx) | ⇒ Chốt |
|---|---|---|---|---|
| `Product.categoryId` | **Không có cột**, chỉ có đường nối nhãn `classifies` | **Có** `category_id REFERENCES categories(id)` | FR-10 Assign Product to Category ⇒ **bắt buộc** | Giữ B. Claude đòi "thêm required" — B đã có sẵn; A mới là cái thiếu |
| Giá sản phẩm | `Product.basePrice` | **Không có** `basePrice`; giá ở `skus.price NOT NULL` | FR-05: product có "Base price"; FR-13 inventory view **không** hiển thị giá | **A đúng theo baseline.** B đã over-engineer (định giá theo biến thể) — thêm sau |
| `Product.name` | `name` | `title` | FR-05 "Product name" | Chọn `name` |
| `Product.allowAuction` | Không có | **Có** `allow_auction BOOLEAN` | FR-26 chỉ cần check "product chưa có active auction" — không cần cột này | Cắt khỏi Release 1 |
| `Category` | `parentCategoryId`, `status` | `parent_id`, `code UNIQUE`, `sort_order`, **không status** | FR-09: parent + delete/**deactivate** ⇒ cần `status` | Hợp nhất: `parent_id` + `status` + `sort_order` |
| `SKU` | `sku_id, product_id, sku_code, name` | `id, product_id, sku_code, attributes JSONB, price` (**không `name`**) | FR-05: product kèm SKU; FR-13 hiển thị SKU | Giữ `name`; `attributes` hoãn |
| `Inventory` | `total/available/reserved/unavailable_quantity` | `total_quantity, reserved_quantity` + `UNIQUE(sku,warehouse)` | FR-13: **Total quantity + Available quantity + Status**; FR-14 không cho âm | Cần `total_quantity`, `available_quantity`, `status`. `reserved`/`unavailable` không có trong baseline → cắt |
| `InventoryReservation` | `inventory_id` | `sku_id` + `warehouse_id` | **Không có FR nào** | **Bỏ** khỏi Release 1 |
| `InventoryMovement` | **Có** | **Không có** | Không có FR | **Bỏ** |
| `Shipment` | `carrier, service_type, status, tracking_number` | `carrier_code`, **không `service_type`**, `status DEFAULT 'CREATED'` | FR-39/40: PENDING→SHIPPED→DELIVERED + tracking number, **không carrier thật** | Bỏ `carrier`/`service_type`; giữ `tracking_number`, `status` |
| `Cart` | `subtotal, tax, discount, estimatedShippingFee, expiresAt` | Chỉ `status, created, updated` | FR-15/17: 1 active cart, **recalculate subtotal**. Không có thuế/expiry/ship-fee-estimate | Giữ `subtotal`; `tax`/`expiresAt`/`estimatedShippingFee` **hoãn**; `discount` chỉ cần khi apply code |
| `CartItem` | `productId, skuId, quantity, unitPrice` | `sku_id, quantity, price_snapshot` | FR-16/17 | Chọn B (`price_snapshot` đúng nghĩa) |
| `Order` | `orderNumber, tax, discount, totalAmount, shippingAddressId` | **Không `orderNumber`**, không tax/discount, `shipping_address TEXT NOT NULL`, **có `order_type`** | FR-22: Order lưu Buyer, Items, Quantity, Price, **Discount, Shipping fee, Total, Status**; FR-36 `order_type = AUCTION`; FR-19 shipping address | **B đúng** (snapshot); A sai vì `shippingAddressId` mất snapshot. Nhưng **B thiếu `discount`** — FR-22 yêu cầu |
| `OrderItem` | `productId, skuId, sellerId, subtotal` | `sku_id, product_name_snapshot, sku_code_snapshot, unit_price` — **không `seller_id`** | FR-23: **Seller xem incoming orders** ⇒ phải biết order thuộc seller nào | **Thêm `orders.seller_id`** (xem §3.2) |
| `Payment` | `paymentReference, paymentMethod, paidAt` | `payment_provider, transaction_id, idempotency_key UNIQUE` | FR-21: payment method, provider trả Success/Failed/**Pending**, cập nhật Payment **và Order** | Hợp nhất; `idempotency_key` giữ vì **miễn phí** (1 cột), không phải vì baseline đòi |
| `OrderStatusHistory` | **Có** | **Không có** | Không có FR | **Bỏ** |
| `seller_payouts` | Không có | **Có** | Không có FR (FR-56 chỉ "handle order issues") | **Bỏ** |
| `event_logs` | Không có | **Có** | Không có FR | **Bỏ** |
| `Rating` | **Có**, ở **User Service**, có `transactionId` | **Không có bảng nào** | FR-41–45: rate/review **Product** và **Seller**, có moderate | **Sai vị trí** — xem §3.2. Tách 2 entity |
| `ProductReview` | Không có | Không có | FR-41/42 | **Phải có** (Claude xếp COULD — sai baseline) |
| `PromotionCampaign` | Không có | Không có | FR-46, FR-58: **Create Promotion Campaign** | **Phải có** (Claude CUT — sai baseline) |
| `DiscountCode` | Không có | Không có | FR-47/48/58 | **Phải có** |
| `Notification` | `event_type, title, content, created_at` | `channel (EMAIL/PUSH), title, content, status` | FR-49–51: **in-app**, 23 event, unread, mark one/all | Cần `is_read`/`read_at`; **bỏ `channel`** |
| `Auction` | `product_id, seller_id` | thêm `sku_id`, `created_at`, `updated_at` | FR-26: Seller chọn **Product** (không phải SKU) | Giữ `product_id`; `sku_id` chỉ để tra tồn kho — cân nhắc |
| `AuctionSettlement` | `winner_id, order_id, final_price, settled_at, status` | thêm `payment_deadline TIMESTAMP NOT NULL` | FR-35/36: winner → order. **Không có FR nào về hạn trả tiền** | Bỏ `payment_deadline` (v1.0 của tôi khuyên giữ — sai baseline) |
| `AuctionRegistration` | **Có** (đủ khoá: auction_id FK, user_id REF, deposit_amount, …) | **Không có** | **Không có FR nào** | **Bỏ** — đúng, nhưng vì không thuộc baseline |
| `User` | `address`, không `updated_at/deleted_at` | `address`, `updated_at`, `deleted_at` | FR-03: profile có **Address**; FR-04 deactivate account | B đúng hơn |
| `Address` (entity riêng) | Không có | Không có | FR-03 chỉ 1 field Address trong profile; FR-19 nhập shipping address khi checkout | **KHÔNG cần entity Address** — Claude đòi "required" là vượt baseline |

### 1.2 Hệ quả

- **Cuộc tranh luận mục 7–8 phần lớn là "đánh nhau với bản tóm tắt".** GPT bắt Claude xin duyệt để thêm `Product.categoryId` — file SQL trong repo đã có từ 27/09, và FR-10 bắt buộc nó.
- **Nguy hiểm thật không nằm ở ERD mà ở việc không có nguồn sự thật.** Nếu 3 BE cùng code theo 3 cách hiểu về giá, tồn kho, rating thì tới Sprint 3 sẽ conflict không cứu được.
- **Cách chốt đúng:** lấy **`scope.xlsx` làm baseline yêu cầu**, lấy **file SQL DDL (B) làm baseline triển khai**, sửa B cho khớp baseline ở các điểm ở §1.1, rồi **sinh ERD mới từ chính DDL đó**, đánh version `ERD-v1.0-frozen`. Khai tử `ERD.drawio.png` cũ hoặc cập nhật nó cho khớp — đừng để 2 file cùng tồn tại.

---

## 2. MỤC 7–8: AI NÀO ĐÚNG/SAI Ở TỪNG ĐIỂM

| # | Điểm tranh luận | Phán quyết | Lý do ngắn |
|---|---|---|---|
| 1 | **ERD là source of truth, không được tự thêm/xoá** (GPT #1) | **GPT đúng về quy trình** | Nhưng "source of truth" phải là **`scope.xlsx` (59 FR)**, ERD chỉ là bản vẽ của nó. Không có gate thì 3 BE tự bịa field |
| 2 | **ERD gốc không đủ, phải sửa** (Claude) | **Claude đúng về sự kiện, sai về phạm vi** | Đúng: `Product.categoryId` (FR-10), `orderType` (FR-36), `isRead` (FR-51). **Sai:** đòi entity `Address` (FR-03 chỉ cần 1 field trong profile + snapshot ở Order) |
| 3 | **Không thêm `SKU.sellerId`** (GPT #2) | **GPT đúng** | Product đã có `seller_id`; seller của SKU không bao giờ khác seller của Product |
| 4 | **"Duplicate source of truth" là quá tay** (Claude 8.1) | **Claude đúng một nửa** | Trong microservice, sao chép thuộc tính gần như bất biến là pattern hợp lệ; ở đây không cần nên kết luận vẫn là không thêm |
| 5 | **`Bid.status` là thừa, bid sai chỉ cần trả 400** (Claude 8.1) | **Claude SAI — đối chiếu FR-30** | FR-30 ghi rõ: hợp lệ → `Bid → ACCEPTED`, không hợp lệ → `Bid → REJECTED`. Baseline nêu tên cả hai kết quả ⇒ có `status` (1 cột + enum, ~15 phút). Nếu vẫn muốn trả 400 thì **ghi rõ đây là deviation** |
| 6 | **Không thêm PAID vào OrderStatus** (Claude 8.1/8.3) | **Claude ĐÚNG — và v1.0 của tôi sai** | FR-24 liệt kê đúng: `PENDING → CONFIRMED → SHIPPING → COMPLETED`, có `CANCELLED`. Không có PAID. FR-38 "sau khi payment thành công" ⇒ gate shipment bằng `Payment.status = SUCCESS`, **không** bằng order status |
| 7 | **Luật bid `amount >= currentPrice + bidIncrement`** (Claude, phụ lục) | **Claude THÊM luật không có trong baseline** | FR-30 chỉ yêu cầu `Bid amount > Current Highest Bid`. `bid_increment` không xuất hiện ở bất kỳ FR nào. (Bid đầu tiên ≥ starting price là suy luận hợp lý nhưng **nên xác nhận với giảng viên**) |
| 8 | **Không JPA relationship xuyên service** (cả hai) | **Cả hai đúng** | Nhưng cả hai **bỏ sót** mâu thuẫn nội bộ trong ERD ảnh: `InventoryReservation.inventory_id` (A) vs `sku_id + warehouse_id` (B); `Rating.transactionId` trỏ tới entity **không tồn tại** ở bất kỳ service nào |
| 9 | **Java 22 sai** (Claude 8.1) | **Claude đúng** | Java 22 non-LTS, hết hỗ trợ 09/2024. Nhưng đích đúng thì cả hai vẫn chưa chốt — xem §6 |
| 10 | **Chia 4 phase A–D cho TỪNG service = 24 điểm dừng, quá nặng** (Claude 8.2) | **Claude đúng về kinh tế, GPT đúng về kỷ luật** | **Hướng thứ ba:** gate theo **phase toàn dự án** — Gate Entity → Gate CRUD → Gate Business Logic ⇒ 3–4 điểm dừng, vẫn giữ kỷ luật review |
| 11 | **Thứ tự User→Catalog→Fulfillment→Commerce→Auction vô nghĩa ở CRUD** (Claude 8.2) | **Đúng ở CRUD, sai ở business logic** | Khi tích hợp, thứ tự bắt buộc theo hướng phụ thuộc; dùng nó để **chia việc song song** |
| 12 | **`Inventory.skuId` có phải cross-service?** (GPT hỏi) | **Claude đúng** | SKU và Inventory cùng Fulfillment ⇒ JPA relationship thật. Cross-service thật là `SKU.product_id` |
| 13 | **"ERD không bao giờ được đổi" là quá cứng** (Claude 8.2) | **Claude đúng** | ERD là bản vẽ; nhưng mỗi thay đổi phải truy vết (ai duyệt, ngày, vì FR nào) |
| 14 | **Ví dụ lỗi tự mâu thuẫn `VALIDATION_ERROR` vs `BAD_REQUEST`** (Claude 8.2) | **Claude đúng** | Lỗi nhỏ nhưng thật. Fix: một `ErrorCode` enum + một `ApiError` contract |
| 15 | **6 service trong 10 tuần là rủi ro scope lớn** (Claude 8.2) | **Claude đúng — điểm quan trọng nhất của cuộc tranh luận** | Xem §5 và §7.1 |

### 2.1 Những gì CẢ HAI cùng bỏ sót (phần giá trị nhất của review này)

1. **Không ai đối chiếu với 59 FR.** Claude hạ cấp 19 FR đang có trong baseline (§0 điểm 4, §3.3) và thêm 1 luật không có trong baseline (`bid_increment`), đồng thời phủ định một field mà FR-30 nêu tên (`Bid.status`). Đây là lỗi nặng hơn mọi lỗi ERD đang tranh cãi.
2. **`OrderItem`/`Order` thiếu `seller_id`.** FR-23 yêu cầu **Seller xem incoming orders**, nhưng không có chỗ nào lưu seller của order. Không có nó thì: không hiện được danh sách đơn cho Seller, không validate được giỏ chỉ chứa hàng 1 seller, không tách shipment theo seller.
3. **`Rating` đặt sai service.** `Rating` nằm ở **User Service** nhưng `transactionId` chỉ **Commerce** xác thực được ("Order = COMPLETED" theo FR-41) ⇒ User (service nền tảng) phải gọi ngược Commerce. FR-41–45 lại cần **2 đối tượng** (Product và Seller) ⇒ phải là 2 entity ở 2 service.
4. **`Product.basePrice` vs `skus.price`.** File SQL DDL — thứ tôi khuyên dùng làm baseline triển khai — **lệch baseline**: FR-05 để giá ở Product, DDL bỏ `basePrice` và đặt giá ở SKU. Phải sửa DDL, nếu không FR-06 (product detail hiển thị price) sẽ phải gọi sang Fulfillment để lấy giá.
5. **FR-05 là một giao dịch xuyên module** (tạo Product + SKU + tồn kho ban đầu) và không có FR nào mô tả cách xử lý khi bước 2 thất bại. Cả hai AI bỏ qua; đây là chỗ "1 app + 1 DB" cứu được rất nhiều (§7.1).
6. **FR-25 (cancel order phải cập nhật lại inventory)** và **FR-36 (tạo order từ auction)** cũng là giao dịch xuyên module — cùng loại vấn đề.
7. **Rủi ro trùng email sau soft delete.** `users.email UNIQUE` + `deleted_at` ⇒ email của user đã xoá mềm khoá vĩnh viễn không cho ai đăng ký lại (FR-01 "Email/username không được trùng" không có nghĩa là khoá vĩnh viễn).
8. **Postgres không tự đánh index cho FK.** Không có index trên `order_items.order_id`, `bids.auction_id`, `cart_items.cart_id`… sẽ ảnh hưởng câu hỏi "hiệu năng" của hội đồng. Thêm index là 6 dòng SQL.
9. **`TIMESTAMP` không có timezone** — dùng `TIMESTAMPTZ` + `Instant` thống nhất; `CURRENT_TIMESTAMP` không tự cập nhật `updated_at` (cần `@PreUpdate`).
10. **Enum lưu `VARCHAR(20)` không có `CHECK`** — garbage data sẽ lọt vào cột status (FR-24/FR-39 yêu cầu chuyển trạng thái hợp lệ).

---

## 3. LỖI & RỦI RO CÒN SÓT

### 3.1 ERD
Xem bảng §1.1. Bổ sung 4 lỗi thiết kế:
- **`Payment` cho phép nhiều bản ghi SUCCESS trên một order.** Thêm partial unique index `UNIQUE (order_id) WHERE status = 'SUCCESS'` (FR-21 chỉ cần 1 giao dịch thành công).
- **`users.email` UNIQUE + soft delete** (mục 2.1.7).
- **`auction_settlements.status` thiếu nhánh `FAILED/NO_BIDS`** — FR-35 yêu cầu `AuctionFailed`.
- **`bids` thiếu index `(auction_id, amount DESC)`** — FR-28/FR-31 hiển thị current highest bid và bid history.

### 3.2 Address / Review / Seller
- **Address:** `users.address` (1 field, theo FR-03) + **`orders.shipping_address` dạng snapshot** khi checkout (FR-19). **Không cần entity `Address`** — Claude đòi thêm là vượt baseline. Snapshot là bắt buộc về mặt thiết kế: sửa địa chỉ profile không được viết lại lịch sử đơn cũ.
- **Review:** FR-41/42 (Product) → `product_reviews` ở **Catalog**; FR-43/44 (Seller) → `seller_ratings` ở **Commerce** (vì cần `order_id` để biết đã COMPLETED). Bỏ `Rating` khỏi User Service. FR-45/FR-59 (moderate) = 1 endpoint đổi `status` + 1 màn danh sách.
- **Shipment:** baseline không nói gì về order nhiều seller ⇒ **MVP giới hạn 1 seller/order** là quyết định hợp lý, nhưng phải **ghi vào tài liệu là giả định của nhóm** và cần `orders.seller_id` để kiểm chứng (FR-23).

### 3.3 Scope Matrix của Claude vs `scope.xlsx` — 19 FR lệch
| Nhóm FR trong baseline | Claude xếp | Đúng ra phải là | Ghi chú |
|---|---|---|---|
| 5.11 Rating & Review — FR-41–45 (kể cả **FR-45 Moderate Reviews**) | COULD + CUT "review moderation" | **SHOULD** (nếu thiếu thời gian: FR-41+43 trước, FR-42/44 comment sau, FR-45 = 1 endpoint đổi status) | Gắn với Problem 1 của đề bài ("Rating & review") |
| 5.12 Promotion Campaign — FR-46, FR-58 | **CUT** ("bỏ Campaign") | **SHOULD** — Campaign chỉ là 1 entity 5 field (name, start, end, status); FR-46/58 nêu đích danh | DiscountCode giữ nguyên |
| 5.13 Notification — FR-49–51, 23 event | SHOULD nhưng rút còn **5 event** | **SHOULD**, giữ **đủ danh sách event** (bảng + publisher in-process, rẻ) | Cắt event nào thì phải ghi rõ là deviation |
| 5.14 Admin — FR-52–59 (8 FR) | **Cắt "Admin riêng"** | **Giữ API Admin**, cắt **UI** (đúng như kế hoạch nhóm D05) | Cắt hẳn 8 FR = mất 14% phạm vi |
| 5.1 FR-02 Login tạo token | Hoãn JWT tới **tuần 9** | **Làm ở S1–S2** | FR-02 nêu đích danh "tạo authentication session/token"; mọi FR sau đều cần biết "ai đang gọi" |
| 5.9 FR-30 Place Bid | Áp `>= current + bidIncrement`; bỏ `Bid.status` | **`> current highest`**; có `status ACCEPTED/REJECTED` | Xem §2 hàng 5 và 7 |

> **19/59 FR = 32% phạm vi cam kết** đang bị đẩy khỏi MVP trong Scope Matrix. Nếu giảng viên chấm theo 59 FR, đây là rủi ro lớn hơn mọi lỗi kỹ thuật trong hồ sơ tranh luận.
> **Ngược lại, v1.0 của tôi cũng sai:** tôi khuyên làm anti-sniping, reputation gate, reservation, payment deadline, idempotency vì SRS — **không mục nào thuộc 59 FR**. Xem §0.1.

### 3.4 Kế hoạch 10 tuần — 4 vấn đề
1. **Lệch mốc thời gian thật.** Kế hoạch nhóm: S1 28/09–09/10, M0 09/10, M1 23/10, M2 06/11, M3 20/11, M4 (Demo Day) **04/12/2026**. Kế hoạch trong hồ sơ tranh luận không khớp ⇒ dùng **mốc thật**.
2. **Buffer bằng 0.** 106/125 dev-day (84,8%), "Buffer 0,096%". Ngưỡng an toàn: **≤ 70%**.
3. **Không có task nào cho: thiết kế DB + chốt ERD, Swagger/contract, môi trường/deploy, và báo cáo OJT.** Kiểm thử dồn vào E09 (S4–S5) — chính Risk R06 của nhóm đã cảnh báo.
4. **S1 sắp hết mà chưa có code trong repo** (chỉ có tài liệu). M0 (09/10) cần Spring Boot + React chạy được.

### 3.5 Lời gọi giữa service và rủi ro consistency (câu hỏi 3 của bạn)
**Đây là chỗ quyết định "1 app hay 6 app" trả cổ tức lớn nhất.** Baseline có 3 FR xuyên module:
- **FR-05** tạo Product + SKU + tồn kho ban đầu (Catalog + Fulfillment)
- **FR-25** cancel order phải **cập nhật lại inventory** (Commerce + Fulfillment)
- **FR-16** thêm vào giỏ phải kiểm tra tồn kho (Commerce + Fulfillment)

Nếu là **6 process riêng**, cả 3 trở thành bài toán distributed transaction: bạn nêu đúng rủi ro "trừ kho xong nhưng tạo order lỗi ⇒ mất hàng khỏi kệ mà không có đơn", và cách chữa (reservation + job bù trừ) **không nằm trong baseline** ⇒ phải tự thêm việc.
Nếu là **1 app + 1 Postgres**, cả 3 trở thành **một transaction nội bộ**: `BEGIN → insert order → update inventory → COMMIT`. Không cần reservation, không cần saga, không cần job bù trừ. Đánh đổi duy nhất: transaction chạm 2 schema, tức là **nới lỏng luật "DB per service" một chút** — và đây là đánh đổi **nên chấp nhận và ghi rõ trong báo cáo**, vì tiết kiệm ~1 tuần công.
Nếu vẫn muốn giữ vài "lời gọi liên service" để minh hoạ kiến trúc: dùng chúng cho **đọc** (Auction cần thông tin Product; Commerce cần tên/ảnh sản phẩm) — đọc sai thì chỉ hiển thị sai, không mất dữ liệu.
Và sửa chiều cưỡng chế: **`Auction → Commerce` đang sai** — Auction không nên đẩy order (FR-36 nói "System" tạo order, không nói service nào). Với 1 app thì đây chỉ là 1 lời gọi hàm; với 6 app nên để **Commerce kéo kết quả settlement**, hoặc Auction phát event.

---

## 4. BỐN QUYẾT ĐỊNH CÒN MỞ (mục 11) — PHÁN QUYẾT

### QĐ1 — Java + Spring Boot: **ĐỒNG Ý một phần, sửa phương án dự phòng**
- **Chốt: `Spring Boot 4.1.x` + `Java 21 (LTS)`.** (Không chọn Java 25 dù 25 cũng LTS và Boot 4.1 hỗ trợ 17–26: chọn 21 để Lombok/MapStruct/springdoc/AI-agent ít bất ngờ nhất.)
- **Sửa:** bỏ phương án "nếu vướng thì lùi Boot 3.5.x" — 3.5 hết hỗ trợ OSS 30/06/2026, hiện không còn bản vá miễn phí. Dự phòng đúng: **Boot 4.0.x** (tới 31/12/2026).
- **Rủi ro tương thích đã giảm mạnh:** `springdoc-openapi v3.1.1` công bố hỗ trợ **Spring Boot v4** (dòng 2.9.x cho Boot 3.x). Lo ngại lớn nhất của Claude đã được giải.
- Spike 1 ngày, 5 bước: Maven build → Lombok compile → springdoc `/v3/api-docs` mở được → 1 test `@MockitoBean` xanh → kết nối Postgres. 5/5 xanh ⇒ chốt, không bàn lại.

### QĐ2 — ERD changes: **ĐỒNG Ý 3, BỎ 1, THÊM 3**
Đồng ý: `Product.categoryId` (FR-10), `Order.orderType` (FR-36), `Notification.isRead` (FR-51).
**BỎ: entity `Address`** — FR-03 chỉ cần `users.address`, FR-19 cần snapshot trên Order. Không có FR nào cần sổ địa chỉ nhiều dòng. (Nếu muốn làm vì UX thì ghi là "vượt baseline, làm nếu còn thời gian".)
Thêm bắt buộc:
- **`orders.seller_id`** + ghi rõ giả định "1 order = 1 seller" (FR-23).
- **`orders.discount`** — FR-22 yêu cầu Order lưu Discount; file DDL đang thiếu.
- **`Product.basePrice`** (FR-05) — sửa DDL: giá ở Product; `skus.price` để nullable cho biến thể sau này.
- **2 entity review**: `product_reviews` (Catalog) + `seller_ratings` (Commerce) — FR-41/42 vs FR-43/44. Bỏ `Rating` khỏi User Service.
- **`promotion_campaigns` + `discount_codes`** — FR-46/47/48/58.
**Luật bid:** theo **FR-30 — `Bid amount > Current Highest Bid`**, có `status ACCEPTED/REJECTED`. Không dùng `bid_increment` (không có trong baseline). Xác nhận với giảng viên luật bid đầu tiên ≥ starting price.

### QĐ3 — Optional features: **ĐỒNG Ý phần lớn, sửa 2 mục**
- Đồng ý loại khỏi Release 1 (**và đây là loại vì không thuộc 59 FR, không phải vì khó**): `AuctionRegistration`, inventory reservation, `InventoryMovement`, `OrderStatusHistory`, `seller_payouts`, `event_logs`, `Product.allow_auction`, `Cart.tax/expiresAt/estimatedShippingFee`, `Shipment.carrier/service_type`, `AuctionSettlement.payment_deadline`.
- **RÚT khuyến nghị của v1.0:** anti-sniping và reputation gate **không thuộc baseline** — đừng làm, đừng tính vào budget. Chỉ nhắc trong báo cáo như "SRS có, MVP không".
- **Nâng theo baseline:** Rating & Review (FR-41–45) và Promotion Campaign (FR-46/FR-58) **không phải optional** — chúng là FR. Xếp SHOULD và bảo vệ bằng thời gian cắt từ depth.
- Giữ optional thật: `Privilege`/`RolePrivilege` (entity không dùng), upload ảnh thật.
- Cơ chế freeze: **additive change request** (chỉ thêm, không sửa/xoá field đã dùng) — nếu không, tới tuần 6 không ai nhớ schema gốc. Ngưỡng: **hết Sprint 2 (23/10) thì đóng băng ERD**, sau đó chỉ thêm cột nullable.

### QĐ4 — Cut line: **ĐỒNG Ý khung, sửa mốc, đổi triết lý cắt**
Sửa mốc theo lịch thật: **Checkpoint 1 = 23/10 (M1)**, **Checkpoint 2 = 06/11 (M2)**, **Checkpoint 3 = 20/11 (M3)**, **Demo = 04/12 (M4)**.
**Đổi triết lý:** vì 59 FR là phạm vi cam kết, **cắt theo chiều sâu (depth) trước, cắt FR sau**:
- Review: FR-41+43 (score) trước → FR-42/44 (comment) sau → FR-45 (moderate) = 1 endpoint đổi status.
- Promotion: Campaign = 1 entity 5 field + CRUD; không cần rule engine. DiscountCode validate 3 điều kiện theo FR-20.
- Notification: giữ bảng + publisher; nếu thiếu thời gian thì giữ đủ **event type** nhưng chỉ gắn vào các luồng chính (Order/Auction/Shipment).
- Admin: **API đầy đủ, UI không có** (thao tác qua Swagger/Postman — đúng như D05).
Thêm điều kiện cắt đang thiếu: **nếu đến 06/11 (M2) mà checkout → order chưa chạy end-to-end thì cắt Auction xuống 1 demo happy-path** (tạo phiên → 2 bid → hết giờ → hiển thị winner), **không tạo order AUCTION** — và ghi rõ FR-36 là phần bị hoãn.

---

## 5. TÍNH KHẢ THI (câu hỏi 4) — 2–3 người: KHÔNG. 5 người: ĐƯỢC, nếu cắt 20 dev-day

### 5.1 Sai lệch tiền đề
Câu hỏi đặt "giả định 2–3 người", nhưng kế hoạch thật là **5 người**: Nguyễn Minh Phúc (Leader/BE), Nguyễn Duy Thành (BE), Trần Quốc Đạt (BE), Ngô Mạnh Quân (FE), Phạm Gia Văn (FE).

- **Nếu thật sự chỉ 2–3 người:** năng lực ≈ 3 × 5 dev-day × 5 sprint = **75 dev-day** so với backlog **113 dev-day** ⇒ thiếu 34%. Khi đó buộc phải **cắt FR** (chấp nhận mất phạm vi): giữ 5.1, 5.2, 5.3, 5.4, 5.6, 5.7, 5.8 + Auction tối thiểu; bỏ 5.10 Shipment, 5.11 Review, 5.12 Promotion, 5.13 Notification, 5.14 Admin.
- **Với 5 người:** 125 dev-day năng lực, load 106 ⇒ khả thi **về số học**, nhưng 85% utilization với sinh viên vừa học Spring Boot/React lần đầu là **quá lạc quan**.

### 5.2 Chỗ bị đánh giá thấp nhất (theo thứ tự nguy hiểm)
1. **Chi phí học công nghệ.** Risk R01 tự nhận "cả team lần đầu học Spring Boot/React" nhưng vẫn tính 5 dev-day/người/sprint cho cả BE và FE. Người mới học thường đạt 30–40% trong 2 sprint đầu ⇒ năng lực thật có thể chỉ ~90 dev-day ⇒ **âm 16 dev-day**.
2. **Phụ thuộc Frontend.** 39 dev-day FE cho 2 người, và FE bị chặn bởi API (E04 chờ F03.2/F03.3, E06 chờ F05.1/F05.3). Trong kế hoạch, FE load Sprint 3–4 là **10/10 = 100%** trong khi API cùng sprint mới bắt đầu code ⇒ FE sẽ chờ. **Đây là điểm vỡ tiến độ số 1.**
3. **Kiểm thử + báo cáo dồn cuối** (E09+E10 = 17 dev-day ở S4–S5 = 34% năng lực 2 sprint cuối chỉ để test/tài liệu).
4. **Không có task cho việc tích hợp** (FR-05 tạo product kèm SKU/inventory, FR-16 kiểm tra tồn kho, FR-36 tạo order từ auction) — phần khó nhất, hiện không có dòng nào trong backlog.

### 5.3 Về ~70% utilization: cắt depth, không cắt FR (~20 dev-day)
| Cắt gì (depth, không phải FR) | Tiết kiệm | Ghi chú |
|---|---|---|
| Admin **UI** — giữ đủ API (D05) | ~4 | FR-52–59 vẫn được đáp ứng qua Swagger/Postman |
| Upload ảnh thật (F03.4) → chỉ lưu URL (FR-05 vẫn đạt) | ~2 | |
| Payment thật → 1 `PaymentProvider` interface + mock (FR-21 vẫn đạt Success/Failed/Pending) | ~3 | Giữ luôn cột `idempotency_key` vì miễn phí |
| Carrier thật → trạng thái nội bộ + tracking nhập tay (FR-39/40 nêu rõ "không làm carrier thật") | ~3 | |
| Email/SMTP → in-app only (FR-49 nêu rõ in-app) | ~2 | |
| FR-36 tạo order AUCTION → chỉ làm nếu Checkpoint 3 (20/11) còn thời gian | ~3 | Là FR, nên phải ghi rõ nếu hoãn |
| Responsive mobile, wishlist, mọi thứ ngoài 59 FR | ~3 | |
| **Tổng** | **~20** | Còn ~86 dev-day ⇒ **69% utilization** |

---

## 6. KIỂM CHỨNG PHIÊN BẢN (câu hỏi 5 & 7)

Nguồn: bảng hỗ trợ chính thức của Spring (theo dõi bởi [endoflife.date/spring-boot](https://endoflife.date/api/spring-boot.json)) và blog Spring ([Spring Boot 4.0.0 available now](https://spring.io/blog/2025/11/20/spring-boot-4-0-0-available-now), [Spring Boot 3.5.16 available now](https://spring.io/blog/2026/06/25/spring-boot-3-5-16-available-now/)).

| Nhánh | Phát hành | Hết hỗ trợ OSS | Bản mới nhất | Java hỗ trợ | Dùng được? |
|---|---|---|---|---|---|
| **3.5** | 31/05/2025 | **30/06/2026 (đã qua)** | 3.5.16 (25/06/2026) | 17–25 | ❌ Không còn bản vá miễn phí |
| **4.0** | 30/11/2025 | **31/12/2026** (còn ~3 tháng) | 4.0.8 (20/08/2026) | 17–25 | ⚠️ Chỉ dùng làm phương án dự phòng ngắn hạn |
| **4.1** | 30/06/2026 | **31/07/2027** | 4.1.1 (20/08/2026) | 17–26 | ✅ **Chọn cái này** |

- **Kết luận về tranh luận:** Claude đúng (3.5 EOL 30/06/2026; 4.0 ra 11/2025; 4.1 ra 06/2026; tối thiểu Java 17) — **các con số khớp hoàn toàn với nguồn chính thức**.
- **Java:** 21 là LTS; **Java 25 ra 16/09/2025 là LTS** ([Oracle](https://www.oracle.com/hk/news/announcement/oracle-releases-java-25-2025-09-16/)); Java 22/23/24 non-LTS. Prompt gốc "Java 22" là sai.
- **springdoc:** `v3.1.1` — trang chủ ghi rõ hỗ trợ **Spring-boot v4**; dòng 2.9.x cho Boot 3.x ([springdoc.org](https://springdoc.org/)). ⇒ Không còn lo "springdoc chưa theo kịp Boot 4".
- **Đã kiểm chứng:** ngày phát hành/EOL của Boot, Java LTS, springdoc hỗ trợ Boot 4.
- **CHƯA kiểm chứng (phải test trong spike 1 ngày):** danh sách breaking change của Boot 4 mà Claude nêu (Jackson 3, `@MockBean` → `@MockitoBean`, hành vi một số starter), và mức tương thích Lombok/MapStruct. Nguồn để tra: [OpenRewrite — Migrate to Spring Boot 4.0](https://docs.openrewrite.org/recipes/java/spring/boot4/upgradespringboot_4_0-community-edition), [Spring Boot 4.0 Migration Guide](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide).
- **Lưu ý nội bộ:** kế hoạch nhóm ghi **"JDK 22"** ở F00.1 và **"Java 17"** ở F00.6 — hai dòng mâu thuẫn, cả hai cần sửa thành **Java 21**.

**Về câu hỏi 7 (rủi ro khi dùng AI coding agent):** đây là lý do thật để cân nhắc. AI agent có nhiều dữ liệu huấn luyện về Boot 3.x hơn Boot 4.x, nên sẽ có xu hướng sinh code/annotation của Boot 3. Cách xử lý **không phải** hạ xuống Boot 3.5 (đã EOL), mà là: (a) ghim version trong `pom.xml` cha và **cấm agent đổi version**; (b) đưa đúng 5 dòng "luật Boot 4" vào Phần 0 của prompt (Jackson 3, `@MockitoBean`, springdoc 3.x); (c) bắt agent **build sau mỗi phase** — nếu nó sinh code Boot 3 thì lỗi compile lộ ra ngay.

---

## 7. HƯỚNG ĐI CHUẨN NHẤT

### 7.1 Kiến trúc: một app, sáu module — không phải sáu process
**Quyết định:** Release 1 xây **1 Spring Boot application với 6 module** (`nexus-user`, `nexus-catalog`, `nexus-fulfillment`, `nexus-commerce`, `nexus-auction`, `nexus-notification`) + `nexus-common`.

- **Vì sao:** SRS yêu cầu *ranh giới nghiệp vụ* ("Service chỉ quản lý đúng dữ liệu của nó"). Điều đó được thoả mãn bằng **module boundary + schema riêng + cấm truy cập chéo dữ liệu**, không cần 6 JVM.
- **Quan trọng nhất:** FR-05, FR-16, FR-25, FR-36 là **giao dịch xuyên module** (§3.5). Cùng một app + một Postgres, chúng là **một transaction nội bộ** ⇒ không cần saga, không cần reservation, không cần job bù trừ. Đây là khoản tiết kiệm lớn nhất (≈1 tuần).
- **Được gì:** bỏ ~6 ngày công hạ tầng (6 lần config, Swagger, Actuator, DB, port, debug khởi động), bỏ rủi ro "service A chết lúc demo", debug dễ hơn nhiều cho người mới học.
- **Mất gì (nói thật để phòng hội đồng):** mất tính deploy độc lập và mất minh hoạ lỗi mạng giữa service. Nếu hội đồng **bắt buộc** 6 process: mỗi module đã có `@SpringBootApplication` riêng + `application.yml` riêng ⇒ bật lại main class và port là xong. **Thiết kế để việc tách này tốn 1 ngày công, nhưng đừng trả giá đó ngay từ đầu.**
- Không dùng: API gateway, service discovery, message broker (Kafka/RabbitMQ), distributed tracing, circuit breaker thật, Redis, Kubernetes.
- **Vẫn giữ luật microservice quan trọng nhất:** mỗi module **một schema Postgres riêng**; không FK xuyên module; tham chiếu chéo chỉ là UUID logic. Riêng transaction của FR-05/FR-16/FR-25/FR-36 được phép chạm 2 schema — **ghi rõ đây là đánh đổi có chủ ý**.

### 7.2 Database & môi trường (câu hỏi 6)
- **Mỗi dev chạy PostgreSQL local** + database `nexus_dev` riêng. Đây là nơi code hằng ngày.
- **Supabase chỉ dùng cho môi trường demo/chung**, với `ddl-auto=validate` (không `update`), schema tạo bằng chính DDL của nhóm.
- **Test:** database `nexus_test` **trên Postgres local**, mỗi dev một cái; **KHÔNG dùng H2** (khác biệt `JSONB`, enum, `TIMESTAMPTZ` ⇒ test "xanh giả"). `@DataJpaTest` + `@Transactional` cho repository; `@SpringBootTest` + `@MockitoBean` cho service.
- **Vì sao không dùng chung Supabase cho test:** profile test ghi vào schema `*_test` vẫn chia sẻ connection pool và version schema; một người chạy `ddl-auto=update` là cả nhóm lệch schema.
- **Tuyệt đối không** để AI agent chạy `DROP`/`reset`/`create-drop` trên Supabase; thêm dòng cấm này vào prompt (GPT đúng ở điểm này).

### 7.3 Trạng thái đơn hàng: **không có PAID — theo FR-24**
v1.0 của tôi khuyên giữ `PAID` (dựa trên SRS §3.3 và F05.5 trong backlog). **Sai baseline.** FR-24 liệt kê đúng `PENDING → CONFIRMED → SHIPPING → COMPLETED` + `CANCELLED`. Vậy:
- `OrderStatus` = đúng 5 giá trị trên. Thanh toán thành công = `Payment.status = SUCCESS`.
- FR-38 ("sau khi Order được payment thành công → tạo Shipment"): gate bằng `Payment.status = SUCCESS`, **không** bằng order status.
- Nếu nhóm muốn thêm `PAID` cho dễ nói khi demo thì đó là **thêm ngoài baseline** — ghi rõ, và nói với giảng viên.

### 7.4 Kế hoạch 10 tuần hiệu chỉnh (theo lịch thật, 5 người)

| Sprint | Thời gian | Mục tiêu | Mốc/Exit criteria |
|---|---|---|---|
| S1 | 28/09–09/10 | **Đang chạy.** Chốt ERD v1.0-frozen (đối chiếu 59 FR) + spike Boot 4.1/Java 21 + 1 app 6 module + Swagger + Postgres local | **M0 09/10:** 7 module build xanh, `/actuator/health` OK, `/v3/api-docs` mở được |
| S2 | 12/10–23/10 | FR-01–04 (Auth **có token** + Profile + Admin user), FR-09/10 (Category + assign), FR-05–08 (Product, ảnh = URL), FR-11/12 (search/filter/sort) | **M1 23/10:** role seed; phân quyền chạy; CRUD product/category + search chạy trên Swagger. **Đóng băng ERD** |
| S3 | 26/10–06/11 | FR-13/14 (Inventory SKU, không âm), FR-15–18 (Cart, giá từ `Product.basePrice`), FR-19/22 (Checkout → Order, snapshot), FE Catalog + Cart | **M2 06/11:** giỏ → checkout → order chạy trên UI |
| S4 | 09/11–20/11 | FR-20/21/47/48 (Payment mock Success/Failed/Pending + DiscountCode), FR-24/25 (vòng đời + cancel trả kho), FR-38–40 (Shipment + tracking), FR-26–34 (Auction: create/configure/scheduler/placeBid/outbid), FE Auction | **M3 20/11:** Direct Purchase end-to-end + Auction bid chạy |
| S5 | 23/11–04/12 | FR-35/36 (winner + order AUCTION), FR-49–51 (Notification in-app, đủ event type), FR-41–45 (Rating/Review + moderate), FR-46/58 (Campaign), test + tài liệu + Postman + báo cáo | **M4 04/12 Demo Day:** 2 luồng end-to-end, tồn kho không âm, bid đúng luật, đủ 59 FR hoặc có ghi chú deviation rõ ràng |

**Luật bất biến:** (1) không FK xuyên module; (2) tồn kho không âm; (3) bid đúng FR-30; (4) không lộ `passwordHash`; (5) mỗi module một schema.
**Nếu S5 quá tải:** chuyển FR-41–45 và FR-46 lên sớm hơn (S4) hoặc ghi rõ deviation — nhưng **đừng để phát hiện ở tuần 10**.

### 7.5 Điều chỉnh cách làm việc với AI agent
- **Gate theo phase toàn dự án, không theo service:** Gate 1 = toàn bộ entity + repository + DTO; Gate 2 = CRUD + Swagger; Gate 3 = business logic từng luồng. 3–4 điểm dừng thay vì 24 (hướng thứ ba cho tranh luận số 10).
- **Prompt phải chứa:** **danh sách 59 FR**; version ghim cứng; luật "không DROP/reset trên Supabase"; ERD v1.0-frozen; `ErrorCode` enum duy nhất; `PageResponse<T>` riêng (không trả `Page<T>`); mapper viết tay; Lombok không `@Data` trên entity; luật bid theo FR-30.
- **Sau mỗi phase bắt buộc:** `mvn -q clean verify` + mở Swagger + gọi thử 1 API + **soát không có `@ManyToOne/@OneToMany` xuyên module**.

---

## 8. VIỆC PHẢI LÀM TRONG 72 GIỜ TỚI

1. **Chốt 2 baseline:** `scope.xlsx` = baseline yêu cầu; `project_nexus_sql_database_design.md` §4 = baseline triển khai. Sửa DDL cho khớp baseline ở các điểm §1.1, rồi **sinh ERD mới từ DDL**, lưu `ERD-v1.0-frozen`. Xoá hoặc cập nhật `ERD.drawio.png` cũ.
2. **Sửa DDL — thêm:** `Product.basePrice` (FR-05), `orders.seller_id`, `orders.discount` (FR-22), bảng `product_reviews` (Catalog), `seller_ratings` (Commerce), `promotion_campaigns`, `discount_codes` (**Campaign theo FR-46/58**), `notifications.is_read/read_at`. **Bỏ:** `AuctionRegistration`, `inventory_reservations`, `inventory_movements`, `order_status_history`, `seller_payouts`, `event_logs`, `Product.allow_auction`, `AuctionSettlement.payment_deadline`, `Notification.channel`.
3. **Sửa 5 lỗi kỹ thuật trong DDL:** partial unique cho email sau soft delete; partial unique 1 payment SUCCESS/order; `CHECK` cho mọi cột status; index cho mọi FK + `(auction_id, amount DESC)`; `TIMESTAMP` → `TIMESTAMPTZ`.
4. **Ghim version:** `Java 21` + `Spring Boot 4.1.x` + `springdoc-openapi 3.1.1`; sửa cả F00.1 (JDK 22) và F00.6 (Java 17).
5. **Chạy spike 1 ngày** đúng 5 bước §4 QĐ1; nếu xanh thì đóng băng, không bàn lại.
6. **Cắt 20 dev-day theo depth** (§5.3) và cập nhật sheet "4. Sprint Plan" (mục tiêu ≤70%).
7. **Thêm 3 task còn thiếu vào backlog:** "Thiết kế DB + chốt ERD", "Tích hợp FR-05/FR-16/FR-25/FR-36", và "Rating & Review + Promotion + Notification event" (19 FR đang không có task).
8. **Bắt đầu code ngay.** Trong repo đến 06/10 chưa có code; M0 là 09/10.

---

## 9. TRẢ LỜI NHANH 8 CÂU HỎI (mục 12)

| # | Câu hỏi | Trả lời ngắn |
|---|---|---|
| 1 | Đứng về Claude, GPT, hay hướng thứ ba? | **Hướng thứ ba ở 3 điểm** (gate theo phase toàn dự án; ERD được đổi nhưng phải truy vết; **baseline là 59 FR, không phải SRS**). GPT đúng về kỷ luật quy trình; Claude đúng về sự kiện và về kinh tế 10 tuần, nhưng **sai khi hạ cấp 19 FR** và **thêm luật ngoài baseline** |
| 2 | ERD còn gap/lỗi gì? Chuyển entity sang service khác? | Lệch ~25 điểm giữa 4 artifact (§1.1); **chuyển review ra khỏi User Service** (product_reviews→Catalog, seller_ratings→Commerce); **`Address` không cần entity**; thêm `orders.seller_id` + `orders.discount`; `Product.basePrice` phải quay lại |
| 3 | 3 lời gọi service có đủ/đúng? Rủi ro consistency? | **Không đủ.** `Auction → Commerce` sai chiều cưỡng chế. Rủi ro "trừ kho xong nhưng tạo order lỗi" là có thật **nếu tách 6 process** — và cách chữa (reservation) không thuộc baseline. **Giải pháp rẻ nhất: 1 app + 1 DB ⇒ 1 transaction nội bộ** (§3.5) |
| 4 | Kế hoạch 10 tuần có thực tế cho 2–3 người? | **Không.** 2–3 người ≈ 75 dev-day so với 113 ⇒ phải cắt FR. Với **5 người** (đúng kế hoạch nhóm) thì được, nhưng phải cắt 20 dev-day (depth, không cắt FR) để về 70% |
| 5 | Hoãn JWT tới tuần 9, dùng `userId` trong request có chấp nhận được? | **Không.** FR-02 yêu cầu login **tạo token**, và kế hoạch nhóm đã đặt JWT ở S1–S2 (F01.4/F01.5) — đúng hơn. Làm auth sớm vì mọi FR sau đều cần biết "ai đang gọi" |
| 6 | Test trên Supabase dùng chung (`*_test` + profile) có ổn? | **Không ổn.** Postgres local cho dev + test (`nexus_test`); Supabase chỉ cho demo với `ddl-auto=validate`. Không dùng H2 |
| 7 | Boot 4.1 hay ở lại 3.5? Kiểm chứng | **Boot 4.1.x + Java 21.** 3.5 hết hỗ trợ OSS 30/06/2026; 4.0 hết 31/12/2026; 4.1 hỗ trợ tới 31/07/2027. springdoc 3.1.1 đã hỗ trợ Boot 4 |
| 8 | Cắt/đổi gì thêm trong Scope Matrix? | **Đừng cắt FR.** Đưa 19 FR bị hạ cấp trở lại (Review, Campaign, Notification đủ event, Admin API). Bỏ `bid_increment` và entity `Address`; thêm `Bid.status` theo FR-30; bỏ PAID; giữ tất cả "không làm carrier/không Stripe thật" vì scope đã nói rõ |

---

## 10. BỨC TRANH TOÀN CẢNH

```
┌─ TẦNG 0: SRS đầy đủ của thầy (RẤT RỘNG — chỉ để truy vết) ──────────────────┐
│  6 bounded context · Stripe webhook · anti-sniping · reputation ≥40 ·       │
│  reservation 30' · GHN/GHTK + circuit breaker · SLA ≤300ms · RTO/RPO        │
│  ⇒ KHÔNG phải nghĩa vụ của nhóm (xem §0.1)                                  │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │  thu nhỏ, chốt lại
┌─ TẦNG 1: scope.xlsx — BASELINE CAM KẾT: 59 FR / 14 nhóm ────────────────────┐
│  5.1 Account(incl. token) · 5.2 Product · 5.3 Category · 5.4 Search         │
│  5.5 Inventory · 5.6 Cart · 5.7 Checkout+Discount+Payment · 5.8 Order       │
│  5.9 Auction(core, không anti-sniping) · 5.10 Shipment(không carrier thật)  │
│  5.11 Rating & Review (+moderate) · 5.12 Promotion Campaign + DiscountCode  │
│  5.13 Notification in-app (23 event) · 5.14 Admin (8 FR)                    │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
┌─ TẦNG 2: Release 1 (113 dev-day → cắt depth còn ~86 = 69%) ─────────────────┐
│  5 người · 5 sprint · 28/09 → 04/12/2026 · COD/mock payment · in-app only   │
│  CẮT DEPTH: Admin UI · upload ảnh thật · carrier thật · email ·            │
│             (dự phòng) FR-36 tạo order AUCTION                              │
│  KHÔNG CẮT FR: Review, Campaign, Notification, Admin API                    │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
┌─ TẦNG 3: Kiến trúc chốt ────────────────────────────────────────────────────┐
│  1 Spring Boot app = 6 Maven module + common  (tách process được nếu cần)   │
│  Java 21 + Boot 4.1.x + springdoc 3.1.1 + Postgres (schema/module)          │
│  FR-05/16/25/36 = 1 transaction nội bộ ⇒ không saga, không reservation      │
│  Postgres local cho dev/test · Supabase chỉ để demo (ddl-auto=validate)     │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
┌─ TẦNG 4: Dữ liệu — NGUỒN SỰ THẬT DUY NHẤT ──────────────────────────────────┐
│  SQL DDL (đã sửa theo 59 FR)  →  sinh ra  ERD-v1.0-frozen                   │
│  + Product.basePrice · + orders.seller_id/discount · + product_reviews      │
│  + seller_ratings · + promotion_campaigns · + discount_codes · + is_read    │
│  − AuctionRegistration · − inventory_reservations/movements · − payouts     │
│  − event_logs · − order_status_history · − allow_auction · − payment_deadline│
│  + partial unique (email, payment SUCCESS) · + index FK · + CHECK · TIMESTAMPTZ│
└─────────────────────────────────────────────────────────────────────────────┘
```

**Ba câu để tự kiểm tra trước khi code tiếp:**
1. FR nào trong 59 FR mà hiện **không có dòng nào trong backlog**? (Đáp án: toàn bộ 5.11, 5.12, phần lớn 5.13, 5.14 — 19 FR.)
2. Giá sản phẩm nằm ở đâu, và Cart lấy giá bằng cách nào? (Đáp án đúng theo FR-05: `Product.basePrice`, trong Catalog.)
3. Nếu Commerce chết giữa lúc đang trừ kho — cơ chế bù trừ của bạn là gì? (Đáp án rẻ nhất: cùng 1 app + 1 DB thì không cần bù trừ — 1 transaction.)

Trả lời được cả ba ⇒ thiết kế đã đủ chín để code.

---

## PHỤ LỤC — NGUỒN KIỂM CHỨNG

| Nội dung | Nguồn | Trạng thái |
|---|---|---|
| Boot 3.5 EOL 30/06/2026; 4.0 ra 30/11/2025 EOL 31/12/2026; 4.1 ra 30/06/2026 EOL 31/07/2027; Java 17–26 cho 4.1 | [endoflife.date/spring-boot](https://endoflife.date/api/spring-boot.json) | ✅ đã kiểm chứng |
| Spring Boot 4.0.0 GA (20/11/2025); 3.5.16 (25/06/2026) | [spring.io blog 4.0](https://spring.io/blog/2025/11/20/spring-boot-4-0-0-available-now), [spring.io blog 3.5.16](https://spring.io/blog/2026/06/25/spring-boot-3-5-16-available-now/) | ✅ đã kiểm chứng |
| springdoc-openapi v3.1.1 hỗ trợ Spring Boot v4 (2.9.x cho Boot 3.x) | [springdoc.org](https://springdoc.org/) | ✅ đã kiểm chứng |
| Java 25 LTS phát hành 16/09/2025 | [Oracle](https://www.oracle.com/hk/news/announcement/oracle-releases-java-25-2025-09-16/) | ✅ đã kiểm chứng |
| Jackson 3 / `@MockBean` → `@MockitoBean` / Lombok trên Boot 4 | [OpenRewrite Boot 4 recipe](https://docs.openrewrite.org/recipes/java/spring/boot4/upgradespringboot_4_0-community-edition), Spring Boot 4.0 Migration Guide | ⚠️ **chưa kiểm chứng** — test trong spike |

---
*v1.1 — Tài liệu này phản biện cả Claude và GPT, và tự đính chính v1.0. Các kết luận về lệch artifact được rút ra từ việc đọc trực tiếp `scope.xlsx` (59 FR), `ERD.drawio.png` và `Doc/project_nexus_sql_database_design.md` trong repo, không dựa vào bản tóm tắt.*
