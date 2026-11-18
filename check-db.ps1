# =============================================================================
#  check-db.ps1 — Xem dữ liệu đăng ký THẬT SỰ trong Supabase
#
#  Chạy:
#    cd D:\FPTU\semester_6\OJT
#    powershell -NoProfile -ExecutionPolicy Bypass -File .\check-db.ps1
#
#  Đọc thông tin kết nối từ backend\.env (giống hệt backend đang dùng),
#  rồi query trực tiếp schema nexus_user. KHÔNG sửa gì trong backend\.
# =============================================================================

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$envFile = Join-Path $root 'backend\.env'

Write-Host ''
Write-Host '================================================================' -ForegroundColor Cyan
Write-Host '  KIEM TRA DU LIEU TRONG SUPABASE' -ForegroundColor Cyan
Write-Host '================================================================' -ForegroundColor Cyan

# ----------------------------------------------------------------- doc .env
if (-not (Test-Path $envFile)) {
    Write-Host "[LOI] Khong tim thay $envFile" -ForegroundColor Red
    exit 1
}

$cfg = @{}
foreach ($line in (Get-Content $envFile)) {
    if ($line -match '^\s*#' -or $line -notmatch '=') { continue }
    $k, $v = $line -split '=', 2
    $cfg[$k.Trim()] = $v.Trim()
}

$dbUrl = $cfg['DB_URL']
$dbUser = $cfg['DB_USERNAME']
$dbPass = $cfg['DB_PASSWORD']

if (-not $dbUrl) { Write-Host '[LOI] Khong doc duoc DB_URL' -ForegroundColor Red; exit 1 }

# --------------------------------------------- tach host / port / db tu JDBC
$hostPortDb = $dbUrl -replace '^jdbc:postgresql://', ''
$hostPortDb = ($hostPortDb -split '\?')[0]
$parts = $hostPortDb -split '/'
$hostPort = $parts[0]
$dbName = if ($parts.Count -gt 1 -and $parts[1]) { $parts[1] } else { 'postgres' }
$hp = $hostPort -split ':'
$dbHost = $hp[0]
$dbPort = if ($hp.Count -gt 1) { $hp[1] } else { '5432' }

Write-Host ''
Write-Host ("  Host     : {0}:{1}" -f $dbHost, $dbPort) -ForegroundColor Gray
Write-Host ("  Database : {0}" -f $dbName) -ForegroundColor Gray
Write-Host ("  User     : {0}" -f $dbUser) -ForegroundColor Gray

# ---------------------------------- Supabase project ref nam trong username!
if ($dbUser -match '^postgres\.(.+)$') {
    $projRef = $Matches[1]
    Write-Host ''
    Write-Host '  *** SUPABASE PROJECT REF ***' -ForegroundColor Yellow
    Write-Host ("      {0}" -f $projRef) -ForegroundColor Yellow
    Write-Host '      Dashboard phai mo DUNG project nay:' -ForegroundColor Yellow
    Write-Host ("      https://supabase.com/dashboard/project/{0}" -f $projRef) -ForegroundColor Yellow
}

# ------------------------------------------------------------ tim psql.exe
$psql = $null
foreach ($v in @(18, 17, 16, 15, 14)) {
    $p = "C:\Program Files\PostgreSQL\$v\bin\psql.exe"
    if (Test-Path $p) { $psql = $p; break }
}
if (-not $psql) {
    $cmd = Get-Command psql.exe -ErrorAction SilentlyContinue
    if ($cmd) { $psql = $cmd.Source }
}

if (-not $psql) {
    Write-Host ''
    Write-Host '[LOI] Khong tim thay psql.exe tren may.' -ForegroundColor Red
    Write-Host ''
    Write-Host '  CACH KHAC (khong can psql):' -ForegroundColor Yellow
    Write-Host '   1. Mo Supabase Dashboard -> SQL Editor' -ForegroundColor White
    Write-Host '   2. Dan noi dung file check-du-lieu.sql' -ForegroundColor White
    Write-Host '   3. Bam Run' -ForegroundColor White
    exit 1
}

Write-Host ("  psql     : {0}" -f $psql) -ForegroundColor DarkGray

$env:PGPASSWORD = $dbPass
$env:PGSSLMODE = 'require'
$env:PGCONNECT_TIMEOUT = '15'

function Q {
    param([string]$Title, [string]$Sql)
    Write-Host ''
    Write-Host ('--- ' + $Title + ' ---') -ForegroundColor Cyan
    & $psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -v ON_ERROR_STOP=1 -c $Sql 2>&1 |
        ForEach-Object { Write-Host ('    ' + $_) }
    return $LASTEXITCODE
}

# ---------------------------------------------------------------- query
Q 'TAT CA SCHEMA TRONG DB (phai thay nexus_user)' @'
select nspname as schema_name
from pg_catalog.pg_namespace
where nspname not like 'pg_%' and nspname <> 'information_schema'
order by nspname;
'@ | Out-Null

Q 'SO BANG CUA TUNG SCHEMA NEXUS' @'
select table_schema, count(*) as so_bang
from information_schema.tables
where table_schema like 'nexus%' and table_type = 'BASE TABLE'
group by table_schema order by table_schema;
'@ | Out-Null

$rc = Q '***** TAI KHOAN DA DANG KY (nexus_user.users) *****' @'
select email, username, full_name, status, created_at
from nexus_user.users
order by created_at desc
limit 50;
'@

Q 'VAI TRO CUA TUNG TAI KHOAN' @'
select u.email, r.code as vai_tro
from nexus_user.users u
left join nexus_user.user_roles ur on ur.user_id = u.id
left join nexus_user.roles r on r.id = ur.role_id
order by u.created_at desc, r.code;
'@ | Out-Null

$rc2 = Q 'TONG HOP' @'
select (select count(*) from nexus_user.users)      as tong_users,
       (select count(*) from nexus_user.roles)      as tong_roles,
       (select count(*) from nexus_user.user_roles) as tong_user_roles;
'@

# -------------------------------------------------------------- ket luan
Write-Host ''
Write-Host '================================================================' -ForegroundColor Cyan
if ($rc -eq 0) {
    Write-Host '  KET LUAN' -ForegroundColor Green
    Write-Host '================================================================' -ForegroundColor Cyan
    Write-Host ''
    Write-Host '  Du lieu CO trong Supabase: schema [nexus_user], bang [users].' -ForegroundColor Green
    Write-Host ''
    Write-Host '  Ban dang xem sai cho tren Dashboard. Sua nhu sau:' -ForegroundColor Yellow
    Write-Host ''
    Write-Host '  (1) Authentication -> Users : LUON RONG' -ForegroundColor White
    Write-Host '      Do la Supabase Auth (bang auth.users). App nay KHONG dung' -ForegroundColor DarkGray
    Write-Host '      Supabase Auth - tu bam mat khau BCrypt va tu luu vao' -ForegroundColor DarkGray
    Write-Host '      nexus_user.users. Nen muc do rong la BINH THUONG.' -ForegroundColor DarkGray
    Write-Host ''
    Write-Host '  (2) Table Editor : doi schema o dropdown goc tren trai' -ForegroundColor White
    Write-Host '      tu [public] sang [nexus_user]' -ForegroundColor DarkGray
    Write-Host ''
    Write-Host '  (3) Kiem tra DUNG project: xem dong PROJECT REF phia tren,' -ForegroundColor White
    Write-Host '      URL dashboard phai chua dung ref do.' -ForegroundColor DarkGray
}
else {
    Write-Host '  KHONG QUERY DUOC' -ForegroundColor Red
    Write-Host '================================================================' -ForegroundColor Cyan
    Write-Host ''
    Write-Host '  psql tra ve loi. Kiem tra:' -ForegroundColor Yellow
    Write-Host '   - Mat khau trong backend\.env con dung khong' -ForegroundColor White
    Write-Host '   - Mang co ra duoc Supabase khong' -ForegroundColor White
    Write-Host ''
    Write-Host '  Hoac dung SQL Editor cua Supabase voi file check-du-lieu.sql' -ForegroundColor White
}

Write-Host ''
