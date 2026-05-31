import subprocess, sys, io, json

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

# Get all PM2 processes
print('=== All PM2 processes ===')
out, err, code = ssh_run('pm2 jlist 2>/dev/null')
if out:
    try:
        processes = json.loads(out)
        for p in processes:
            name = p.get('name', '?')
            status = p.get('pm2_env', {}).get('status', '?')
            pid = p.get('pid', '?')
            script = p.get('pm2_env', {}).get('pm_exec_path', '?')
            print(f'  {name} | status={status} | pid={pid}')
            print(f'    script: {script}')
    except:
        print(f'  Raw output: {out[:500]}')
else:
    print(f'  Error: {err or "no output"}')

# Also check if linmeng runs differently
print('\n=== Check linmeng process ===')
out, err, code = ssh_run('ps aux | grep -i "linmeng" | grep -v grep | head -5')
print(f'  {out or "not found"}')

print('\n=== Check /opt/linmeng ===')
out, err, code = ssh_run('ls /opt/linmeng/ 2>&1')
print(f'  {out or err}')
