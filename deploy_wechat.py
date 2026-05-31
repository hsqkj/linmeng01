import subprocess

def ssh_run(cmd):
    result = subprocess.run(
        ['ssh', '-i', 'D:/WorkBuddy/linmeng2026key.pem', '-o', 'ConnectTimeout=10',
         '-o', 'StrictHostKeyChecking=no', 'ubuntu@150.158.12.243', cmd],
        capture_output=True, timeout=30
    )
    out = result.stdout.decode('utf-8', errors='replace').strip()
    err = result.stderr.decode('utf-8', errors='replace').strip()
    return out, err, result.returncode

def scp_upload(local, remote):
    result = subprocess.run(
        ['scp', '-i', 'D:/WorkBuddy/linmeng2026key.pem', '-o', 'ConnectTimeout=10',
         '-o', 'StrictHostKeyChecking=no', local, remote],
        capture_output=True, timeout=60
    )
    out = result.stdout.decode('utf-8', errors='replace').strip()
    err = result.stderr.decode('utf-8', errors='replace').strip()
    return out, err, result.returncode

# 1. Backup server wechat.js
print('1. Backing up server wechat.js...')
out, err, code = ssh_run('cp /opt/linmeng/server/src/routes/wechat.js /opt/linmeng/server/src/routes/wechat.js.bak')
print(f'   Backup: {out or err or "OK"}')

# 2. Upload wechat.js
print('2. Uploading wechat.js...')
local = 'D:/WorkBuddy/20260331205655/server/src/routes/wechat.js'
remote = 'ubuntu@150.158.12.243:/opt/linmeng/server/src/routes/wechat.js'
out, err, code = scp_upload(local, remote)
print(f'   Upload: {out or err or "OK"} (exit: {code})')

# 3. Verify upload
print('3. Verifying...')
out, err, code = ssh_run('grep "website-auth" /opt/linmeng/server/src/routes/wechat.js | head -2')
print(f'   Verify: {out or "NOT FOUND"}')

# 4. Restart PM2
print('4. Restarting PM2...')
out, err, code = ssh_run('pm2 restart linmeng-server 2>&1 || cd /opt/linmeng/server && pm2 restart all 2>&1')
print(f'   Restart: {out or err or "done"}')

# 5. Check status
out, err, code = ssh_run('pm2 list 2>&1 | grep -i "linmeng"')
print(f'   Status: {out or err or "check manually"}')
