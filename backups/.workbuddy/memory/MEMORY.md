# 长期记忆

- 2026-04-02：邻盟项目的备份脚本 `backups/backup.py` 会在检测到未提交更改时自动执行 `git add -A` 与 `git commit`，随后生成 `backups/linmeng_backup_*.zip`。
- 2026-04-02：当前存在“邻盟项目每日备份”自动任务，每天 23:00 运行上述备份脚本。
