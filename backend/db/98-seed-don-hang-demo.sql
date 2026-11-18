-- =====================================================================================
--  98-seed-don-hang-demo.sql — TẠO ĐƠN HÀNG DEMO CHO SELLER
--
--  Mục đích: bảng nexus_commerce.orders hiện chưa có đơn nào → trang "đơn hàng của tôi"
--  của Seller trống. File này tạo sẵn một bộ đơn trải đủ 5 trạng thái để FE có dữ liệu.
--
--  ------------------------------------------------------------------------------------
--  CÁCH CHẠY (chọn 1 trong 2):
--
--   (A) Supabase Dashboard  ← KHUYẾN NGHỊ, không cần cài gì
--       1. Mở project → "SQL Editor" (biểu tượng >_ ở sidebar trái)
--       2. Copy TOÀN BỘ file này → dán → bấm "Run" (Ctrl+Enter)
--
--   (B) psql
--       psql "$DB_URL" -f db/98-seed-don-hang-demo.sql
--  ------------------------------------------------------------------------------------
--
--  ĐẶC ĐIỂM
--   • TỰ TÌM seller & buyer trong DB — không hard-code UUID, chạy được trên DB nào cũng được.
--   • CHẠY LẠI NHIỀU LẦN KHÔNG BỊ TRÙNG: mã đơn sinh ngẫu nhiên + kiểm tra tồn tại.
--   • KHÔNG DROP / TRUNCATE / DELETE gì cả (đúng CONVENTIONS §10).
--   • Nếu DB chưa có user SELLER hoặc BUYER → RAISE NOTICE hướng dẫn, KHÔNG tạo rác.
--
--  YÊU CẦU TRƯỚC KHI CHẠY
--   • Đã đăng ký ít nhất 1 tài khoản SELLER và 1 tài khoản BUYER qua FE/API.
--     Nếu chưa có, xem PHẦN 0 ở cuối file để biết cách tạo.
-- =====================================================================================


-- =====================================================================================
-- PHẦN 1: XEM TRƯỚC — ai sẽ là seller/buyer của bộ đơn demo?
--
-- Chạy riêng câu này trước nếu muốn biết script sẽ dùng tài khoản nào.
-- Script bên dưới LUÔN chọn: seller cũ nhất (created_at nhỏ nhất), buyer cũ nhất.
-- =====================================================================================
select
    r.code              as vai_tro,
    u.id,
    u.email,
    u.username,
    u.full_name,
    u.created_at
from nexus_user.users u
join nexus_user.user_roles ur on ur.user_id = u.id
join nexus_user.roles      r  on r.id      = ur.role_id
where u.deleted_at is null
  and u.status = 'ACTIVE'
order by r.code, u.created_at;


-- =====================================================================================
-- PHẦN 2: TẠO ĐƠN HÀNG
--
-- 6 đơn, trải đủ 5 trạng thái + 1 đơn đấu giá:
--   PENDING   — chờ seller xác nhận
--   CONFIRMED — seller đã xác nhận
--   SHIPPING  — đang giao
--   COMPLETED — hoàn tất (2 đơn)
--   CANCELLED — đã huỷ
--   + 1 đơn order_type = 'AUCTION'
--
-- created_at được rải về quá khứ để danh sách sắp xếp theo thời gian trông tự nhiên.
-- =====================================================================================
do $$
declare
    v_seller     uuid;
    v_seller_email text;
    v_buyer      uuid;
    v_buyer2     uuid;
    v_order_id   uuid;
    v_order_num  text;
    v_subtotal   numeric(19,2);
    v_shipping   numeric(19,2);
    v_discount   numeric(19,2);
    v_pid        uuid;
    v_pname      text;
    v_price      numeric(19,2);
    v_qty        integer;
    v_created    timestamptz;
    i            integer;
    attempt      integer;
    rec          record;
begin
    -- ---------------------------------------------------------------- tìm seller
    select u.id, u.email into v_seller, v_seller_email
    from nexus_user.users u
    join nexus_user.user_roles ur on ur.user_id = u.id
    join nexus_user.roles      r  on r.id      = ur.role_id
    where r.code = 'SELLER' and u.deleted_at is null and u.status = 'ACTIVE'
    order by u.created_at
    limit 1;

    if v_seller is null then
        raise notice '❌ KHÔNG có tài khoản SELLER nào trong DB — chưa tạo đơn nào.';
        raise notice '   Hãy đăng ký 1 tài khoản SELLER qua FE (chọn "Người bán") rồi chạy lại file này.';
        return;
    end if;

    -- ---------------------------------------------------------------- tìm buyer
    -- Buyer chính: mọi đơn đều thuộc buyer này.
    select u.id into v_buyer
    from nexus_user.users u
    join nexus_user.user_roles ur on ur.user_id = u.id
    join nexus_user.roles      r  on r.id      = ur.role_id
    where r.code = 'BUYER' and u.deleted_at is null and u.status = 'ACTIVE'
      and u.id <> v_seller
    order by u.created_at
    limit 1;

    if v_buyer is null then
        raise notice '❌ KHÔNG có tài khoản BUYER nào trong DB — chưa tạo đơn nào.';
        raise notice '   Hãy đăng ký 1 tài khoản BUYER qua FE rồi chạy lại file này.';
        return;
    end if;

    -- Buyer thứ hai: dùng cho 2 đơn để danh sách trông đa dạng hơn (có thể null).
    select u.id into v_buyer2
    from nexus_user.users u
    join nexus_user.user_roles ur on ur.user_id = u.id
    join nexus_user.roles      r  on r.id      = ur.role_id
    where r.code = 'BUYER' and u.deleted_at is null and u.status = 'ACTIVE'
      and u.id not in (v_seller, v_buyer)
    order by u.created_at
    limit 1;

    if v_buyer2 is null then
        v_buyer2 := v_buyer;
    end if;

    raise notice '→ Seller : % (%)', v_seller_email, v_seller;
    raise notice '→ Buyer  : %', v_buyer;

    -- ---------------------------------------------------------------- 6 đơn demo
    for rec in
        select * from (values
            --  status      order_type  days_ago  n_items  receiver_name       receiver_phone  buy2
            ('PENDING',   'DIRECT',   0,        2,       'Nguyễn Văn An',    '0912345678',   false),
            ('CONFIRMED', 'DIRECT',   1,        1,       'Trần Thị Bình',    '0987654321',   false),
            ('SHIPPING',  'DIRECT',   3,        3,       'Lê Hoàng Cường',   '0905111222',   true),
            ('COMPLETED', 'DIRECT',   8,        2,       'Phạm Thu Dung',    '0933444555',   false),
            ('CANCELLED', 'DIRECT',   11,       1,       'Võ Minh Đức',      '0977888999',   true),
            ('COMPLETED', 'AUCTION',  15,       1,       'Đặng Khánh Linh',  '0966777888',   false)
        ) as t(status, otype, days_ago, n_items, rname, rphone, buy2)
    loop
        v_created := now() - make_interval(days => rec.days_ago::int);

        -- ---- sinh order_number duy nhất: ORD-yyyyMMdd-XXXXXX (giống CheckoutServiceImpl)
        v_order_num := null;
        for attempt in 1..20 loop
            v_order_num := 'ORD-'
                || to_char(v_created, 'YYYYMMDD')
                || '-'
                || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
            if not exists (select 1 from nexus_commerce.orders o where o.order_number = v_order_num) then
                exit;
            end if;
            v_order_num := null;
        end loop;

        if v_order_num is null then
            raise notice '⚠ Không sinh được mã đơn duy nhất, bỏ qua 1 đơn.';
            continue;
        end if;

        v_order_id := gen_random_uuid();

        -- ---- insert đơn với tiền tạm = 0, sẽ cập nhật sau khi biết các dòng hàng
        insert into nexus_commerce.orders (
            id, order_number, buyer_id, seller_id, order_type, status,
            subtotal, discount, shipping_fee, total_amount,
            shipping_address, receiver_name, receiver_phone, discount_code,
            created_at, updated_at
        ) values (
            v_order_id,
            v_order_num,
            case when rec.buy2 then v_buyer2 else v_buyer end,
            v_seller,
            rec.otype,
            rec.status,
            0, 0, 0, 0,
            'Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội',
            rec.rname,
            rec.rphone,
            null,
            v_created,
            v_created
        );

        -- ---- các dòng hàng: ưu tiên sản phẩm THẬT của seller, thiếu thì dùng sản phẩm demo
        v_subtotal := 0;
        for i in 1..rec.n_items loop
            v_pid := null;
            select p.id, p.name, p.base_price
              into v_pid, v_pname, v_price
            from nexus_catalog.products p
            where p.seller_id = v_seller and p.deleted_at is null
            order by p.created_at
            offset (i - 1) limit 1;

            if v_pid is null then
                -- Seller chưa có sản phẩm nào → dùng dữ liệu tổng hợp.
                -- order_items.product_id KHÔNG có FK nên UUID tự sinh là hợp lệ.
                v_pid   := gen_random_uuid();
                v_pname := 'Sản phẩm demo #' || i || ' — đơn ' || v_order_num;
                v_price := (150000 + i * 75000)::numeric(19,2);
            end if;

            v_qty := 1 + (i % 2);          -- 1 hoặc 2

            insert into nexus_commerce.order_items (
                id, order_id, product_id, sku_id, seller_id,
                product_name_snapshot, sku_code_snapshot,
                quantity, unit_price, subtotal, created_at, updated_at
            ) values (
                gen_random_uuid(),
                v_order_id,
                v_pid,
                null,
                v_seller,
                v_pname,
                null,
                v_qty,
                v_price,
                (v_price * v_qty)::numeric(19,2),
                v_created,
                v_created
            );

            v_subtotal := v_subtotal + (v_price * v_qty);
        end loop;

        -- ---- phí ship + giảm giá, rồi cập nhật lại tổng tiền của đơn
        v_shipping := case when rec.otype = 'AUCTION' then 0 else 30000 end;
        v_discount := case when rec.status = 'COMPLETED' then 20000 else 0 end;

        update nexus_commerce.orders
           set subtotal     = v_subtotal,
               discount     = v_discount,
               shipping_fee = v_shipping,
               total_amount = v_subtotal - v_discount + v_shipping,
               updated_at   = v_created
         where id = v_order_id;

        -- ---- đơn đã giao xong thì có thêm bản ghi payment SUCCESS (cho dữ liệu đầy đủ)
        if rec.status = 'COMPLETED' then
            insert into nexus_commerce.payments (
                id, order_id, payment_method, payment_reference,
                amount, status, idempotency_key, paid_at, created_at, updated_at
            ) values (
                gen_random_uuid(),
                v_order_id,
                'MOCK',
                'SEED-' || v_order_num,
                v_subtotal - v_discount + v_shipping,
                'SUCCESS',
                'seed-idem-' || v_order_id,
                v_created + interval '2 hours',
                v_created,
                v_created
            );
        end if;

        raise notice '✓ %  %  (%)  % đ',
            v_order_num, rpad(rec.status::text, 10), rec.otype, v_subtotal - v_discount + v_shipping;
    end loop;

    raise notice '─────────────────────────────────────────────';
    raise notice 'Xong. Đơn của seller % giờ đã có dữ liệu.', v_seller_email;
end $$;


-- =====================================================================================
-- PHẦN 3: KIỂM TRA KẾT QUẢ
-- =====================================================================================

-- 3.1 — Tổng quan: mỗi seller có bao nhiêu đơn, theo trạng thái
select
    u.email              as seller_email,
    o.status,
    count(*)             as so_don,
    sum(o.total_amount)  as tong_tien
from nexus_commerce.orders o
join nexus_user.users u on u.id = o.seller_id
group by u.email, o.status
order by u.email, o.status;

-- 3.2 — Chi tiết đơn mới nhất (giống những gì GET /api/v1/seller/commerce/orders trả về)
select
    o.order_number,
    o.order_type,
    o.status,
    o.total_amount,
    (select count(*) from nexus_commerce.order_items oi where oi.order_id = o.id) as item_count,
    b.email  as buyer_email,
    o.created_at
from nexus_commerce.orders o
join nexus_user.users b on b.id = o.buyer_id
order by o.created_at desc
limit 20;


-- =====================================================================================
-- PHẦN 0 (TUỲ CHỌN): NẾU CHƯA CÓ TÀI KHOẢN SELLER
--
-- Không thể viết cứng mật khẩu trong SQL vì password_hash là BCrypt. Có 2 cách:
--
--  CÁCH 1 (khuyến nghị) — đăng ký qua FE hoặc API:
--      POST http://localhost:8080/api/v1/auth/register
--      { "username":"sellerdemo", "fullName":"Seller Demo",
--        "email":"seller.demo@nexus.local", "password":"Demo@12345",
--        "role":"SELLER" }
--
--  CÁCH 2 — tạo trực tiếp, DÙNG LẠI hash của một tài khoản đã biết mật khẩu.
--           BCrypt hash gắn với mật khẩu, nên tài khoản mới sẽ đăng nhập được
--           bằng ĐÚNG mật khẩu của tài khoản được copy hash.
--           (Bỏ comment khối dưới và sửa 'email-cua-ban@nexus.local' cho đúng.)
-- -------------------------------------------------------------------------------------
-- insert into nexus_user.users (id, email, username, full_name, password_hash, status, created_at)
-- select gen_random_uuid(),
--        'seller.demo@nexus.local',
--        'sellerdemo',
--        'Seller Demo',
--        u.password_hash,
--        'ACTIVE',
--        now()
-- from nexus_user.users u
-- where lower(u.email) = lower('email-cua-ban@nexus.local')
--   and u.deleted_at is null
-- limit 1;
--
-- insert into nexus_user.user_roles (user_id, role_id, assigned_at)
-- select nu.id, r.id, now()
-- from nexus_user.users nu, nexus_user.roles r
-- where lower(nu.email) = lower('seller.demo@nexus.local')
--   and r.code = 'SELLER'
--   and not exists (
--       select 1 from nexus_user.user_roles x
--       where x.user_id = nu.id and x.role_id = r.id
--   );
-- =====================================================================================
