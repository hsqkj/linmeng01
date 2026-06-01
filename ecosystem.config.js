module.exports = {
  apps: [{
    name: 'linmeng-server',
    script: './server/src/app.js',
    cwd: '/opt/linmeng',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/home/ubuntu/.pm2/logs/linmeng-server-error.log',
    out_file: '/home/ubuntu/.pm2/logs/linmeng-server-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    max_restarts: 5,
    restart_delay: 3000
  }]
}
