import subprocess, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def ssh_run(cmd):
    result = subprocess.run(
        ['ssh', '-i', 'D:/WorkBuddy/linmeng2026key.pem', '-o', 'ConnectTimeout=10',
         '-o', 'StrictHostKeyChecking=no', 'ubuntu@150.158.12.243', cmd],
        capture_output=True, timeout=15
    )
    out = result.stdout.decode('utf-8', errors='replace').strip()
    err = result.stderr.decode('utf-8', errors='replace').strip()
    return out, err, result.returncode

# Check if linmeng has ecosystem.config.js (PM2 config)
print('=== ecosystem.config.js ===')
out, err, code = ssh_run('cat /opt/linmeng/ecosystem.config.js 2>&1')
print(out or err)

# Check if linmeng is running via systemd or something else
print('\n=== Node processes ===')
out, err, code = ssh_run('ps aux | grep "node.*linmeng" | grep -v grep | grep -v "linmeng-vote"')
print(out or 'Not running as node process')

# Check if it runs on port 3000
print('\n=== Port 3000 ===')
out, err, code = ssh_run('ss -tlnp | grep 3000 2>&1 || netstat -tlnp 2>/dev/null | grep 3000')
print(out or 'Port 3000 not listening')

# Check nginx config to see how linmeng backend is routed
print('\n=== Nginx upstream/backend ===')
out, err, code = ssh_run('grep -r "3000\|linmeng" /etc/nginx/conf.d/ 2>/dev/null | grep -v "#" | head -10')
print(out or err or 'not found')

# Check if there's a pm2 saved list that includes linmeng-server
print('\n=== PM2 saved dump ===')
out, err, code = ssh_run('cat ~/.pm2/dump.pm2 2>/dev/null | grep -o "linmeng[^"]*" | sort -u')
print(out or 'no saved dump')
