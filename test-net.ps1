try {
    $client = [Net.Sockets.TcpClient]::new()
    $client.Connect('app.cloopen.com', 443)
    Write-Host 'app.cloopen.com:443 可连接'
    $client.Close()
} catch {
    Write-Host ('连接失败: ' + $_.Exception.Message)
}
