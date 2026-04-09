# 邻盟项目备份脚本
# 功能：备份项目代码、需求文档，自动清理超过30天的旧备份

param(
    [switch]$Auto  # 自动模式（无交互）
)

$ProjectRoot = "C:\Users\12494\WorkBuddy\20260331205655"
$BackupDir = Join-Path $ProjectRoot "backups"
$Date = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BackupName = "linmeng_backup_$Date.zip"
$BackupPath = Join-Path $BackupDir $BackupName

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "邻盟项目备份脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 创建备份目录（如果不存在）
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

# 显示备份信息
Write-Host "[INFO] 项目路径: $ProjectRoot" -ForegroundColor Green
Write-Host "[INFO] 备份路径: $BackupPath" -ForegroundColor Green
Write-Host "[INFO] 开始备份时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Green
Write-Host ""

# 检查是否有未提交的更改
Push-Location $ProjectRoot
$gitStatus = git status --porcelain 2>$null
if ($gitStatus) {
    Write-Host "[WARN] 发现未提交的更改，正在自动提交..." -ForegroundColor Yellow
    git add -A
    $commitMsg = "backup: $(Get-Date -Format 'yyyy-MM-dd HH:mm') 自动备份"
    git commit -m $commitMsg
    Write-Host "[OK] 已自动提交更改" -ForegroundColor Green
    Write-Host ""
}

# 获取Git版本信息
$gitCommit = git rev-parse --short HEAD 2>$null
$gitBranch = git rev-parse --abbrev-ref HEAD 2>$null
Write-Host "[INFO] Git版本: $gitCommit ($gitBranch)" -ForegroundColor Gray
Write-Host ""

Pop-Location

# 执行备份
Write-Host "[备份中...]" -ForegroundColor Cyan

# 使用PowerShell压缩文件
try {
    # 创建临时目录用于备份
    $TempDir = Join-Path $env:TEMP "linmeng_backup_temp_$PID"
    New-Item -ItemType Directory -Path $TempDir -Force | Out-Null

    # 复制项目文件（排除node_modules和其他大文件）
    $excludeDirs = @('node_modules', '.git', 'backups', 'dist')
    $includeExtensions = @('*.vue', '*.js', '*.json', '*.md', '*.html', '*.css', '*.txt', '*.yml', '*.yaml')

    # 复制主项目文件
    Get-ChildItem -Path $ProjectRoot -File | Where-Object {
        $_.Name -ne '.gitignore' -and $_.Name -ne 'backup.ps1'
    } | Copy-Item -Destination $TempDir -Force

    # 复制必要目录
    $dirsToCopy = @('client\src', 'server', 'backups')
    foreach ($dir in $dirsToCopy) {
        $srcPath = Join-Path $ProjectRoot $dir
        $destPath = Join-Path $TempDir $dir
        if (Test-Path $srcPath) {
            # 排除node_modules
            Get-ChildItem -Path $srcPath -Recurse -File | Where-Object {
                $_.FullName -notlike '*node_modules*'
            } | ForEach-Object {
                $relativePath = $_.FullName.Substring($srcPath.Length + 1)
                $destFile = Join-Path $destPath $relativePath
                $destDir = Split-Path $destFile -Parent
                if (-not (Test-Path $destDir)) {
                    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
                }
                Copy-Item $_.FullName -Destination $destFile -Force
            }
        }
    }

    # 复制.gitignore
    Copy-Item (Join-Path $ProjectRoot ".gitignore") -Destination $TempDir -Force

    # 创建压缩包
    Compress-Archive -Path "$TempDir\*" -DestinationPath $BackupPath -Force

    # 清理临时目录
    Remove-Item -Path $TempDir -Recurse -Force

    # 获取备份文件大小
    $backupSize = (Get-Item $BackupPath).Length / 1MB
    Write-Host "[OK] 备份完成！" -ForegroundColor Green
    Write-Host "[INFO] 备份文件: $BackupPath" -ForegroundColor Gray
    Write-Host "[INFO] 备份大小: $([math]::Round($backupSize, 2)) MB" -ForegroundColor Gray
}
catch {
    Write-Host "[ERROR] 备份失败: $_" -ForegroundColor Red
    exit 1
}

# 清理旧备份（保留最近30天）
Write-Host ""
Write-Host "[清理旧备份...]" -ForegroundColor Cyan
$cutoffDate = (Get-Date).AddDays(-30)
$oldBackups = Get-ChildItem -Path $BackupDir -Filter "linmeng_backup_*.zip" | Where-Object {
    $_.LastWriteTime -lt $cutoffDate
}
if ($oldBackups) {
    $count = $oldBackups.Count
    $oldBackups | Remove-Item -Force
    Write-Host "[OK] 已删除 $count 个超过30天的旧备份" -ForegroundColor Green
} else {
    Write-Host "[OK] 没有需要清理的旧备份" -ForegroundColor Gray
}

# 显示当前备份列表
Write-Host ""
Write-Host "当前备份列表:" -ForegroundColor White
Get-ChildItem -Path $BackupDir -Filter "linmeng_backup_*.zip" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 5 |
    ForEach-Object {
        $size = [math]::Round($_.Length / 1MB, 2)
        Write-Host "  $($_.Name) - $([math]::Round($size, 2)) MB - $($_.LastWriteTime.ToString('yyyy-MM-dd HH:mm'))" -ForegroundColor Gray
    }

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "备份完成时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
