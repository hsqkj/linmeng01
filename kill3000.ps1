Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force
}
