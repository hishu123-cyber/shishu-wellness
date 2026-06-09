const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
initSqlJs().then(SQL => {
  const dbPath = path.join(__dirname, '..', 'backend', 'data', 'wellness.db');
  const db = new SQL.Database(fs.readFileSync(dbPath));
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  tables[0].values.forEach(r => {
    const name = r[0];
    const col = db.exec('PRAGMA table_info(' + name + ')');
    console.log('Table:', name);
    col[0].values.forEach(c => console.log('  ', c[1], c[2]));
    const cnt = db.exec('SELECT COUNT(*) FROM ' + name);
    console.log('  Rows:', cnt[0].values[0][0]);
    console.log('');
  });
});
