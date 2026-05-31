import subprocess

ssh_cmd = [
    'ssh', '-i', r'D:\WorkBuddy\linmeng2026key.pem',
    'ubuntu@150.158.12.243',
    "grep -A3 'redirect_uri.*encode' /opt/linmeng/server/src/routes/wechat.js"
]
subprocess.run(ssh_cmd, check=False)
