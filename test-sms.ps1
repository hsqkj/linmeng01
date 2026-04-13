$body = '{"phone":"13900001111","type":"register"}'
$headers = @{'Content-Type'='application/json'}
try {
    $resp = Invoke-WebRequest -Uri 'http://localhost:3000/api/public/sms/send' -Method POST -Headers $headers -Body $body -TimeoutSec 10
    Write-Host "Status:" $resp.StatusCode
    Write-Host "Response:" $resp.Content
} catch {
    Write-Host "Error Status:" $_.Exception.Response.StatusCode
    Write-Host "Error Body:" $_.Exception.Response
}
