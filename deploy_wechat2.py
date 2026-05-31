import subprocess, sys, io

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def ssh_run(cmd):
    result = subprocess.run(
        ['ssh', '-i', 'D:/WorkBuddy/linmeng2026key.pem', '-o', 'ConnectTimeout=10',
         '-o', 'StrictHostKeyChecking=no', 'ubuntu@150.158.12.243', cmd],
        capture_output=True, timeout=30
    )
    out = result.stdout.decode('utf-8', errors='replace').strip()
    err = result.stderr.decode('utf-8', errors='replace').strip()
    return out, err, result.returncode

# 1. Verify wechat.js already uploaded
print('1. Checking if wechat.js has website-auth route...')
out, err, code = ssh_run('grep -c "website-auth" /opt/linmeng/server/src/routes/wechat.js 2>&1')
count = out.strip().split('\n')[-1]
print(f'   website-auth count: {count}')

if '0' in count or 'No such' in count:
    print('   Uploading wechat.js...')
    result = subprocess.run(
        ['scp', '-i', 'D:/WorkBuddy/linmeng2026key.pem', '-o', 'ConnectTimeout=10',
         '-o', 'StrictHostKeyChecking=no',
         'D:/WorkBuddy/20260331205655/server/src/routes/wechat.js',
         'ubuntu@150.158.12.243:/opt/linmeng/server/src/routes/wechat.js'],
        capture_output=True, timeout=60
    )
    print(f'   Upload: {"OK" if result.returncode == 0 else "FAILED"}')
else:
    print('   Already uploaded, skipping SCP')

# 2. Restart PM2
print('2. Restarting linmeng-server...')
out, err, code = ssh_run('pm2 restart linmeng-server 2>&1')
print(f'   Result: {out[:200] if out else err[:200] if err else "done"}')

# 3. Check status
import time; time.sleep(2)
out, err, code = ssh_run('pm2 jlist 2>/dev/null | grep -o "linmeng[^,]*" | head -5')
print(f'   Services: {out or err or "check manually"}')
