$file = 'D:\WorkBuddy\20260331205655\client\src\views\community\Profile.vue'
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

# 查找问题模式 - 使用简单的字符串替换
$broken = 'placeholder="绗?灞? style="width:100%"'
$fixed = 'placeholder="绗?灞?" style="width:100%"'

if ($content.Contains($broken)) {
    Write-Host "Found broken pattern"
    $content = $content.Replace($broken, $fixed)
    [System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
    Write-Host "Fixed!"
} else {
    Write-Host "Exact pattern not found, checking..."
    # 打印包含 floor_number 的行
    $lines = $content -split "`n"
    $lineNum = 0
    foreach ($line in $lines) {
        $lineNum++
        if ($line -match "floor_number" -and $line -match "placeholder") {
            Write-Host "Line $lineNum : $line"
        }
    }
}
