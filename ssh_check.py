import subprocess, json, sys

# SSH command helper
def ssh_run(cmd):
    result = subprocess.run(
        ['ssh', '-i', 'D:/WorkBuddy/linmeng2026key.pem', '-o', 'ConnectTimeout=10',
         '-o', 'StrictHostKeyChecking=no', 'ubuntu@150.158.12.243', cmd],
        capture_output=True, text=True, timeout=15
    )
    return result.stdout.strip(), result.stderr.strip(), result.returncode

# 1. Check file exists
out, err, code = ssh_run('ls -la /opt/linmeng/server/src/routes/wechat.js')
print(f'wechat.js: {out if out else err}')

# 2. Check PM2 status
out, err, code = ssh_run('pm2 list')
print(f'PM2: {out[:300] if out else err}')

# 3. Check if Login.vue exists on server
out, err, code = ssh_run('ls -la /opt/linmeng/client/src/views/community/Login.vue 2>&1')
print(f'Login.vue: {out if out else err}')
