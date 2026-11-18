-- ============================================================
-- PROJECT NEXUS — SEED BỔ SUNG (chạy SAU file seed gốc)
--
-- Mục đích: hoàn thiện phần bị cắt ở `auction_registration` và thêm dữ liệu
-- để FE có thứ hiển thị: đơn hàng cho 2 seller, đấu giá đã kết thúc,
-- vận chuyển, đăng ký đấu giá, thông báo.
--
-- ------------------------------------------------------------
-- ⚠️ CHẠY STEP 0 TRƯỚC
--    Các bảng từ mục 3 trở đi tôi KHÔNG có DDL, chỉ suy ra tên cột từ
--    ngữ cảnh. Phải đối chiếu với STEP 0 rồi mới chạy tiếp, nếu không sẽ
--    lỗi "column ... does not exist" và Supabase ROLLBACK toàn bộ batch.
-- ------------------------------------------------------------
-- LƯU Ý VỀ TRANSACTION:
--    Supabase SQL Editor chạy cả batch trong MỘT transaction ngầm.
--    Gặp 1 lỗi ở bất kỳ đâu → toàn bộ rollback, không insert được gì.
--    Vì vậy đừng dán cả file một lần. Chạy theo từng mục, xem kết quả rồi đi tiếp.
-- ============================================================


-- ============================================================
-- STEP 0 (BẮT BUỘC) — Xem toàn bộ cột đang có trong schema public
-- ============================================================
SELECT
    table_name,
    string_agg(column_name || ' : ' || data_type, ', ' ORDER BY ordinal_position) AS danh_sach_cot
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;

-- Xem giá trị status nào được phép (CHECK constraint) — quan trọng vì
-- script gốc chỉ dùng 'active' / 'paid' / 'pending' / 'draft'.
SELECT conrelid::regclass AS bang, conname AS ten_constraint, pg_get_constraintdef(oid) AS dinh_nghia
FROM pg_constraint
WHERE contype = 'c'
  AND connamespace = 'public'::regnamespace
ORDER BY 1, 2;


-- ============================================================
-- MỤC 1 — 6 ĐƠN HÀNG MỚI (để SELLER có đơn hiển thị)
--
-- Trong schema này: orders.user_id = NGƯỜI MUA,
--                   order_items.seller_id = NGƯỜI BÁN.
-- Script gốc chỉ có 2 đơn, cả 2 đều là buyer → seller trống.
--
-- Người bán trong script gốc:
--   seller01 = 10000000-0000-0000-0000-000000000002  (product 1, 2)
--   seller02 = 10000000-0000-0000-0000-000000000003  (product 3, 4)
--
-- ⚠️ Nếu STEP 0 cho thấy orders KHÔNG có cột `tax` hoặc `shipping_address_id`,
--    sửa lại danh sách cột bên dưới cho khớp.
-- ============================================================

INSERT INTO orders
    (order_id, user_id, order_number, status, subtotal, tax, discount,
     shipping_fee, total_amount, shipping_address_id, created_at, updated_at)
VALUES
    -- seller01: 3 đơn
    (3, '10000000-0000-0000-0000-000000000001', 'NX-ORD-2026-0003',
     'completed', 15000000.00, 0, 0, 30000.00, 15030000.00, NULL,
     NOW() - INTERVAL '8 days', NOW() - INTERVAL '6 days'),
    (4, '10000000-0000-0000-0000-000000000005', 'NX-ORD-2026-0004',
     'shipping', 700000.00, 0, 0, 25000.00, 725000.00, NULL,
     NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'),
    (5, '10000000-0000-0000-0000-000000000001', 'NX-ORD-2026-0005',
     'pending', 15350000.00, 0, 0, 30000.00, 15380000.00, NULL,
     NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
    -- seller02: 3 đơn
    (6, '10000000-0000-0000-0000-000000000005', 'NX-ORD-2026-0006',
     'confirmed', 420000.00, 0, 0, 30000.00, 450000.00, NULL,
     NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'),
    (7, '10000000-0000-0000-0000-000000000001', 'NX-ORD-2026-0007',
     'cancelled', 1260000.00, 0, 0, 30000.00, 1290000.00, NULL,
     NOW() - INTERVAL '12 days', NOW() - INTERVAL '11 days'),
    (8, '10000000-0000-0000-0000-000000000005', 'NX-ORD-2026-0008',
     'paid', 8000000.00, 0, 0, 0.00, 8000000.00, NULL,
     NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

INSERT INTO order_items
    (order_item_id, order_id, product_id, sku_id, seller_id, quantity, unit_price, subtotal)
VALUES
    -- đơn 3 → seller01
    (4, 3, 1, 1, '10000000-0000-0000-0000-000000000002', 1, 15000000.00, 15000000.00),
    -- đơn 4 → seller01
    (5, 4, 2, 2, '10000000-0000-0000-0000-000000000002', 2,  350000.00,   700000.00),
    -- đơn 5 → seller01 (2 dòng)
    (6, 5, 1, 1, '10000000-0000-0000-0000-000000000002', 1, 15000000.00, 15000000.00),
    (7, 5, 2, 2, '10000000-0000-0000-0000-000000000002', 1,  350000.00,   350000.00),
    -- đơn 6 → seller02
    (8, 6, 3, 3, '10000000-0000-0000-0000-000000000003', 1,  420000.00,   420000.00),
    -- đơn 7 → seller02
    (9, 7, 3, 3, '10000000-0000-0000-0000-000000000003', 3,  420000.00,  1260000.00),
    -- đơn 8 → seller02
    (10, 8, 4, 4, '10000000-0000-0000-0000-000000000003', 1, 8000000.00, 8000000.00);

INSERT INTO payment
    (payment_id, order_id, payment_reference, payment_method, amount, status, paid_at, created_at)
VALUES
    (3, 3, 'PAY-DEMO-0003', 'MOCK', 15030000.00, 'paid',    NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
    (4, 4, 'PAY-DEMO-0004', 'MOCK',   725000.00, 'paid',    NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
    (5, 5, 'PAY-DEMO-0005', 'MOCK', 15380000.00, 'pending', NULL,                      NOW() - INTERVAL '2 hours'),
    (6, 6, 'PAY-DEMO-0006', 'MOCK',   450000.00, 'paid',    NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
    (7, 7, 'PAY-DEMO-0007', 'MOCK',  1290000.00, 'pending', NULL,                      NOW() - INTERVAL '12 days'),
    (8, 8, 'PAY-DEMO-0008', 'MOCK',  8000000.00, 'paid',    NOW() - INTERVAL '1 day',  NOW() - INTERVAL '1 day');

INSERT INTO order_status_history (history_id, order_id, old_status, new_status, changed_at) VALUES
    (4,  3, NULL,        'pending',   NOW() - INTERVAL '8 days'),
    (5,  3, 'pending',   'paid',      NOW() - INTERVAL '8 days'),
    (6,  3, 'paid',      'completed', NOW() - INTERVAL '6 days'),
    (7,  4, NULL,        'pending',   NOW() - INTERVAL '3 days'),
    (8,  4, 'pending',   'shipping',  NOW() - INTERVAL '1 day'),
    (9,  5, NULL,        'pending',   NOW() - INTERVAL '2 hours'),
    (10, 6, NULL,        'confirmed', NOW() - INTERVAL '4 days'),
    (11, 7, NULL,        'cancelled', NOW() - INTERVAL '11 days'),
    (12, 8, NULL,        'paid',      NOW() - INTERVAL '1 day');


-- ============================================================
-- MỤC 2 — ĐẤU GIÁ ĐÃ KẾT THÚC + ĐĂNG KÝ + QUYẾT TOÁN
--
-- Thêm auction 3 (ended) để FE có trạng thái "đã kết thúc" hiển thị.
-- auction_registration: các cột dưới đây là SUY LUẬN — đối chiếu STEP 0.
-- ============================================================

INSERT INTO auction
    (auction_id, product_id, seller_id, starting_price, bid_increment, current_price,
     highest_bidder_id, start_time, end_time, status)
VALUES
    (3, 2, '10000000-0000-0000-0000-000000000002',
     300000.00, 10000.00, 360000.00,
     '10000000-0000-0000-0000-000000000005',
     NOW() - INTERVAL '10 days', NOW() - INTERVAL '7 days', 'ended');

INSERT INTO bid (bid_id, auction_id, bidder_id, amount, placed_at) VALUES
    (3, 3, '10000000-0000-0000-0000-000000000001', 320000.00, NOW() - INTERVAL '9 days'),
    (4, 3, '10000000-0000-0000-0000-000000000005', 340000.00, NOW() - INTERVAL '8 days'),
    (5, 3, '10000000-0000-0000-0000-000000000005', 360000.00, NOW() - INTERVAL '7 days');

-- 2.1 Đăng ký tham gia đấu giá  ← CHÍNH LÀ PHẦN BỊ CẮT TRONG FILE GỐC
--     Nếu STEP 0 cho thấy tên cột khác (vd. `bidder_id` thay vì `user_id`),
--     sửa lại trước khi chạy.
INSERT INTO auction_registration
    (registration_id, auction_id, user_id, registered_at, status)
VALUES
    (1, 1, '10000000-0000-0000-0000-000000000001', NOW() - INTERVAL '20 hours', 'approved'),
    (2, 1, '10000000-0000-0000-0000-000000000005', NOW() - INTERVAL '18 hours', 'approved'),
    (3, 2, '10000000-0000-0000-0000-000000000005', NOW() - INTERVAL '1 hour',   'pending'),
    (4, 3, '10000000-0000-0000-0000-000000000001', NOW() - INTERVAL '11 days', 'approved'),
    (5, 3, '10000000-0000-0000-0000-000000000005', NOW() - INTERVAL '11 days', 'approved');

-- 2.2 Quyết toán phiên đấu giá 3 (người thắng: buyer02)
INSERT INTO auction_settlement
    (settlement_id, auction_id, order_id, winner_id, final_price, settled_at, status)
VALUES
    (1, 3, 8, '10000000-0000-0000-0000-000000000005', 360000.00,
     NOW() - INTERVAL '7 days', 'settled');

-- ============================================================
-- MỤC 3 — VẬN CHUYỂN (shipment)
-- ============================================================

INSERT INTO shipment
    (shipment_id, order_id, tracking_number, carrier, status, shipped_at, delivered_at, created_at)
VALUES
    (1, 3, 'GHN-DEMO-0001', 'GHN', 'delivered',
     NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '8 days'),
    (2, 4, 'GHTK-DEMO-0002', 'GHTK', 'in_transit',
     NOW() - INTERVAL '1 day', NULL, NOW() - INTERVAL '3 days'),
    (3, 6, 'VNPOST-DEMO-0003', 'VNPOST', 'pending',
     NULL, NULL, NOW() - INTERVAL '5 days');


-- ============================================================
-- MỤC 4 — THÔNG BÁO (notification)
-- ⚠️ Tên cột suy luận; nếu bảng dùng `message` thay vì `content`,
--    hoặc `read_at` thay vì `is_read`, sửa cho khớp STEP 0.
-- ============================================================

INSERT INTO notification
    (notification_id, user_id, title, content, type, is_read, created_at)
VALUES
    (1, '10000000-0000-0000-0000-000000000001', 'Đơn hàng đã giao',
     'Đơn NX-ORD-2026-0003 đã được giao thành công.', 'ORDER', TRUE,  NOW() - INTERVAL '6 days'),
    (2, '10000000-0000-0000-0000-000000000005', 'Đơn hàng đang vận chuyển',
     'Đơn NX-ORD-2026-0004 đang trên đường tới bạn.', 'ORDER', FALSE, NOW() - INTERVAL '1 day'),
    (3, '10000000-0000-0000-0000-000000000002', 'Bạn có đơn hàng mới',
     'Đơn NX-ORD-2026-0005 vừa được tạo.', 'ORDER', FALSE, NOW() - INTERVAL '2 hours'),
    (4, '10000000-0000-0000-0000-000000000005', 'Bạn đã thắng đấu giá',
     'Phiên đấu giá #3 kết thúc, bạn là người thắng.', 'AUCTION', FALSE, NOW() - INTERVAL '7 days'),
    (5, '10000000-0000-0000-0000-000000000003', 'Đánh giá mới',
     'Sản phẩm Desk Lamp vừa nhận đánh giá 5 sao.', 'REVIEW', FALSE, NOW() - INTERVAL '2 days');


-- ============================================================
-- MỤC 5 — ĐÁNH GIÁ SẢN PHẨM
-- ⚠️ Tên bảng có thể là `review` hoặc `product_review`. Xem STEP 0.
--    Cột điểm có thể là `score` hoặc `rating`.
-- ============================================================

INSERT INTO product_review
    (review_id, product_id, buyer_id, order_id, score, comment, status, created_at)
VALUES
    (1, 1, '10000000-0000-0000-0000-000000000001', 3, 5,
     'Máy chạy êm, đóng gói cẩn thận. Sẽ mua lại.', 'visible', NOW() - INTERVAL '5 days'),
    (2, 2, '10000000-0000-0000-0000-000000000005', 4, 4,
     'Chuột dùng tốt, pin hơi nhanh hết.', 'visible', NOW() - INTERVAL '1 day'),
    (3, 3, '10000000-0000-0000-0000-000000000001', 7, 3,
     'Đèn ổn nhưng đơn bị huỷ, chưa nhận được hàng.', 'visible', NOW() - INTERVAL '10 days');


-- ============================================================
-- MỤC 6 — TÀI KHOẢN ADMIN (mật khẩu hiện rõ)
--
--   Email    : admin02@nexus.local
--   Mật khẩu : Admin@12345
--
-- Hash do pgcrypto sinh TRỰC TIẾP từ chuỗi plaintext ở trên,
-- nên chắc chắn khớp BCryptPasswordEncoder — không phải đoán như
-- hash $2a$10$N9qo8u... trong script gốc.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users
    (user_id, email, phone, full_name, identity_number, gender, address,
     date_of_birth, password_hash, status, created_at)
VALUES
    ('10000000-0000-0000-0000-000000000006', 'admin02@nexus.local',
     '0901000006', 'Nexus Admin 02', 'ID-DEMO-006', 'other',
     'Nexus Office - Chi nhanh 2', '1994-03-18',
     crypt('Admin@12345', gen_salt('bf', 10)),
     'active', NOW());

INSERT INTO user_roles (user_id, role_id) VALUES
    ('10000000-0000-0000-0000-000000000006', 3);

INSERT INTO user_reputation (reputation_id, user_id, score, trust_level, updated_at) VALUES
    (6, '10000000-0000-0000-0000-000000000006', 100, 'ADMIN', NOW());


-- ============================================================
-- MỤC 7 — SỬA SEQUENCE (BẮT BUỘC, chạy cuối)
--
-- Script gốc insert ID thủ công (1, 2, 3...) vào cột SERIAL.
-- Sequence vẫn đang ở 1 → lần đầu app tạo bản ghi mới qua API sẽ
-- đụng ID đã có và báo "duplicate key value violates unique constraint".
--
-- Khối này tự tìm MỌI cột có sequence trong schema public
-- và đẩy sequence lên sau giá trị lớn nhất hiện có.
-- (users.user_id là UUID nên không có sequence — an toàn, tự bỏ qua.)
-- ============================================================

DO $$
DECLARE
    r   record;
    seq text;
    mx  bigint;
BEGIN
    FOR r IN
        SELECT c.table_schema, c.table_name, c.column_name
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.data_type IN ('integer', 'bigint', 'smallint')
    LOOP
        seq := pg_get_serial_sequence(
                   format('%I.%I', r.table_schema, r.table_name), r.column_name);
        IF seq IS NOT NULL THEN
            EXECUTE format('SELECT coalesce(max(%I), 0) FROM %I.%I',
                           r.column_name, r.table_schema, r.table_name) INTO mx;
            IF mx > 0 THEN
                PERFORM setval(seq, mx);
                RAISE NOTICE 'setval % -> %', seq, mx;
            END IF;
        END IF;
    END LOOP;
    RAISE NOTICE 'Xong: tat ca sequence da duoc day len dung cho.';
END $$;


-- ============================================================
-- MỤC 8 — KIỂM TRA KẾT QUẢ
-- ============================================================

-- 8.1 Đơn hàng theo người bán (đây là thứ FE seller sẽ đọc)
SELECT
    oi.seller_id,
    su.full_name                          AS ten_nguoi_ban,
    o.status,
    count(DISTINCT o.order_id)            AS so_don,
    sum(oi.subtotal)                      AS tong_tien_hang
FROM order_items oi
JOIN orders o       ON o.order_id  = oi.order_id
JOIN users  su      ON su.user_id  = oi.seller_id
GROUP BY oi.seller_id, su.full_name, o.status
ORDER BY su.full_name, o.status;

-- 8.2 Tổng hợp số dòng toàn bộ bảng chính
SELECT 'users'                 AS bang, count(*) FROM users
UNION ALL SELECT 'orders',              count(*) FROM orders
UNION ALL SELECT 'order_items',         count(*) FROM order_items
UNION ALL SELECT 'payment',             count(*) FROM payment
UNION ALL SELECT 'auction',             count(*) FROM auction
UNION ALL SELECT 'bid',                 count(*) FROM bid
UNION ALL SELECT 'auction_registration',count(*) FROM auction_registration
UNION ALL SELECT 'shipment',            count(*) FROM shipment
UNION ALL SELECT 'notification',        count(*) FROM notification
ORDER BY bang;

-- 8.3 Xác nhận admin02 đăng nhập được
SELECT
    u.email,
    u.status,
    r.role_name,
    (u.password_hash = crypt('Admin@12345', u.password_hash)) AS mat_khau_dung,
    'Admin@12345'                                             AS mat_khau
FROM users u
JOIN user_roles ur ON ur.user_id = u.user_id
JOIN roles      r  ON r.role_id  = ur.role_id
WHERE u.email = 'admin02@nexus.local';
