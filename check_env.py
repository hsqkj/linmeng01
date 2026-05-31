import subprocess

ssh_cmd = [
    'ssh', '-i', r'D:\WorkBuddy\linmeng2026key.pem',
    'ubuntu@150.158.12.243',
    '''grep -i "WEBSITE\\|WECHAT.*WEBSITE\\|WEBSITE_SECRET\\|WEBSITE_REDIR\\|FRONTEND_BASE" /opt/linmeng/server/.env /opt/linmeng/.env 2>/dev/null || echo "NO ENV FOUND"'''
]
subprocess.run(ssh_cmd, check=False)
