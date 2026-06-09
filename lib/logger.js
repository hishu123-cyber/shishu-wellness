/**
 * 日志模块 - 食术·中医体质养生
 * 用法: const log = require('./lib/logger');
 *       log.info('服务启动');
 *       log.error('数据库错误', err);
 */
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB 轮转
const MAX_LOG_FILES = 7; // 保留7天

// 确保日志目录存在
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// 获取今天的日志文件路径
function todayLog() {
  const d = new Date();
  const date = d.getFullYear() +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0');
  return path.join(LOG_DIR, `app_${date}.log`);
}

// 日志轮转
function rotateIfNeeded(filepath) {
  try {
    if (fs.existsSync(filepath) && fs.statSync(filepath).size > MAX_LOG_SIZE) {
      fs.renameSync(filepath, filepath + '.1');
      // 清理旧日志
      const files = fs.readdirSync(LOG_DIR)
        .filter(f => f.startsWith('app_'))
        .sort();
      while (files.length > MAX_LOG_FILES) {
        fs.unlinkSync(path.join(LOG_DIR, files.shift()));
      }
    }
  } catch(e) { /* 忽略轮转错误 */ }
}

function writeLog(level, msg, data) {
  const now = new Date();
  const ts = now.toISOString();
  let line = `[${ts}] [${level}] ${msg}`;
  if (data) {
    if (data instanceof Error) {
      line += ` | ${data.message}\n${data.stack || ''}`;
    } else if (typeof data === 'object') {
      try { line += ` | ${JSON.stringify(data)}`; } catch(e) { line += ` | ${String(data)}`; }
    } else {
      line += ` | ${String(data)}`;
    }
  }
  line += '\n';

  // 写文件
  const logFile = todayLog();
  rotateIfNeeded(logFile);
  try {
    fs.appendFileSync(logFile, line, 'utf8');
  } catch(e) { /* 日志写失败不崩溃 */ }

  // 控制台也输出
  const prefix = level === 'ERROR' ? '❌' : level === 'WARN' ? '⚠️' : level === 'INFO' ? 'ℹ️' : '📋';
  console.log(`${prefix} ${line.trim()}`);
}

module.exports = {
  info: (msg, data) => writeLog('INFO', msg, data),
  warn: (msg, data) => writeLog('WARN', msg, data),
  error: (msg, data) => writeLog('ERROR', msg, data),
  debug: (msg, data) => {
    if (process.env.DEBUG) writeLog('DEBUG', msg, data);
  },
  request: (req, res, timeMs) => {
    writeLog('REQUEST', `${req.method} ${req.originalUrl} ${res.statusCode} ${timeMs}ms`);
  },
  getLogDir: () => LOG_DIR,
};
