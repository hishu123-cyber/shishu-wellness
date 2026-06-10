const fs = require('fs');
const path = 'D:/deepclaw/projects/wellness_app/server.js';

let content = fs.readFileSync(path, 'utf8');

const teaRoutes = `
// ── 茶养 Tea Routes ──
// 茶品列表
app.get('/api/tea/products', function(req, res) {
  res.json(queryAll('SELECT * FROM tea_products ORDER BY id'));
});

// 时辰饮茶规则
app.get('/api/tea/time-rules', function(req, res) {
  res.json(queryAll('SELECT * FROM tea_time_rules ORDER BY start_hour'));
});

// 节气茶饮推荐
app.get('/api/tea/seasonal', function(req, res) {
  var term = queryOne("SELECT * FROM solar_terms WHERE start_date <= date('now') ORDER BY start_date DESC LIMIT 1");
  var teas = [];
  if (term) {
    teas = queryAll('SELECT * FROM tea_products WHERE season = ? OR season = ? LIMIT 6', [term.season, '四季']);
  }
  res.json({ current_term: term, teas: teas });
});

// 今日推荐 + 用户体质
app.get('/api/tea/today', auth, function(req, res) {
  var user = queryOne('SELECT nickname, constitution FROM users WHERE id = ?', [req.userId]) || {};
  var record = queryOne('SELECT result FROM constitution_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [req.userId]);
  var constitution = user.constitution || (record ? record.result : null);
  var sql = 'SELECT * FROM tea_products';
  var params = [];
  if (constitution && constitution !== '未测评') {
    sql += ' WHERE constitution LIKE ?';
    params.push('%' + constitution + '%');
  }
  sql += ' ORDER BY RANDOM() LIMIT 3';
  var teas = queryAll(sql, params);
  if (teas.length === 0) teas = queryAll('SELECT * FROM tea_products ORDER BY id LIMIT 3');
  var now = new Date();
  var month = now.getMonth() + 1;
  var season = month <= 2 || month === 12 ? '冬' : month <= 5 ? '春' : month <= 8 ? '夏' : '秋';
  res.json({ constitution: constitution || '未测评', user: { nickname: user.nickname || '茶友' }, teas: teas, season: season });
});

// 茶养打卡记录
app.get('/api/tea/records', auth, function(req, res) {
  var days = parseInt(req.query.days) || 30;
  var records = queryAll(
    "SELECT * FROM tea_records WHERE user_id = ? AND created_at >= datetime('now', ?) ORDER BY created_at DESC",
    [req.userId, '-' + days + ' days']
  );
  var total = records.length;
  var uniqueDays = {};
  for (var ri = 0; ri < records.length; ri++) {
    var day = records[ri].created_at ? records[ri].created_at.substring(0, 10) : '';
    if (day) uniqueDays[day] = true;
  }
  var daysCount = Object.keys(uniqueDays).length;
  var scores = records.filter(function(r) { return r.score > 0; }).map(function(r) { return r.score; });
  var avgScore = scores.length > 0 ? scores.reduce(function(a, b) { return a + b; }, 0) / scores.length : 0;
  var continuous = 0;
  for (var ci = 0; ci < 30; ci++) {
    var d = new Date();
    d.setDate(d.getDate() - ci);
    var ds = d.toISOString().substring(0, 10);
    var has = queryOne('SELECT id FROM tea_records WHERE user_id = ? AND DATE(created_at) = ? LIMIT 1', [req.userId, ds]);
    if (has) continuous++; else break;
  }
  res.json({ stats: { total: total, days: daysCount, avg_score: avgScore }, continuous_days: continuous, records: records });
});

// 提交打卡记录
app.post('/api/tea/records', auth, function(req, res) {
  var data = req.body || {};
  queryRun(
    'INSERT INTO tea_records (user_id, tea_id, tea_name, score, feeling, completed, time_slot) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [req.userId, data.tea_id || 0, data.tea_name || '', data.score || 0, data.feeling || '', data.completed ? 1 : 0, data.time_slot || '']
  );
  saveDb();
  var count = queryOne('SELECT COUNT(*) as cnt FROM tea_records WHERE user_id = ?', [req.userId]).cnt;
  var newBadges = [];
  var allBadges = queryAll('SELECT * FROM tea_badges');
  for (var bi = 0; bi < allBadges.length; bi++) {
    var b = allBadges[bi];
    if (b.condition_type === 'records_count' && count >= b.condition_value) {
      var existing = queryOne('SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?', [req.userId, b.id]);
      if (!existing) {
        queryRun('INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)', [req.userId, b.id]);
        newBadges.push({ name: b.name, icon: b.icon, description: b.description });
      }
    }
  }
  if (newBadges.length > 0) saveDb();
  res.json({ success: true, new_badges: newBadges });
});

// 每日茶知识
app.get('/api/tea/daily-tip', function(req, res) {
  var tips = queryAll('SELECT * FROM tea_daily_tips');
  var tip = tips.length > 0 ? tips[Math.floor(Math.random() * tips.length)] : null;
  res.json(tip || {});
});

// 用户徽章
app.get('/api/tea/badges', auth, function(req, res) {
  var allBadges = queryAll('SELECT * FROM tea_badges');
  var earned = queryAll('SELECT badge_id FROM user_badges WHERE user_id = ?', [req.userId]);
  var earnedIds = {};
  for (var ei = 0; ei < earned.length; ei++) earnedIds[earned[ei].badge_id] = true;
  var result = [];
  for (var bi = 0; bi < allBadges.length; bi++) {
    var b = allBadges[bi];
    result.push({ id: b.id, name: b.name, icon: b.icon, description: b.description, condition_type: b.condition_type, condition_value: b.condition_value, earned: !!earnedIds[b.id] });
  }
  res.json(result);
});
`;

// 在 TCM 模块前插入
var marker = '  // 挂载在线中医问诊模块';
var idx = content.indexOf(marker);
if (idx === -1) {
  console.error('ERROR: marker not found');
  process.exit(1);
}
content = content.substring(0, idx) + teaRoutes + '\n' + content.substring(idx);
fs.writeFileSync(path, content, 'utf8');
console.log('OK - tea routes inserted');
