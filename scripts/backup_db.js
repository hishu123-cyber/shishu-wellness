const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DB_PATH = 'D:\\deepclaw\\projects\\wellness_app\\backend\\data\\wellness.db';
const BACKUP_DIR = 'D:\\deepclaw\\backups';
const MAX_BACKUPS = 30; // 保留30天

// 确保备份目录存在
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const now = new Date();
const dateStr = now.getFullYear() +
  String(now.getMonth() + 1).padStart(2, '0') +
  String(now.getDate()).padStart(2, '0') + '_' +
  String(now.getHours()).padStart(2, '0') +
  String(now.getMinutes()).padStart(2, '0');

const backupFile = path.join(BACKUP_DIR, `wellness_${dateStr}.db`);
const backupLog = path.join(BACKUP_DIR, 'backup_history.log');

try {
  // 检查源文件
  if (!fs.existsSync(DB_PATH)) {
    console.error('❌ 数据库文件不存在：' + DB_PATH);
    process.exit(1);
  }

  const srcStat = fs.statSync(DB_PATH);
  const srcSize = (srcStat.size / 1024).toFixed(1);

  // 复制数据库文件
  fs.copyFileSync(DB_PATH, backupFile);
  const destStat = fs.statSync(backupFile);
  const destSize = (destStat.size / 1024).toFixed(1);

  // 记录备份日志
  const logLine = `[${now.toISOString()}] ✅ 备份成功: ${backupFile} (${destSize}KB)\n`;
  fs.appendFileSync(backupLog, logLine);

  console.log(`✅ 数据库备份完成：${backupFile}`);
  console.log(`   大小：${srcSize}KB → ${destSize}KB`);

  // 清理过期备份，保留最近30个
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('wellness_') && f.endsWith('.db'))
    .map(f => ({
      name: f,
      path: path.join(BACKUP_DIR, f),
      time: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs
    }))
    .sort((a, b) => b.time - a.time); // 最新的在前面

  if (files.length > MAX_BACKUPS) {
    const toDelete = files.slice(MAX_BACKUPS);
    for (const f of toDelete) {
      fs.unlinkSync(f.path);
      console.log(`   清理旧备份：${f.name}`);
    }
  }

  // 如果 SSH 密钥存在，也备份到服务器
  const sshKey = 'D:\\deepclaw\\ssh_newkey';
  const backupRemote = `root@8.209.222.69:/opt/backups/wellness/`;

  if (fs.existsSync(sshKey)) {
    try {
      // 先保证远程目录存在
      execSync(
        `ssh -i "${sshKey}" -o StrictHostKeyChecking=no -o ConnectTimeout=10 ${backupRemote.replace(/:\/opt.*/, '')} "mkdir -p /opt/backups/wellness" 2>&1`,
        { timeout: 15000, windowsHide: true, stdio: 'pipe' }
      );

      // 用 scp 传过去
      execSync(
        `scp -i "${sshKey}" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "${backupFile}" ${backupRemote}`,
        { timeout: 30000, windowsHide: true, stdio: 'pipe' }
      );

      const remoteLog = `[${now.toISOString()}] ✅ 远程备份成功: 8.209.222.69:/opt/backups/wellness/${path.basename(backupFile)}\n`;
      fs.appendFileSync(backupLog, remoteLog);
      console.log(`✅ 远程备份成功：${backupRemote}`);
    } catch (e) {
      const remoteErr = `[${now.toISOString()}] ❌ 远程备份失败: ${e.message}\n`;
      fs.appendFileSync(backupLog, remoteErr);
      console.log(`⚠️  远程备份失败（不重要，本地备份已成功）：${e.message}`);
    }
  } else {
    console.log('ℹ️  未配置 SSH 密钥，跳过远程备份');
  }

} catch (e) {
  console.error('❌ 备份失败：' + e.message);
  const errLog = `[${new Date().toISOString()}] ❌ 备份失败: ${e.message}\n`;
  fs.appendFileSync(path.join(BACKUP_DIR, 'backup_history.log'), errLog);
  process.exit(1);
}
