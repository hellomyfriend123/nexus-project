$root = 'D:\FPTU\semester_6\OJT'
$envFile = Join-Path $root 'backend\.env'
$cfg = @{}
foreach ($l in (Get-Content $envFile)) {
    if ($l -match '^\s*#' -or $l -notmatch '=') { continue }
    $k, $v = $l -split '=', 2
    $cfg[$k.Trim()] = $v.Trim()
}
$dbUrl = $cfg['DB_URL'] -replace '^jdbc:postgresql://', ''
$dbUrl = ($dbUrl -split '\?')[0]
$parts = $dbUrl -split '/'
$hostPort = $parts[0] -split ':'
$env:PGPASSWORD = $cfg['DB_PASSWORD']
$env:PGSSLMODE = 'require'

& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -h $hostPort[0] -p $hostPort[1] -U $cfg['DB_USERNAME'] -d $parts[1] -c "SELECT id, name, status, deleted_at FROM nexus_catalog.products WHERE id IN ('33b151c9-891c-4713-a7aa-8562cc36604e', '18fd3148-9342-43bc-b778-8dadac61e021');"
