$regBody = @{
    email = 'testuser_' + [System.Guid]::NewGuid().ToString().Substring(0,8) + '@nexus.local'
    username = 'testuser_' + [System.Guid]::NewGuid().ToString().Substring(0,8)
    password = 'Password123@'
    fullName = 'Test User'
    role = 'BUYER'
} | ConvertTo-Json

try {
    Write-Host "Registering user..."
    $reg = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/auth/register' -Method POST -Body $regBody -ContentType 'application/json'
    Write-Host "Registered! Now logging in..."
    $loginBody = @{
        email = ($regBody | ConvertFrom-Json).email
        password = 'Password123@'
    } | ConvertTo-Json
    $auth = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/auth/login' -Method POST -Body $loginBody -ContentType 'application/json'
    Write-Host "Logged in! Access token: $($auth.accessToken.Substring(0,10))..."
    $headers = @{ Authorization = "Bearer " + $auth.accessToken }
    
    Write-Host "--- Calling GET /api/v1/auction/auctions ---"
    $auctions = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/auction/auctions' -Headers $headers
    $auctions.content | ForEach-Object {
        Write-Host "Auction ID: $($_.id), Product ID: $($_.productId), Status: $($_.status)"
        try {
            $p = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/catalog/products/$($_.productId)" -Headers $headers
            Write-Host "   -> Product Found: $($p.name) (status: $($p.status))"
        } catch [System.Net.WebException] {
            $resp = $_.Exception.Response
            if ($resp) {
                $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
                Write-Host "   -> FAILED: $($reader.ReadToEnd())"
            } else {
                Write-Host "   -> FAILED: $($_.Exception.Message)"
            }
        }
    }
} catch [System.Net.WebException] {
    $resp = $_.Exception.Response
    if ($resp) {
        $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
        Write-Host "HTTP Error: " $reader.ReadToEnd()
    } else {
        Write-Host "Error: $($_.Exception.Message)"
    }
}
