# =============================================================================
#  kiem-tra-truoc-khi-push.ps1
#
#  Liệt kê CHÍNH XÁC mọi thay đổi trong repo, tách rõ FE / BE / file ngoài,
#  và cảnh báo nếu có file nhạy cảm sắp bị push.
#
#  Chạy:
#    cd D:\FPTU\semester_6\OJT
#    powershell -NoProfile -ExecutionPolicy Bypass -File .\kiem-tra-truoc-khi-push.ps1
# =============================================================================

$ErrorActionPreference = 'Continue'
$repo = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $repo

function Section($t) {
    Write-Host ''
    Write-Host ('=' * 72) -ForegroundColor Cyan
    Write-Host ('  ' + $t) -ForegroundColor Cyan
    Write-Host ('=' * 72) -ForegroundColor Cyan
}

Section 'NHANH HIEN TAI'
$branch = (git rev-parse --abbrev-ref HEAD).Trim()
Write-Host ('  Branch : ' + $branch) -ForegroundColor Yellow
Write-Host ('  Remote :') -ForegroundColor Gray
git remote -v | ForEach-Object { Write-Host ('    ' + $_) }

Section 'COMMIT GAN NHAT'
git log --oneline -8

Section 'TAT CA THAY DOI (git status)'
$status = git status --porcelain
if (-not $status) {
    Write-Host '  (khong co thay doi nao)' -ForegroundColor Green
}
else {
    $status | ForEach-Object {
        $code = $_.Substring(0, 2)
        $path = $_.Substring(3)
        $color = if ($code -match '^\?\?') { 'Gray' }
                 elseif ($code -match '^ M|^M') { 'Yellow' }
                 elseif ($code -match '^A') { 'Green' }
                 else { 'White' }
        Write-Host ("  [{0}] {1}" -f $code, $path) -ForegroundColor $color
    }
}

Write-Host ''
Write-Host '  Chu thich: ?? = file moi chua track | M = da sua | A = moi them' -ForegroundColor DarkGray

Section 'THAY DOI TRONG frontend/  (FE)'
$fe = git status --porcelain -- frontend/
if (-not $fe) { Write-Host '  (khong co)' -ForegroundColor Green }
else {
    $fe | ForEach-Object { Write-Host ('  ' + $_) -ForegroundColor Yellow }
    Write-Host ''
    Write-Host '  --- Diff chi tiet (chi file da track) ---' -ForegroundColor Cyan
    git diff --stat -- frontend/
    git diff -- frontend/
}

Section 'THAY DOI TRONG backend/  (BE)'
$be = git status --porcelain -- backend/
if (-not $be) { Write-Host '  (khong co)' -ForegroundColor Green }
else {
    $be | ForEach-Object { Write-Host ('  ' + $_) -ForegroundColor Yellow }
    Write-Host ''
    Write-Host '  --- Diff chi tiet ---' -ForegroundColor Cyan
    git diff --stat -- backend/
}

Section 'THAY DOI NGOAI frontend/ va backend/'
$other = git status --porcelain |
    Where-Object { $_ -notmatch '\sfrontend/' -and $_ -notmatch '\sbackend/' }
if (-not $other) { Write-Host '  (khong co)' -ForegroundColor Green }
else { $other | ForEach-Object { Write-Host ('  ' + $_) -ForegroundColor Gray } }

Section 'KIEM TRA FILE NGUY HIEM SAP BI PUSH'
$danger = @()
$tracked = git ls-files
foreach ($f in $tracked) {
    if ($f -match '(^|/)\.env$' -or
        $f -match '(^|/)\.env\.local$' -or
        $f -match 'application-secret' -or
        $f -match '\.(pem|p12|jks|keystore)$') {
        $danger += $f
    }
}
if ($danger) {
    Write-Host '  [CANH BAO] Cac file sau dang duoc TRACK va se bi push:' -ForegroundColor Red
    $danger | ForEach-Object { Write-Host ('    ' + $_) -ForegroundColor Red }
    Write-Host '  -> Chay: git rm --cached <file>   roi commit lai' -ForegroundColor Yellow
}
else {
    Write-Host '  OK - khong co .env / .env.local / secret nao duoc track' -ForegroundColor Green
}

Write-Host ''
Write-Host '  Kiem tra mat khau co lot vao file da track khong...' -ForegroundColor Gray
$leak = git grep -l -I -E 'Phuc200424|DB_PASSWORD=[^d]' -- . 2>$null
if ($leak) {
    Write-Host '  [CANH BAO] Phat hien thong tin nhay cam trong file da track:' -ForegroundColor Red
    $leak | ForEach-Object { Write-Host ('    ' + $_) -ForegroundColor Red }
}
else {
    Write-Host '  OK - khong thay mat khau trong file da track' -ForegroundColor Green
}

Section 'FILE BI GITIGNORE (se KHONG duoc push)'
foreach ($p in @('backend\.env', 'frontend\.env.local', 'frontend\node_modules', 'frontend\dist')) {
    $r = git check-ignore -v $p 2>$null
    if ($r) { Write-Host ("  [IGNORED] {0}" -f $p) -ForegroundColor Green }
    elseif (Test-Path $p) { Write-Host ("  [TRACKED!] {0}  <-- NGUY HIEM" -f $p) -ForegroundColor Red }
    else { Write-Host ("  [khong ton tai] {0}" -f $p) -ForegroundColor DarkGray }
}

Section 'TOM TAT'
Write-Host ''
Write-Host '  Neu ban chi muon push BE, dung:' -ForegroundColor Yellow
Write-Host '    git add backend/' -ForegroundColor White
Write-Host '    git commit -m "..."' -ForegroundColor White
Write-Host '    git push' -ForegroundColor White
Write-Host ''
Write-Host '  De xem truoc NOI DUNG se push:' -ForegroundColor Yellow
Write-Host '    git diff --cached' -ForegroundColor White
Write-Host ''

Pop-Location
