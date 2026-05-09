$file = 'D:\WorkBuddy\20260331205655\client\src\views\community\Profile.vue'
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

# 打印包含 floor_number 的行
$lines = $content -split "`n"
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "floor_number" -and $lines[$i] -match "placeholder") {
        Write-Host "Line $($i+1):"
        Write-Host $lines[$i]
        # 提取从 placeholder=" 到 style= 之间的字符
        if ($lines[$i] -match 'placeholder="([^"]+)" style=') {
            Write-Host "OK - has closing quote"
        } elseif ($lines[$i] -match 'placeholder="([^"]+?) style=') {
            Write-Host "Missing closing quote! Value: $($Matches[1])"
            # 修复
            $broken = $Matches[1]
            $fixed = $broken -replace '\? style=', '?" style='
            $oldStr = "placeholder=""$broken style="
            $newStr = "placeholder=""$broken"" style="
            $lines[$i] = $lines[$i] -replace [regex]::Escape($oldStr), $newStr
            Write-Host "Fixed line: $($lines[$i])"
        }
    }
}

# 保存
$content = $lines -join "`n"
[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
Write-Host "File saved"
