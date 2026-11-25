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
$repoLocal = Join-Path (Split-Path $backendDir -Parent) '.m2repo'
$env:MAVEN_OPTS = "-Dmaven.repo.local=$repoLocal"

Write-Host "[build.ps1] MAVEN_OPTS=$env:MAVEN_OPTS" -ForegroundColor Cyan
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
