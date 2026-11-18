-- =====================================================================================
--  SO SANH 2 KHO TAI KHOAN — chay tren Supabase SQL Editor
--
--  Tra loi cau hoi: "Authentication -> Users co user, sao backend khong thay?"
--
--  CACH CHAY: Supabase Dashboard -> SQL Editor -> dan -> Run
-- =====================================================================================


-- =====================================================================================
-- PHAN 1: SO SANH TRUC TIEP 2 BANG
--
--   auth.users        = Supabase Auth (SDK @supabase/supabase-js, RLS, JWT cua Supabase)
--   nexus_user.users  = Backend Spring Boot cua ban (BCrypt + HMAC token tu viet)
--
--   Hai bang nay KHONG LIEN QUAN GI. Cung ten "users" nhung khac hoan toan.
-- =====================================================================================
select
    'auth.users (Supabase Auth)'      as kho,
    count(*)                          as so_tai_khoan
from auth.users

union all

select
    'nexus_user.users (Backend)'      as kho,
    count(*)                          as so_tai_khoan
from nexus_user.users;


-- =====================================================================================
-- PHAN 2: CHI TIET auth.users — nhung user Supabase quan ly
--
-- Day la nhung gi ban thay o Authentication -> Users.
-- Cot encrypted_password la hash do Supabase Auth (GoTrue) quan ly — backend KHONG doc.
-- =====================================================================================
select
    id,
    email,
    created_at,
    last_sign_in_at,
    email_confirmed_at,
    case
        when encrypted_password is null then 'KHONG CO MAT KHAU (chi OAuth/magic link)'
        else 'Co mat khau (hash cua GoTrue)'
    end as trang_thai_mat_khau
from auth.users
order by created_at desc
limit 50;


-- =====================================================================================
-- PHAN 3: CHI TIET nexus_user.users — tai khoan BACKEND cua ban
--
-- Day la noi 3 tai khoan ban vua dang ky qua FE nam.
-- Cot password_hash la BCrypt do Spring Security tao.
-- =====================================================================================
select
    id,
    email,
    username,
    full_name,
    status,
    created_at
from nexus_user.users
order by created_at desc
limit 50;


-- =====================================================================================
-- PHAN 4: CO TRUNG EMAIL GIUA 2 KHO KHONG?
--
-- Neu co dong o day: cung 1 email ton tai o CA HAI noi (dang ky 2 lan, 2 cach khac nhau).
-- Neu 0 dong: hoan toan doc lap — dung nhu thiet ke.
-- =====================================================================================
select
    au.email        as email_trong_auth_users,
    nu.email        as email_trong_nexus_user,
    au.created_at   as tao_luc_auth,
    nu.created_at   as tao_luc_backend
from auth.users au
join nexus_user.users nu on lower(au.email) = lower(nu.email)
order by au.created_at desc;


-- =====================================================================================
-- PHAN 5: KIEM TRA DANG NHAP THUC TE
--
-- Chay cau nay de biet 1 email co dang nhap duoc qua BACKEND khong:
--   - Co dong  -> dang nhap duoc (backend doc bang nay)
--   - 0 dong   -> KHONG dang nhap duoc, du co thay trong Authentication -> Users
-- =====================================================================================
select
    email,
    username,
    status,
    'DANG NHAP DUOC qua backend' as ket_qua
from nexus_user.users
where lower(email) in (
    lower('hello@gmail.com'),
    lower('hello1111@gmail.com'),
    lower('teodeptrai@gmail.com')
)
  and deleted_at is null;
