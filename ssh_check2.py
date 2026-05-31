import subprocess

def ssh_run(cmd):
    result = subprocess.run(
        ['ssh', '-i', 'D:/WorkBuddy/linmeng2026key.pem', '-o', 'ConnectTimeout=10',
         '-o', 'StrictHostKeyChecking=no', 'ubuntu@150.158.12.243', cmd],
        capture_output=True, timeout=15
    )
    out = result.stdout.decode('utf-8', errors='replace').strip()
    err = result.stderr.decode('utf-8', errors='replace').strip()
    return out, err, result.returncode

# 1. Check server code path
out, err, code = ssh_run('ls /opt/linmeng/server/src/routes/wechat.js 2>&1; echo EXIT:$?')
print(f'wechat.js check: {out}')

out, err, code = ssh_run('ls /opt/linmeng/client/src/views/community/Login.vue 2>&1; echo EXIT:$?')
print(f'Login.vue check: {out}')

# 2. Find where wechat.js actually is
out, err, code = ssh_run('find /opt/linmeng -name "wechat.js" -type f 2>/dev/null | head -5')
print(f'wechat.js locations: {out if out else "(not found)"}')

# 3. PM2 list
out, err, code = ssh_run('pm2 jlist 2>/dev/null | grep -o "\"name\":\"[^\"]*\"" | head -10')
print(f'PM2 services: {out if out else "(none)"}')
