-- =====================================================================================
--  KIEM-TRA-DON-HANG-SUPABASE.sql
--
--  Mục đích: trả lời dứt điểm 1 câu hỏi —
--            "Đơn hàng demo đã thật sự nằm trong Supabase chưa?"
--
--  CÁCH CHẠY:
--    1. Mở https://supabase.com/dashboard/project/vsoqpxgcbjxdrzevimvm
--       (project ref lấy từ DB_USERNAME trong backend/.env)
--    2. Sidebar trái → "SQL Editor" (biểu tượng >_)
--    3. Dán TOÀN BỘ file này → bấm "Run" (Ctrl+Enter)
--
--  ĐỌC KẾT QUẢ: chạy từng PHẦN từ trên xuống, dừng ở phần đầu tiên có vấn đề.
--  Thứ tự được thiết kế để loại trừ nguyên nhân: schema có → bảng có → đơn có → ai sở hữu.
-- =====================================================================================


-- =====================================================================================
-- PHẦN 1: TÔI ĐANG KẾT NỐI TỚI ĐÂU?  ← chạy đầu tiên, luôn luôn
--
-- Nếu câu này KHÔNG trả về host chứa "pooler.supabase.com" và database "postgres"
-- thì bạn đang mở SAI project, hoặc đây không phải Supabase. Mọi kết quả bên dưới vô nghĩa.
-- =====================================================================================
select
    current_database()                    as database_hien_tai,
    current_user                          as user_hien_tai,
    inet_server_addr()::text              as server_ip,
    inet_server_port()                    as server_port,
    version()                             as phien_ban_postgres,
    now()                                 as thoi_diem_chay;


-- =====================================================================================
-- PHẦN 2: SCHEMA NEXUS ĐÃ TỒN TẠI CHƯA?
--
-- Nếu PHẦN 2 này KHÔNG có nexus_commerce → backend chưa từng tạo schema trên DB này.
-- =====================================================================================
select
    nspname as schema_name
from pg_catalog.pg_namespace
where nspname in (
    'nexus_user', 'nexus_catalog', 'nexus_fulfillment',
    'nexus_commerce', 'nexus_auction', 'nexus_notification'
)
order by nspname;


-- =====================================================================================
-- PHẦN 3: BẢNG orders CÓ TỒN TẠI VÀ CÓ BAO NHIÊU DÒNG?  ← câu trả lời chính
--
--   tong_don = 0        → bảng có nhưng CHƯA chạy file seed → chạy 98-seed-don-hang-demo.sql
--   (không có dòng)     → bảng chưa tồn tại → chưa tạo schema/bảng
-- =====================================================================================
select count(*) as tong_don_hang
from nexus_commerce.orders;


-- =====================================================================================
-- PHẦN 4: CHI TIẾT TỪNG ĐƠN (nếu PHẦN 3 > 0)
--
-- Đây là những gì FE sẽ hiển thị. Chạy lại sau mỗi lần seed để thấy đơn mới.
-- =====================================================================================
select
    o.order_number,
    o.status,
    o.order_type,
    o.total_amount,
    (select count(*) from nexus_commerce.order_items oi where oi.order_id = o.id) as so_dong_hang,
    s.email  as seller_email,
    b.email  as buyer_email,
    o.created_at
from nexus_commerce.orders o
left join nexus_user.users s on s.id = o.seller_id
left join nexus_user.users b on b.id = o.buyer_id
order by o.created_at desc
limit 30;


-- =====================================================================================
-- PHẦN 5: ***** QUAN TRỌNG NHẤT *****
--          SELLER NÀO ĐANG SỞ HỮU ĐƠN, VÀ TÔI ĐĂNG NHẬP BẰNG AI?
--
-- Đây là cái bẫy hay gặp: đơn CÓ trong DB nhưng FE vẫn TRỐNG, vì bạn đăng nhập
-- bằng một tài khoản SELLER KHÁC với seller mà script đã chọn (script chọn seller
-- cũ nhất — created_at nhỏ nhất).
--
-- Cách đọc:
--   • Cột so_don > 0 ở dòng nào → đăng nhập bằng email dòng đó thì API trả về đơn.
--   • Nếu email bạn dùng để đăng nhập KHÔNG có trong danh sách này → FE trống là ĐÚNG,
--     không phải lỗi.
-- =====================================================================================
select
    u.email               as seller_email,
    u.id                  as seller_id,
    u.status              as trang_thai_tai_khoan,
    u.created_at          as tao_luc,
    count(o.id)           as so_don,
    coalesce(sum(o.total_amount), 0) as tong_tien
from nexus_user.users u
join nexus_user.user_roles ur on ur.user_id = u.id
join nexus_user.roles      r  on r.id      = ur.role_id
left join nexus_commerce.orders o on o.seller_id = u.id
where r.code = 'SELLER'
  and u.deleted_at is null
group by u.email, u.id, u.status, u.created_at
order by so_don desc, u.created_at;


-- =====================================================================================
-- PHẦN 6: TỔNG HỢP 1 DÒNG — KẾT LUẬN TỰ ĐỘNG
--
-- Nếu bạn chỉ chạy được MỘT câu trong cả file này, hãy chạy câu này.
-- =====================================================================================
with so_lieu as (
    select
        (select count(*) from nexus_commerce.orders)       as don_hang,
        (select count(*) from nexus_commerce.order_items)  as dong_hang,
        (select count(*) from nexus_commerce.payments)     as thanh_toan,
        (select count(*) from nexus_user.users where deleted_at is null) as nguoi_dung,
        (select count(*) from nexus_catalog.products where deleted_at is null) as san_pham,
        (select count(*) from nexus_user.users u
           join nexus_user.user_roles ur on ur.user_id = u.id
           join nexus_user.roles r on r.id = ur.role_id
          where r.code = 'SELLER' and u.deleted_at is null) as so_seller
)
select
    nguoi_dung, so_seller, san_pham, don_hang, dong_hang, thanh_toan,
    case
        when so_seller = 0
            then '❌ CHUA CO TAI KHOAN SELLER — dang ky 1 tai khoan SELLER truoc'
        when don_hang = 0
            then '❌ CHUA CO DON HANG — hay chay file 98-seed-don-hang-demo.sql'
        when dong_hang = 0
            then '⚠ CO DON NHUNG KHONG CO DONG HANG — don bi tao thieu, chay lai seed'
        else '✅ DA CO DU LIEU — ' || don_hang || ' don hang, san sang de FE hien thi'
    end as ket_luan
from so_lieu;


-- =====================================================================================
-- PHẦN 7: NẾU PHẦN 3 BÁO 0 DÒNG — CHẠY CÂU NÀY ĐỂ BIẾT VÌ SAO
--
-- Liệt kê mọi bảng đang có trong schema nexus_commerce.
-- Thiếu bảng nào so với db/04-commerce.sql là biết schema chưa được tạo đủ.
-- =====================================================================================
select
    table_name,
    (select count(*) from information_schema.columns c
      where c.table_schema = t.table_schema and c.table_name = t.table_name) as so_cot
from information_schema.tables t
where t.table_schema = 'nexus_commerce'
  and t.table_type = 'BASE TABLE'
order by t.table_name;
