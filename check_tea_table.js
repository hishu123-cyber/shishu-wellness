const fs = require('fs');
const path = require('path');
const sql = require('sql.js');
const DB_PATH = path.join(__dirname, 'backend', 'data', 'wellness.db');
console.log('DB_PATH:', DB_PATH);
const db = new sql.Database(fs.readFileSync(DB_PATH));

// 查 tea_products 表结构
const stmt = db.prepare('PRAGMA table_info(tea_products)');
const columns = [];
while (stmt.step()) columns.push(stmt.getAsObject());
stmt.free();
console.log('tea_products 字段:', JSON.stringify(columns, null, 2));

// 查一条数据
const stmt2 = db.prepare('SELECT * FROM tea_products LIMIT 1');
if (stmt2.step()) {
  console.log('样例数据:', JSON.stringify(stmt2.getAsObject(), null, 2));
} else {
  console.log('无数据');
}
stmt2.free();

// 同时查 tea_records 表结构
const stmt3 = db.prepare('PRAGMA table_info(tea_records)');
const cols2 = [];
while (stmt3.step()) cols2.push(stmt3.getAsObject());
stmt3.free();
console.log('tea_records 字段:', JSON.stringify(cols2, null, 2));

db.close();
