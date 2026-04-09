#!/usr/bin/env python3
"""
邻盟项目备份脚本
功能：备份项目代码、需求文档，自动清理超过30天的旧备份
"""

import os
import sys
import zipfile
import shutil
from datetime import datetime, timedelta
from pathlib import Path

def log(msg, level='INFO'):
    """打印日志"""
    prefix = {
        'INFO': '\033[94m[INFO]\033[0m',
        'OK': '\033[92m[OK]\033[0m',
        'WARN': '\033[93m[WARN]\033[0m',
        'ERROR': '\033[91m[ERROR]\033[0m'
    }
    print(f"{prefix.get(level, '[INFO]')} {msg}")

def get_git_info(project_root):
    """获取Git版本信息"""
    try:
        import subprocess
        os.chdir(project_root)
        commit = subprocess.check_output(['git', 'rev-parse', '--short', 'HEAD'], 
                                          text=True, stderr=subprocess.DEVNULL).strip()
        branch = subprocess.check_output(['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
                                         text=True, stderr=subprocess.DEVNULL).strip()
        return commit, branch
    except:
        return None, None

def check_uncommitted_changes(project_root):
    """检查并提交未提交的更改"""
    try:
        import subprocess
        os.chdir(project_root)
        status = subprocess.check_output(['git', 'status', '--porcelain'],
                                        text=True, stderr=subprocess.DEVNULL).strip()
        if status:
            log("发现未提交的更改，正在自动提交...", 'WARN')
            subprocess.run(['git', 'add', '-A'], check=True)
            commit_msg = f"backup: {datetime.now().strftime('%Y-%m-%d %H:%M')} 自动备份"
            subprocess.run(['git', 'commit', '-m', commit_msg], check=True)
            log("已自动提交更改", 'OK')
            return True
        return False
    except:
        return False

def create_backup(project_root, backup_dir):
    """创建项目备份"""
    backup_dir = Path(backup_dir)
    backup_dir.mkdir(parents=True, exist_ok=True)
    
    # 生成备份文件名
    timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
    backup_name = f"linmeng_backup_{timestamp}.zip"
    backup_path = backup_dir / backup_name
    
    log(f"开始创建备份: {backup_name}")
    
    # 需要排除的目录
    exclude_dirs = {'node_modules', '.git', 'backups', 'dist', '__pycache__', '.cache'}
    # 需要排除的文件
    exclude_files = {'package-lock.json', 'yarn.lock', '.DS_Store', 'Thumbs.db'}
    
    with zipfile.ZipFile(backup_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(project_root):
            # 过滤目录
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            # 过滤文件
            files = [f for f in files if f not in exclude_files]
            
            for file in files:
                file_path = Path(root) / file
                arcname = file_path.relative_to(project_root)
                try:
                    zipf.write(file_path, arcname)
                except Exception as e:
                    log(f"跳过文件 {file_path}: {e}", 'WARN')
    
    # 获取备份大小
    backup_size = backup_path.stat().st_size / (1024 * 1024)  # MB
    log(f"备份完成！大小: {backup_size:.2f} MB", 'OK')
    
    return backup_path

def cleanup_old_backups(backup_dir, days=30):
    """清理超过指定天数的旧备份"""
    backup_dir = Path(backup_dir)
    if not backup_dir.exists():
        return 0
    
    cutoff_date = datetime.now() - timedelta(days=days)
    deleted_count = 0
    
    for backup_file in backup_dir.glob('linmeng_backup_*.zip'):
        if backup_file.stat().st_mtime < cutoff_date.timestamp():
            backup_file.unlink()
            deleted_count += 1
            log(f"删除旧备份: {backup_file.name}", 'INFO')
    
    if deleted_count > 0:
        log(f"已删除 {deleted_count} 个超过{days}天的旧备份", 'OK')
    else:
        log("没有需要清理的旧备份", 'OK')
    
    return deleted_count

def show_backup_list(backup_dir, count=5):
    """显示最近的备份列表"""
    backup_dir = Path(backup_dir)
    if not backup_dir.exists():
        return
    
    backups = sorted(backup_dir.glob('linmeng_backup_*.zip'), 
                     key=lambda x: x.stat().st_mtime, reverse=True)
    
    log("当前备份列表:", 'INFO')
    for backup in backups[:count]:
        size = backup.stat().st_size / (1024 * 1024)
        mtime = datetime.fromtimestamp(backup.stat().st_mtime).strftime('%Y-%m-%d %H:%M')
        log(f"  {backup.name} - {size:.2f} MB - {mtime}", 'INFO')

def main():
    project_root = r"D:\WorkBuddy\20260331205655"
    backup_dir = os.path.join(project_root, "backups")
    
    print("=" * 50)
    print("邻盟项目备份脚本")
    print("=" * 50)
    print()
    
    # 检查项目路径
    if not os.path.exists(project_root):
        log(f"项目路径不存在: {project_root}", 'ERROR')
        sys.exit(1)
    
    log(f"项目路径: {project_root}")
    log(f"备份路径: {backup_dir}")
    log(f"开始时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # 获取Git版本
    git_commit, git_branch = get_git_info(project_root)
    if git_commit:
        log(f"Git版本: {git_commit} ({git_branch})")
    print()
    
    # 检查并提交未提交的更改
    check_uncommitted_changes(project_root)
    print()
    
    # 创建备份
    create_backup(project_root, backup_dir)
    print()
    
    # 清理旧备份
    cleanup_old_backups(backup_dir)
    print()
    
    # 显示备份列表
    show_backup_list(backup_dir)
    print()
    
    print("=" * 50)
    print(f"备份完成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)

if __name__ == '__main__':
    main()
