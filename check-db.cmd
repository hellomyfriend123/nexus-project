@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul 2>&1

REM ============================================================================
REM  check-db.cmd - Xem du lieu dang ky THAT SU trong Supabase
REM
REM  Doc thong tin ket noi tu backend\.env (giong het backend dang dung),
REM  roi query truc tiep schema nexus_user. KHONG sua gi trong backend\.
REM
REM  Cach dung:  check-db.cmd          -> xem tai khoan + vai tro
REM              check-db.cmd schemas  -> xem tat ca schema co trong DB
REM              check-db.cmd tables   -> xem tat ca bang cua Nexus
REM ============================================================================

set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"
set "ENV_FILE=%ROOT_DIR%\backend\.env"
set "MODE=%~1"
if "%MODE%"=="" set "MODE=users"

if not exist "%ENV_FILE%" (
    echo [LOI] Khong tim thay: %ENV_FILE%
    goto :fail
)

REM ---------------------------------------------------------------- doc .env
set "DB_URL="
set "DB_USERNAME="
set "DB_PASSWORD="

for /f "usebackq tokens=1,* delims==" %%a in (`findstr /R /C:"^DB_URL=" /C:"^DB_USERNAME=" /C:"^DB_PASSWORD=" "%ENV_FILE%"`) do (
    if /I "%%a"=="DB_URL"      set "DB_URL=%%b"
    if /I "%%a"=="DB_USERNAME" set "DB_USERNAME=%%b"
    if /I "%%a"=="DB_PASSWORD" set "DB_PASSWORD=%%b"
)

if "%DB_URL%"=="" (
    echo [LOI] Khong doc duoc DB_URL tu %ENV_FILE%
    goto :fail
)

REM ------------------------------------------- tach host / port / db tu JDBC URL
set "TMP=!DB_URL:jdbc:postgresql://=!"
for /f "tokens=1 delims=?" %%x in ("!TMP!") do set "TMP=%%x"
for /f "tokens=1,2 delims=/" %%x in ("!TMP!") do (
    set "HOSTPORT=%%x"
    set "DBNAME=%%y"
)
for /f "tokens=1,2 delims=:" %%x in ("!HOSTPORT!") do (
    set "DB_HOST=%%x"
    set "DB_PORT=%%y"
)
if "!DB_PORT!"=="" set "DB_PORT=5432"
if "!DBNAME!"==""  set "DBNAME=postgres"

REM ----------------------------------------------------------- tim psql.exe
set "PSQL="
for %%v in (18 17 16 15 14) do (
    if not defined PSQL if exist "C:\Program Files\PostgreSQL\%%v\bin\psql.exe" set "PSQL=C:\Program Files\PostgreSQL\%%v\bin\psql.exe"
)
if not defined PSQL (
    for /f "delims=" %%p in ('where psql 2^>nul') do if not defined PSQL set "PSQL=%%p"
)
if not defined PSQL (
    echo [LOI] Khong tim thay psql.exe
    echo       Cai PostgreSQL hoac them thu muc bin cua no vao PATH.
    echo.
    echo       HOAC dung cach khong can psql:
    echo       Mo Supabase Dashboard -^> SQL Editor -^> dan file check-du-lieu.sql
    goto :fail
)

set "PGPASSWORD=!DB_PASSWORD!"
set "PGSSLMODE=require"
set "PGCONNECT_TIMEOUT=15"

echo.
echo ============================================================
echo   Ket noi : !DB_HOST!:!DB_PORT!/!DBNAME!
echo   User    : !DB_USERNAME!
echo   psql    : !PSQL!
echo ============================================================
echo.

if /I "!MODE!"=="schemas" goto :q_schemas
if /I "!MODE!"=="tables"  goto :q_tables

REM ------------------------------------------------------------------ users
echo --- TAT CA SCHEMA TRONG DB (phai thay nexus_user) ---
"!PSQL!" -h !DB_HOST! -p !DB_PORT! -U !DB_USERNAME! -d !DBNAME! -v ON_ERROR_STOP=1 -c "select nspname as schema_name from pg_catalog.pg_namespace where nspname not like 'pg_%%' and nspname <> 'information_schema' order by nspname;"
echo.
echo --- SO BANG CUA TUNG SCHEMA NEXUS ---
"!PSQL!" -h !DB_HOST! -p !DB_PORT! -U !DB_USERNAME! -d !DBNAME! -v ON_ERROR_STOP=1 -c "select table_schema, count(*) as so_bang from information_schema.tables where table_schema like 'nexus%%' and table_type='BASE TABLE' group by table_schema order by table_schema;"
echo.
echo --- ***** TAI KHOAN DA DANG KY (nexus_user.users) ***** ---
"!PSQL!" -h !DB_HOST! -p !DB_PORT! -U !DB_USERNAME! -d !DBNAME! -v ON_ERROR_STOP=1 -c "select email, username, full_name, status, created_at from nexus_user.users order by created_at desc limit 50;"
echo.
echo --- VAI TRO CUA TUNG TAI KHOAN ---
"!PSQL!" -h !DB_HOST! -p !DB_PORT! -U !DB_USERNAME! -d !DBNAME! -v ON_ERROR_STOP=1 -c "select u.email, r.code as vai_tro from nexus_user.users u left join nexus_user.user_roles ur on ur.user_id=u.id left join nexus_user.roles r on r.id=ur.role_id order by u.created_at desc, r.code;"
echo.
echo --- TONG HOP ---
"!PSQL!" -h !DB_HOST! -p !DB_PORT! -U !DB_USERNAME! -d !DBNAME! -v ON_ERROR_STOP=1 -c "select (select count(*) from nexus_user.users) as tong_users, (select count(*) from nexus_user.roles) as tong_roles, (select count(*) from nexus_user.user_roles) as tong_user_roles;"
goto :sua

:q_schemas
"!PSQL!" -h !DB_HOST! -p !DB_PORT! -U !DB_USERNAME! -d !DBNAME! -v ON_ERROR_STOP=1 -c "select nspname as schema_name, pg_catalog.pg_get_userbyid(nspowner) as owner from pg_catalog.pg_namespace where nspname not like 'pg_%%' and nspname <> 'information_schema' order by nspname;"
goto :sua

:q_tables
"!PSQL!" -h !DB_HOST! -p !DB_PORT! -U !DB_USERNAME! -d !DBNAME! -v ON_ERROR_STOP=1 -c "select table_schema, table_name from information_schema.tables where table_schema like 'nexus%%' and table_type='BASE TABLE' order by table_schema, table_name;"
goto :sua

:sua
if errorlevel 1 (
    echo.
    echo [CANH BAO] psql tra ve loi. Kiem tra mat khau / ket noi mang trong backend\.env
    goto :fail
)
echo.
echo ============================================================
echo   XONG.
echo.
echo   Neu o tren CO danh sach tai khoan thi du lieu dang nam trong
echo   Supabase schema [nexus_user], bang [users].
echo.
echo   Tren Supabase Dashboard, Table Editor mac dinh chi hien schema
echo   [public] - KHONG phai cho chua du lieu nay. Hay:
echo     1. Vao Authentication -^> Users : LUON RONG (app khong dung
echo        Supabase Auth, ma tu luu vao nexus_user.users)
echo     2. Vao Table Editor -^> doi dropdown [public] thanh [nexus_user]
echo ============================================================
endlocal
exit /b 0

:fail
echo.
endlocal
exit /b 1
