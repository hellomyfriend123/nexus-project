# build.ps1 — chạy Maven cho toàn bộ backend Nexus
#
# Vì sao cần script này?
#   Trên máy hiện tại, Maven KHÔNG ghi được vào ~/.m2 (bị chặn quyền), nên project dùng
#   một local repository riêng nằm trong thư mục cha: <repo>/.m2repo
#   Lưu ý: Maven bỏ qua -Dmaven.repo.local truyền trên command line → phải đặt qua MAVEN_OPTS.
#
# Cách dùng:
#   .\build.ps1                 # mvn clean verify (mặc định)
#   .\build.ps1 -o clean compile   # chế độ offline, chỉ compile
#   .\build.ps1 -DskipTests verify
#
param([Parameter(ValueFromRemainingArguments = $true)][string[]]$MavenArgs)

if (-not $MavenArgs -or $MavenArgs.Count -eq 0) {
    $MavenArgs = @('clean', 'verify')
}

$backendDir = $PSScriptRoot

# Tìm .m2repo ở backend/ hoặc các thư mục cha (workaround cho máy build hiện tại,
# nơi Maven không ghi được ~/.m2). Trên máy bình thường không có .m2repo
# → dùng local repository mặc định (~/.m2) của Maven.
$repoLocal = $null
$dir = $backendDir
for ($i = 0; $i -lt 3 -and $dir; $i++) {
    $candidate = Join-Path $dir '.m2repo'
    if (Test-Path $candidate) { $repoLocal = $candidate; break }
    $dir = Split-Path $dir -Parent
}
if ($repoLocal) {
    $env:MAVEN_OPTS = "-Dmaven.repo.local=$repoLocal"
    Write-Host "[build.ps1] Local repo: $repoLocal" -ForegroundColor Cyan
} else {
    Write-Host "[build.ps1] Khong thay .m2repo -> dung ~/.m2 mac dinh cua Maven" -ForegroundColor Cyan
}
Write-Host "[build.ps1] mvn -f $backendDir\pom.xml $($MavenArgs -join ' ')" -ForegroundColor Cyan

# Cài parent POM trước (chỉ POM, không build module con).
# Bắt buộc nếu ai đó build RIÊNG một module (mvn -f nexus-catalog/pom.xml ...):
# khi đó Maven phải resolve được com.nexus:nexus-parent từ local repository.
if (-not $env:NEXUS_SKIP_PARENT_INSTALL) {
    & mvn -f (Join-Path $backendDir 'pom.xml') -B -ntp -N install -DskipTests
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[build.ps1] Cài parent POM thất bại." -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

& mvn -f (Join-Path $backendDir 'pom.xml') -B -ntp @MavenArgs
exit $LASTEXITCODE
