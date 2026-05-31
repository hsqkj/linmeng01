import subprocess

ssh_cmd = [
    'ssh', '-i', r'D:\WorkBuddy\linmeng2026key.pem',
    'ubuntu@150.158.12.243',
    "sed -n '130,145p' /opt/linmeng/server/src/routes/wechat.js"
]
subprocess.run(ssh_cmd, check=False)
