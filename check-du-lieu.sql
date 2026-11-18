-- =====================================================================================
--  check-du-lieu.sql — Kiểm tra dữ liệu đăng ký có thật sự nằm trong Supabase không
--
--  CÁCH CHẠY:
--    1. Mở Supabase Dashboard -> project của bạn
--    2. Vào "SQL Editor" (biểu tượng >_ ở sidebar trái)
--    3. Dán TOÀN BỘ file này -> bấm "Run" (Ctrl+Enter)
--
--  Hoặc chạy bằng psql:
--    psql "$DB_URL" -f check-du-lieu.sql
-- =====================================================================================


-- =====================================================================================
-- PHẦN 1: TẤT CẢ SCHEMA ĐANG CÓ  <-- quan trọng nhất
--
-- Nếu bạn không thấy nexus_user ở đây thì backend CHƯA ghi được gì vào DB này
-- (có thể đang kết nối tới DB khác, hoặc dùng H2 in-memory).
-- =====================================================================================
select
    nspname                          as schema_name,
    pg_catalog.pg_get_userbyid(nspowner) as owner
from pg_catalog.pg_namespace
where nspname not like 'pg_%'
  and nspname <> 'information_schema'
order by nspname;


-- =====================================================================================
-- PHẦN 2: ĐẾM SỐ BẢNG TRONG TỪNG SCHEMA CỦA NEXUS
--
-- Kỳ vọng: nexus_user = 3, nexus_catalog = 4, nexus_fulfillment = 4,
--          nexus_commerce = 8, nexus_auction = 3, nexus_notification = 1
-- Nếu ra 0 dòng cho một schema -> schema đó chưa được tạo.
-- =====================================================================================
select
    table_schema,
    count(*) as so_bang
from information_schema.tables
where table_schema in (
    'nexus_user', 'nexus_catalog', 'nexus_fulfillment',
    'nexus_commerce', 'nexus_auction', 'nexus_notification'
)
  and table_type = 'BASE TABLE'
group by table_schema
order by table_schema;


-- =====================================================================================
-- PHẦN 3: DANH SÁCH BẢNG nexus_user  <-- kiểm tra bảng users có tồn tại không
-- =====================================================================================
select table_schema, table_name
from information_schema.tables
where table_schema = 'nexus_user'
order by table_name;


-- =====================================================================================
-- PHẦN 4: ***** DỮ LIỆU ĐĂNG KÝ CỦA BẠN *****
--
-- Đây là câu trả lời cho câu hỏi "sao không thấy trong Supabase".
-- Nếu có dòng ở đây -> dữ liệu CÓ trong DB, chỉ là bạn đang xem sai schema
--   (Supabase Table Editor mặc định chỉ hiện schema "public").
-- Nếu 0 dòng -> thật sự chưa ghi được (xem PHẦN 6 để biết backend nối DB nào).
-- =====================================================================================
select
    id,
    email,
    username,
    full_name,
    phone,
    gender,
    status,
    created_at,
    deleted_at
from nexus_user.users
order by created_at desc
limit 50;


-- =====================================================================================
-- PHẦN 5: VAI TRÒ CỦA TỪNG USER
-- =====================================================================================
select
    u.email,
    u.username,
    r.code  as vai_tro,
    ur.assigned_at
from nexus_user.users u
left join nexus_user.user_roles ur on ur.user_id = u.id
left join nexus_user.roles      r  on r.id = ur.role_id
order by u.created_at desc, r.code
limit 100;


-- =====================================================================================
-- PHẦN 6: BACKEND ĐANG KẾT NỐI TỚI ĐÂU  <-- kiểm tra có đúng Supabase không
--
-- Nếu current_database / inet_server_addr không phải Supabase thì backend
-- đang ghi vào chỗ khác (ví dụ PostgreSQL local hoặc H2).
-- =====================================================================================
select
    current_database()                as database_hien_tai,
    current_user                      as user_hien_tai,
    inet_server_addr()                as server_ip,
    inet_server_port()                as server_port,
    version()                         as phien_ban_postgres;


-- =====================================================================================
-- PHẦN 7: TỔNG HỢP 1 DÒNG — chạy riêng câu này nếu chỉ muốn biết ngay kết quả
-- =====================================================================================
select
    (select count(*) from nexus_user.users)       as tong_users,
    (select count(*) from nexus_user.roles)       as tong_roles,
    (select count(*) from nexus_user.user_roles)  as tong_user_roles,
    case
        when (select count(*) from nexus_user.users) > 0
            then 'CO DU LIEU - ban dang xem sai schema trong Supabase'
        else 'KHONG CO DU LIEU - backend chua ghi duoc vao DB nay'
    end as ket_luan;
