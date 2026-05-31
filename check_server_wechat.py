import subprocess
import sys

ssh_cmd = [
    'ssh', '-i', r'D:\WorkBuddy\linmeng2026key.pem',
    'ubuntu@150.158.12.243',
    "grep -n 'WEBSITE_APPID\|WEBSITE_SECRET\|website-auth\|redirect_uri\|wechat_redirect' /opt/linmeng/server/src/routes/wechat.js"
]
print('Running:', ' '.join(ssh_cmd))
subprocess.run(ssh_cmd, check=False)
