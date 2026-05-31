import subprocess, sys, io

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

print('=== 1. Start linmeng-server via PM2 ===')
out, err, code = ssh_run('cd /opt/linmeng && pm2 start ecosystem.config.js 2>&1')
print(f'   {out[:300] or err[:300]}')

import time; time.sleep(3)

print('\n=== 2. Check PM2 status ===')
out, err, code = ssh_run('pm2 list 2>&1 | grep -E "linmeng|Name"')
print(f'   {out or err}')

print('\n=== 3. Check port 3000 ===')
out, err, code = ssh_run('ss -tlnp 2>/dev/null | grep 3000')
print(f'   {out or "Port 3000 not listening"}')

print('\n=== 4. Test wechat.js route ===')
out, err, code = ssh_run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/wechat/website-auth?userType=community 2>&1')
print(f'   website-auth status: {out or "failed"}')
