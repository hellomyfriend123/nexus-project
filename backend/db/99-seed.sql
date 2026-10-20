-- =====================================================================================
-- DỮ LIỆU NỀN (SEED) — chạy SAU các file 01..06
--
--   psql "$DB_URL" -f db/99-seed.sql
--
-- Ghi chú: tài khoản ADMIN demo được tạo tự động bởi `RoleAndAdminSeeder` (Java) khi ứng dụng
-- khởi động lần đầu, vì mật khẩu phải được băm bằng BCrypt chứ không thể viết cứng trong SQL.
-- File này chỉ tạo dữ liệu có UUID cố định để tiện tham chiếu khi test.
-- =====================================================================================

-- 3 vai trò bắt buộc (FR-01: "Account được gán role tương ứng")
INSERT INTO nexus_user.roles (id, code, name, description) VALUES
    ('11111111-1111-1111-1111-111111111111', 'BUYER',  'Người mua',  'Mua hàng trực tiếp và tham gia đấu giá'),
    ('22222222-2222-2222-2222-222222222222', 'SELLER', 'Người bán',  'Đăng bán sản phẩm và tổ chức đấu giá'),
    ('33333333-3333-3333-3333-333333333333', 'ADMIN',  'Quản trị viên', 'Quản lý toàn bộ marketplace')
ON CONFLICT (code) DO NOTHING;

-- Kho mặc định: FR-05 (sản phẩm có tồn kho ban đầu) cần ít nhất một kho ACTIVE để gắn tồn kho.
INSERT INTO nexus_fulfillment.warehouses (id, code, name, address, status) VALUES
    ('44444444-4444-4444-4444-444444444444', 'WH_DEFAULT', 'Kho mặc định', 'FPT University, Hà Nội', 'ACTIVE')
ON CONFLICT (code) DO NOTHING;

-- Kiểm tra nhanh sau khi seed
-- SELECT code, name FROM nexus_user.roles ORDER BY code;
-- SELECT code, name FROM nexus_fulfillment.warehouses ORDER BY code;
