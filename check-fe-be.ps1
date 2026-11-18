# =============================================================================
#  check-fe-be.ps1 — Chan doan ket noi Frontend <-> Backend (Nexus)
#
#  Chay:  powershell -NoProfile -ExecutionPolicy Bypass -File .\check-fe-be.ps1
#  (Dat file nay o thu muc goc repo: D:\FPTU\semester_6\OJT)
#
#  Khong sua gi trong backend\. Chi DOC va GOI THU API.
# =============================================================================

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendEnv = Join-Path $root 'backend\.env'
$feEnvLocal = Join-Path $root 'frontend\.env.local'

function Line { param($t) Write-Host ('-' * 74) -ForegroundColor DarkGray }

# -----------------------------------------------------------------------------
Write-Host ''
Write-Host '=== 1. CONG NAO DANG NGHE (LISTENING) ===' -ForegroundColor Cyan

$ports = @(8080, 5173, 5174, 5175, 3000)
foreach ($p in $ports) {
    $conns = @(Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue)
    if ($conns.Count -gt 0) {
        foreach ($c in $conns) {
            $procName = '?'
            try { $procName = (Get-Process -Id $c.OwningProcess -ErrorAction Stop).ProcessName } catch { }
            Write-Host ("  [CO]    {0,-5} -> PID {1,-7} ({2})" -f $p, $c.OwningProcess, $procName) -ForegroundColor Green
        }
    }
    else {
        Write-Host ("  [TRONG] {0}" -f $p) -ForegroundColor DarkGray
    }
}

# -----------------------------------------------------------------------------
Write-Host ''
Write-Host '=== 2. BACKEND CO TRA LOI KHONG ===' -ForegroundColor Cyan

$backendUp = $false
try {
    $h = Invoke-RestMethod -Uri 'http://localhost:8080/actuator/health' -TimeoutSec 10
    $backendUp = $true
    Write-Host ("  [OK]    /actuator/health -> {0}" -f $h.status) -ForegroundColor Green
    if ($h.components -and $h.components.db) {
        $dbStatus = $h.components.db.status
        if ($dbStatus -eq 'UP') {
            Write-Host ("          db = {0}" -f $dbStatus) -ForegroundColor Green
        }
        else {
            Write-Host ("          db = {0}  <-- DATABASE CO VAN DE!" -f $dbStatus) -ForegroundColor Red
        }
    }
}
catch {
    Write-Host ("  [FAIL]  {0}" -f $_.Exception.Message) -ForegroundColor Red
    Write-Host '          -> Backend CHUA chay hoac khong listen o 8080.' -ForegroundColor Yellow
    Write-Host '          -> Chay:  cd D:\FPTU\semester_6\OJT ; .\run-backend.cmd' -ForegroundColor Yellow
}

# -----------------------------------------------------------------------------
Write-Host ''
Write-Host '=== 3. BACKEND CHO PHEP ORIGIN NAO (doc tu backend\.env) ===' -ForegroundColor Cyan

$allowed = @()
if (Test-Path $backendEnv) {
    $line = Get-Content $backendEnv | Where-Object { $_ -match '^\s*CORS_ALLOWED_ORIGINS\s*=' } | Select-Object -First 1
    if ($line) {
        $raw = ($line -split '=', 2)[1].Trim()
        $allowed = @($raw -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
        Write-Host '  CORS_ALLOWED_ORIGINS =' -ForegroundColor Gray
        foreach ($a in $allowed) { Write-Host ("    - {0}" -f $a) -ForegroundColor Gray }
    }
    else {
        Write-Host '  (khong thay CORS_ALLOWED_ORIGINS -> backend dung mac dinh: 3000 + 5173)' -ForegroundColor Yellow
        $allowed = @('http://localhost:3000', 'http://localhost:5173')
    }
}
else {
    Write-Host ('  Khong tim thay ' + $backendEnv) -ForegroundColor Red
    $allowed = @('http://localhost:3000', 'http://localhost:5173')
}

# -----------------------------------------------------------------------------
Write-Host ''
Write-Host '=== 4. FE CUA BAN DANG CHAY O CONG NAO ===' -ForegroundColor Cyan

$fePort = $null
foreach ($p in @(5173, 5174, 5175)) {
    $c = @(Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue)
    if ($c.Count -gt 0) { $fePort = $p; break }
}
if ($fePort) {
    Write-Host ("  Vite dang chay o cong {0}" -f $fePort) -ForegroundColor Green
    $origin = "http://localhost:$fePort"
    $isAllowed = $allowed -contains $origin
    if ($isAllowed) {
        Write-Host ("  Origin {0} CO trong danh sach cho phep -> OK" -f $origin) -ForegroundColor Green
    }
    else {
        Write-Host ("  Origin {0} KHONG co trong danh sach cho phep -> SE BI CHAN CORS!" -f $origin) -ForegroundColor Red
        Write-Host '  >>> DAY LA NGUYEN NHAN. Xem cach sua o phan 6.' -ForegroundColor Red
    }
}
else {
    Write-Host '  Khong thay Vite chay (5173/5174/5175 deu trong).' -ForegroundColor Yellow
    Write-Host '  -> Chay:  cd D:\FPTU\semester_6\OJT\frontend ; npm run dev' -ForegroundColor Yellow
}

# -----------------------------------------------------------------------------
Write-Host ''
Write-Host '=== 5. GOI THU API TU TUNG ORIGIN (kiem tra CORS that) ===' -ForegroundColor Cyan
Write-Host '   (Dung sai mat khau -> ky vong 401. Da 401 = CORS THONG. Loi mang = CORS CHAN)' -ForegroundColor DarkGray

$origins = @('http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://localhost:3000')
$body = '{"email":"probe.cors@nexus.local","password":"WrongPass123"}'

foreach ($o in $origins) {
    $acao = $null
    $code = $null
    $errMsg = $null
    try {
        $r = Invoke-WebRequest -Uri 'http://localhost:8080/api/v1/auth/login' -Method POST `
            -ContentType 'application/json' -Body $body -Headers @{ Origin = $o } `
            -UseBasicParsing -TimeoutSec 10
        $code = [int]$r.StatusCode
        $acao = $r.Headers['Access-Control-Allow-Origin']
    }
    catch {
        $resp = $_.Exception.Response
        if ($resp) {
            $code = [int]$resp.StatusCode
            try { $acao = $resp.Headers['Access-Control-Allow-Origin'] } catch { }
        }
        else {
            $errMsg = $_.Exception.Message
        }
    }

    if ($errMsg) {
        Write-Host ("  {0,-26} -> LOI MANG: {1}" -f $o, $errMsg) -ForegroundColor Red
    }
    elseif ($acao) {
        $match = 'KHONG KHOP'
        if ($acao -eq $o) { $match = 'KHOP' }
        Write-Host ("  {0,-26} -> HTTP {1}, ACAO={2} ({3})" -f $o, $code, $acao, $match) -ForegroundColor Green
    }
    else {
        Write-Host ("  {0,-26} -> HTTP {1}, KHONG co ACAO  <-- BI CHAN CORS" -f $o, $code) -ForegroundColor Red
    }
}

# -----------------------------------------------------------------------------
Write-Host ''
Write-Host '=== 6. KET LUAN ===' -ForegroundColor Cyan
Line

if (-not $backendUp) {
    Write-Host '  Backend chua chay. Khoi dong truoc:' -ForegroundColor Red
    Write-Host '      cd D:\FPTU\semester_6\OJT' -ForegroundColor White
    Write-Host '      .\run-backend.cmd' -ForegroundColor White
}
elseif ($fePort -and ($allowed -notcontains "http://localhost:$fePort")) {
    Write-Host ("  FE dang chay o cong {0}, nhung backend chi cho phep:" -f $fePort) -ForegroundColor Red
    foreach ($a in $allowed) { Write-Host ("      {0}" -f $a) -ForegroundColor Gray }
    Write-Host ''
    Write-Host '  CACH SUA (chon 1):' -ForegroundColor Yellow
    Write-Host '   (a) Chay FE dung cong 5173 (phep backend da cho):' -ForegroundColor White
    Write-Host '       cd D:\FPTU\semester_6\OJT\frontend' -ForegroundColor White
    Write-Host '       npm run dev -- --port 5173 --strictPort' -ForegroundColor White
    Write-Host '       (--strictPort: bao loi neu ban, KHONG tu nhay sang cong khac)' -ForegroundColor DarkGray
    Write-Host ''
    Write-Host '   (b) Hoac them cong do vao backend\.env roi KHOI DONG LAI backend:' -ForegroundColor White
    Write-Host ('       CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:' + $fePort) -ForegroundColor White
}
else {
    Write-Host '  Cau hinh FE <-> BE khop nhau.' -ForegroundColor Green
    Write-Host '  Neu van loi, xem huong dan go loi CORS trong HUONG-DAN-CHAY-FRONTEND.md' -ForegroundColor Gray
}

Write-Host ''
Write-Host '=== 7. FE dang goi API toi dau ===' -ForegroundColor Cyan
if (Test-Path $feEnvLocal) {
    Get-Content $feEnvLocal | ForEach-Object { Write-Host ("  {0}" -f $_) -ForegroundColor Gray }
}
else {
    Write-Host '  Khong co frontend\.env.local -> FE dung mac dinh http://localhost:8080' -ForegroundColor Yellow
    Write-Host '  (mac dinh nay la dung nen khong phai nguyen nhan)' -ForegroundColor DarkGray
}

Write-Host ''
Write-Host 'Xong. Doc phan [6. KET LUAN] o tren.' -ForegroundColor Cyan
Write-Host ''
