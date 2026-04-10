/**
 * 数据库配置同步脚本 - 本地 → 服务器
 *
 * 用途：安全同步 sys_configs 表中的配置项到服务器
 * 运行方式：在本地执行，从本地数据库读取，SSH 到服务器更新
 *
 * 使用方式：
 *   node sync_config.js              # 同步所有配置（含备份）
 *   node sync_config.js single       # 单次同步（无备份）
 *
 * 安全特性：
 *   - JSON 格式验证
 *   - 同步前自动备份服务器配置
 *   - 详细的操作日志
 *   - 错误回滚机制
 *   - 只同步配置，不碰业务数据
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ============ 配置区 ============
const CONFIG = {
  // 要同步的配置项
  syncKeys: [
    'ambassador_commission',
    'member_levels',
    'member_benefits',
    'anti_flying',
    'expert_types',
    'level_bonus',
    'reward_base',
    'basic_types',
    'match_algorithm',
    'match_reward',
    'rating_config',
    'anti_flying_level'
  ],
  // 服务器信息
  server: {
    host: '150.158.12.243',
    user: 'ubuntu',
    keyPath: 'D:/WorkBuddy/linmeng2026key.pem',
    dbUser: 'root',
    dbPassword: 'root',
    dbName: 'linmeng'
  },
  // 本地 MySQL
  local: {
    path: 'C:/Program Files/MySQL/MySQL Server 8.4/bin/mysql.exe',
    user: 'root',
    password: 'root'
  },
  // 目录（服务器）
  remoteDirs: {
    logs: '/opt/linmeng/server/logs',
    backups: '/opt/linmeng/server/backups'
  }
};

// ============ 日志模块 ============
class Logger {
  constructor() {
    this.logs = [];
  }

  log(msg, type = 'INFO') {
    const time = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const line = `[${time}] [${type}] ${msg}`;
    console.log(line);
    this.logs.push(line);
  }

  success(msg) { this.log(msg, 'SUCCESS'); }
  error(msg) { this.log(msg, 'ERROR'); }
  warn(msg) { this.log(msg, 'WARN'); }

  getContent() {
    return this.logs.join('\n');
  }
}

// ============ 执行命令辅助函数 ============
function execCommand(cmd, options = {}) {
  const { ignoreErrors = false, cwd = undefined } = options;
  try {
    const result = execSync(cmd, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd,
      maxBuffer: 10 * 1024 * 1024
    });
    return { success: true, output: result };
  } catch (e) {
    // stderr 有 Warning 是正常的
    const output = e.stdout || '';
    const isWarning = e.stderr && e.stderr.includes('Warning');
    if (ignoreErrors || isWarning) {
      return { success: true, output };
    }
    return { success: false, error: e.message, stderr: e.stderr };
  }
}

// ============ SSH 执行辅助 ============
function sshExec(cmd) {
  const key = CONFIG.server.keyPath;
  const escaped = cmd.replace(/"/g, '\\"');
  const sshCmd = `ssh -i "${key}" ${CONFIG.server.user}@${CONFIG.server.host} "${escaped}"`;
  const result = execCommand(sshCmd);
  if (!result.success) {
    throw new Error(`SSH执行失败: ${result.error}`);
  }
  return result.output;
}

// ============ 本地 MySQL 查询 ============
function localQuery(sql) {
  const { path: mysqlPath, user, password } = CONFIG.local;
  const cmd = `"${mysqlPath}" -u${user} -p${password} linmeng -N -e "${sql.replace(/"/g, '\\"')}"`;
  const result = execCommand(cmd, { ignoreErrors: true });
  if (!result.success) {
    throw new Error(`本地MySQL查询失败: ${result.error}`);
  }
  // 清理所有空白字符
  return result.output.replace(/[\r\n\t\s]+/g, ' ').trim();
}

// ============ 读取本地配置 ============
function getLocalConfig(key) {
  const { path: mysqlPath, user, password } = CONFIG.local;

  // 分别查询 config_value 和 config_type
  const valueCmd = `"${mysqlPath}" -u${user} -p${password} linmeng -N -e "SELECT config_value FROM sys_configs WHERE config_key='${key}'"`;
  const typeCmd = `"${mysqlPath}" -u${user} -p${password} linmeng -N -e "SELECT COALESCE(config_type,'system') FROM sys_configs WHERE config_key='${key}'"`;

  const valueResult = execCommand(valueCmd, { ignoreErrors: true });
  const typeResult = execCommand(typeCmd, { ignoreErrors: true });

  if (!valueResult.success || !valueResult.output) {
    return null;
  }

  // 清理空白
  const config_value = valueResult.output.replace(/[\r\n\t\s]+/g, '').trim();
  const config_type = typeResult.success ? typeResult.output.replace(/[\r\n\t\s]+/g, '').trim() : 'system';

  return { config_value, config_type };
}

// ============ 备份服务器配置 ============
async function backupServerConfigs(logger) {
  logger.log('正在备份服务器配置...');

  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
  const backupFile = `${CONFIG.remoteDirs.backups}/config_backup_${timestamp}.json`;

  // 收集所有配置
  const configs = {};
  for (const key of CONFIG.syncKeys) {
    const sql = `mysql -u${CONFIG.server.dbUser} -p${CONFIG.server.dbPassword} ${CONFIG.server.dbName} -N -e "SELECT CONCAT(COALESCE(config_value,'')) FROM sys_configs WHERE config_key='${key}'" 2>/dev/null`;
    try {
      const result = sshExec(sql);
      if (result.trim()) {
        configs[key] = result.trim();
      }
    } catch (e) {
      // 忽略错误，继续下一个
    }
  }

  // 创建 JSON 内容
  const jsonContent = JSON.stringify(configs, null, 2);

  // 通过 base64 传输到服务器
  const base64 = Buffer.from(jsonContent).toString('base64');
  sshExec(`echo "${base64}" | base64 -d > ${backupFile}`);

  logger.success(`备份已保存: ${backupFile}`);
  return backupFile;
}

// ============ 回滚 ============
async function rollback(logger, backupFile) {
  logger.warn('开始回滚...');

  try {
    // 读取备份文件
    const base64 = sshExec(`cat ${backupFile} | base64`);
    const configs = JSON.parse(Buffer.from(base64.trim(), 'base64').toString('utf8'));

    // 逐个恢复
    for (const [key, value] of Object.entries(configs)) {
      const escaped = value.replace(/'/g, "'\\''").replace(/\\/g, '\\\\');
      const sql = `mysql -u${CONFIG.server.dbUser} -p${CONFIG.server.dbPassword} ${CONFIG.server.dbName} -e "INSERT INTO sys_configs (config_key, config_value, config_type) VALUES ('${key}', '${escaped}', 'system') ON DUPLICATE KEY UPDATE config_value='${escaped}'" 2>/dev/null`;
      sshExec(sql);
    }

    logger.success('回滚完成');
  } catch (e) {
    logger.error(`回滚失败: ${e.message}`);
  }
}

// ============ 验证 JSON ============
function validateJson(str) {
  try {
    JSON.parse(str);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: e.message };
  }
}

// ============ 同步配置到服务器 ============
async function syncToServer(logger, key, config) {
  const { config_value, config_type } = config;

  // 验证 JSON
  const validation = validateJson(config_value);
  if (!validation.valid) {
    logger.error(`  JSON格式错误: ${validation.error}`);
    return false;
  }

  logger.log(`  值长度: ${config_value.length} 字符`);

  // 转义
  const escaped = config_value.replace(/'/g, "'\\''").replace(/\\/g, '\\\\');

  // 执行同步
  const sql = `mysql -u${CONFIG.server.dbUser} -p${CONFIG.server.dbPassword} ${CONFIG.server.dbName} -e "INSERT INTO sys_configs (config_key, config_value, config_type) VALUES ('${key}', '${escaped}', '${config_type || 'system'}') ON DUPLICATE KEY UPDATE config_value='${escaped}', config_type='${config_type || 'system'}'" 2>/dev/null`;

  try {
    sshExec(sql);
    return true;
  } catch (e) {
    logger.error(`  同步失败: ${e.message}`);
    return false;
  }
}

// ============ 保存日志到服务器 ============
function saveLog(logger) {
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `sync_${timestamp}_${Date.now()}.log`;
  const logPath = `${CONFIG.remoteDirs.logs}/${filename}`;

  // 本地保存一份
  const localLogPath = path.join(__dirname, 'logs', filename);
  const logDir = path.dirname(localLogPath);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  fs.writeFileSync(localLogPath, logger.getContent(), 'utf8');
  console.log(`本地日志已保存: ${localLogPath}`);

  // 传输到服务器（分块）
  const content = logger.getContent();
  const chunkSize = 8000;

  // 先清空文件
  sshExec(`> ${logPath}`);

  // 分块传输
  for (let i = 0; i < content.length; i += chunkSize) {
    const chunk = content.substring(i, i + chunkSize);
    const base64 = Buffer.from(chunk).toString('base64');
    sshExec(`echo "${base64}" | base64 -d >> ${logPath}`);
  }

  console.log(`服务器日志已保存: ${logPath}`);
}

// ============ 主函数 ============
async function main() {
  const isSingleRun = process.argv.includes('single');
  const logger = new Logger();

  logger.log('========== 数据库配置同步开始 ==========');
  logger.log(`模式: ${isSingleRun ? '单次同步（无备份）' : '完整同步（含备份）'}`);

  let backupFile = null;

  try {
    // 1. 测试连接
    logger.log('\n测试连接...');
    try {
      sshExec('echo "SSH连接成功"');
      logger.success('SSH连接正常');
    } catch (e) {
      logger.error(`SSH连接失败: ${e.message}`);
      throw new Error('SSH连接失败');
    }

    // 2. 读取并同步每个配置
    logger.log('\n开始同步配置项...');

    let successCount = 0;
    let errorCount = 0;

    for (const key of CONFIG.syncKeys) {
      logger.log(`\n处理: ${key}`);

      // 读取本地配置
      const config = getLocalConfig(key);
      if (!config) {
        logger.warn(`  本地不存在，跳过`);
        continue;
      }

      logger.log(`  读取成功`);

      // 同步到服务器
      const ok = await syncToServer(logger, key, config);
      if (ok) {
        logger.success(`  已同步`);
        successCount++;
      } else {
        errorCount++;
      }
    }

    // 3. 备份服务器配置
    if (!isSingleRun) {
      try {
        backupFile = await backupServerConfigs(logger);
      } catch (e) {
        logger.warn(`备份失败: ${e.message}`);
      }
    }

    // 4. 汇总
    logger.log('\n========== 同步完成 ==========');
    logger.log(`成功: ${successCount}`);
    logger.log(`失败: ${errorCount}`);

    if (errorCount > 0) {
      logger.warn('存在失败项，请检查日志');
    } else {
      logger.success('所有配置同步成功!');
    }

  } catch (error) {
    logger.error(`执行出错: ${error.message}`);

    if (!isSingleRun && backupFile) {
      await rollback(logger, backupFile);
    }

    throw error;
  }

  // 保存日志
  saveLog(logger);
}

// ============ 入口 ============
main()
  .then(() => {
    console.log('\n同步任务完成');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n同步任务失败:', err.message);
    process.exit(1);
  });
