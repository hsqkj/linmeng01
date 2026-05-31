import subprocess, sys, io, os, tarfile

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# 1. Create tar.gz of dist
client_dir = r'D:\WorkBuddy\20260331205655\client'
tar_path = os.path.join(client_dir, 'dist.tar.gz')

print('1. Creating tar.gz...')
with tarfile.open(tar_path, 'w:gz') as tar:
    dist_dir = os.path.join(client_dir, 'dist')
    for root, dirs, files in os.walk(dist_dir):
        for file in files:
            full_path = os.path.join(root, file)
            arcname = os.path.relpath(full_path, client_dir)
            tar.add(full_path, arcname=arcname)

size_mb = os.path.getsize(tar_path) / (1024 * 1024)
print(f'   Created: {tar_path} ({size_mb:.1f} MB)')

# 2. Upload tar.gz to server
print('2. Uploading to server...')
result = subprocess.run(
    ['scp', '-i', 'D:/WorkBuddy/linmeng2026key.pem', '-o', 'ConnectTimeout=10',
     '-o', 'StrictHostKeyChecking=no',
     tar_path, 'ubuntu@150.158.12.243:/tmp/dist.tar.gz'],
    capture_output=True, timeout=120
)
out = result.stdout.decode('utf-8', errors='replace').strip()
err = result.stderr.decode('utf-8', errors='replace').strip()
print(f'   SCP: {"OK" if result.returncode == 0 else "FAILED: " + err}')

if result.returncode != 0:
    sys.exit(1)

# 3. Extract on server (backup old, deploy new)
print('3. Deploying on server...')
cmds = [
    'sudo cp -r /var/www/linmeng/client /var/www/linmeng/client_backup_$(date +%Y%m%d%H%M) 2>/dev/null',
    'sudo rm -rf /var/www/linmeng/client',
    'sudo mkdir -p /var/www/linmeng/client',
    'sudo tar xzf /tmp/dist.tar.gz -C /var/www/linmeng/client/ --strip-components=1',
    'sudo chown -R www-data:www-data /var/www/linmeng/client',
    'rm /tmp/dist.tar.gz',
    'echo "Deploy done"',
]

for cmd in cmds:
    result = subprocess.run(
        ['ssh', '-i', 'D:/WorkBuddy/linmeng2026key.pem', '-o', 'ConnectTimeout=10',
         '-o', 'StrictHostKeyChecking=no', 'ubuntu@150.158.12.243', cmd],
        capture_output=True, timeout=30
    )
    out = result.stdout.decode('utf-8', errors='replace').strip()
    err = result.stderr.decode('utf-8', errors='replace').strip()
    if out: print(f'   {out[:200]}')
    if err and result.returncode != 0: print(f'   ERR: {err[:200]}')

# 4. Verify
print('4. Verifying...')
result = subprocess.run(
    ['ssh', '-i', 'D:/WorkBuddy/linmeng2026key.pem', '-o', 'ConnectTimeout=10',
     '-o', 'StrictHostKeyChecking=no', 'ubuntu@150.158.12.243',
     'ls /var/www/linmeng/client/index.html 2>&1 && echo "OK"'],
    capture_output=True, timeout=15
)
out = result.stdout.decode('utf-8', errors='replace').strip()
print(f'   {out}')

# 5. Cleanup local tar
os.remove(tar_path)
print('5. Cleaned up local tar.gz')
