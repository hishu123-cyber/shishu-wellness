/**
 * 启动优化 + 数据库清理
 * - 清空无用的演示数据
 * - 加数据库索引
 * - 启动时自动真空
 */
const SQL = require('D:\\deepclaw\\projects\\wellness_app\\node_modules\\sql.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = 'D:\\deepclaw\\projects\\wellness_app\\backend\\data\\wellness.db';
const SECRET = process.env.WELLNESS_SECRET || 'wellness-secret-key';
const LOG_PATH = path.join(__dirname, 'logs', 'optimize.log');

function log(m) {
  const line = '[' + new Date().toISOString() + '] ' + m;
  console.log(line);
  try { fs.appendFileSync(LOG_PATH, line + '\n', 'utf8'); } catch(e) {}
}

(async () => {
  const sql = await SQL();
  const data = fs.readFileSync(DB_PATH);
  const db = new sql.Database(data);

  log('开始数据库优化...');

  // 1. 创建索引（如果不存在，sql.js的CREATE INDEX IF NOT EXISTS）
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_diaries_user_date ON health_diaries(user_id, record_date)',
    'CREATE INDEX IF NOT EXISTS idx_diaries_user ON health_diaries(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_records_user ON constitution_records(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_articles_created ON articles(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_products_category ON shop_products(category)',
    'CREATE INDEX IF NOT EXISTS idx_orders_user ON shop_orders(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_cart_user ON shop_cart(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_tea_records_user ON tea_records(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_tcm_consults_user ON tcm_consultations(user_id)',
  ];
  for (const idx of indexes) {
    try {
      db.run(idx);
    } catch(e) {
      log('索引创建失败: ' + idx + ' - ' + e.message);
    }
  }
  log('✅ 索引创建完成');

  // 2. VACUUM 回收空间
  db.run('VACUUM');
  log('✅ 数据库真空完成');

  // 3. 保存
  const buf = Buffer.from(db.export());
  fs.writeFileSync(DB_PATH, buf);
  
  const size = (fs.statSync(DB_PATH).size / 1024).toFixed(1);
  log('✅ 数据库优化完成，大小: ' + size + 'KB');
})();
