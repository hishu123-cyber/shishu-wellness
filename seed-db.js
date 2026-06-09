/**
 * Database Seed Script for Wellness App
 * Creates fresh DB with all tables and test data
 * Run: node seed-db.js
 */
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, 'backend', 'data', 'wellness.db');
const SECRET = 'wellness-secret-key';

function hashPw(pw) {
  return crypto.createHash('sha256').update(pw + SECRET).digest('hex');
}

async function seed() {
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  // ── Create tables ──
  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      hashed_password TEXT NOT NULL,
      nickname TEXT,
      avatar TEXT,
      phone TEXT,
      constitution TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS constitution_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      dimension TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS constitution_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      answers TEXT NOT NULL,
      result TEXT NOT NULL,
      scores TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS diary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      mood INTEGER DEFAULT 3,
      sleep INTEGER DEFAULT 7,
      exercise INTEGER DEFAULT 0,
      diet INTEGER DEFAULT 3,
      water INTEGER DEFAULT 3,
      note TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      target_group TEXT,
      ingredients TEXT,
      steps TEXT,
      description TEXT,
      constitution TEXT,
      image TEXT
    );

    CREATE TABLE IF NOT EXISTS solar_terms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      date TEXT,
      description TEXT,
      diet_tips TEXT,
      exercise_tips TEXT,
      acupoint_tips TEXT
    );

    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT,
      content TEXT,
      summary TEXT,
      image TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      price REAL DEFAULT 0,
      original_price REAL,
      description TEXT,
      image TEXT,
      stock INTEGER DEFAULT 100,
      sales INTEGER DEFAULT 0,
      rating REAL DEFAULT 5.0
    );

    CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      items TEXT NOT NULL,
      total REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      address TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS community_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      images TEXT,
      tab TEXT DEFAULT 'all',
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS nutritionists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      title TEXT,
      specialty TEXT,
      avatar TEXT,
      bio TEXT,
      rating REAL DEFAULT 5.0,
      service_count INTEGER DEFAULT 0,
      price REAL DEFAULT 199,
      available INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS chef_services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      price REAL DEFAULT 0,
      description TEXT,
      duration INTEGER DEFAULT 60
    );

    CREATE TABLE IF NOT EXISTS chef_bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      chef_id INTEGER NOT NULL,
      service_id INTEGER,
      booking_date TEXT,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS points_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      points INTEGER NOT NULL,
      reason TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS vip_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      level TEXT DEFAULT 'none',
      start_date TEXT,
      end_date TEXT,
      auto_renew INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS constitution_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      price REAL DEFAULT 0,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS tcm_doctors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      title TEXT,
      hospital TEXT,
      specialty TEXT,
      introduction TEXT,
      avatar TEXT,
      rating REAL DEFAULT 5.0,
      consultation_count INTEGER DEFAULT 0,
      price_online REAL DEFAULT 99,
      price_video REAL DEFAULT 199,
      available INTEGER DEFAULT 1,
      certification TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tcm_consultations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      doctor_id INTEGER NOT NULL,
      type TEXT DEFAULT 'text',
      status TEXT DEFAULT 'pending',
      symptoms TEXT,
      constitution TEXT,
      price REAL DEFAULT 0,
      doctor_notes TEXT,
      prescription_id INTEGER,
      rating INTEGER,
      review TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      accepted_at TEXT,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS tcm_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      consultation_id INTEGER NOT NULL,
      sender_type TEXT NOT NULL,
      sender_id INTEGER,
      content TEXT NOT NULL,
      msg_type TEXT DEFAULT 'text',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tcm_prescriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      consultation_id INTEGER NOT NULL,
      doctor_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      diagnosis TEXT,
      prescription_text TEXT,
      decoction_method TEXT,
      dosage TEXT,
      precautions TEXT,
      days INTEGER DEFAULT 7,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `;

  db.run(schema);

  // ── Seed data ──

  // Test user
  db.run('INSERT INTO users (username, hashed_password, nickname) VALUES (?, ?, ?)', 
    ['demo', hashPw('123456'), '养生达人']);
  db.run('INSERT INTO users (username, hashed_password, nickname) VALUES (?, ?, ?)', 
    ['test', hashPw('123456'), '测试用户']);

  // Constitution questions (45 questions for 9 dimensions)
  // Yang deficiency
  const questions = [
    ['您是否经常感到手脚发凉？', '阳虚质'],
    ['您是否胃脘部、背部或腰膝部怕冷？', '阳虚质'],
    ['您是否比一般人耐受不了寒冷？', '阳虚质'],
    ['您是否比别人更容易感冒？', '阳虚质'],
    ['您是否吃(喝)凉的东西会感到不舒服？', '阳虚质'],
    // Yin deficiency
    ['您是否感到手脚心发热？', '阴虚质'],
    ['您是否感觉身体、脸上发热？', '阴虚质'],
    ['您是否皮肤或口唇偏干？', '阴虚质'],
    ['您是否口唇的颜色比一般人偏红？', '阴虚质'],
    ['您是否容易便秘或大便干燥？', '阴虚质'],
    // Qi deficiency
    ['您是否容易疲乏？', '气虚质'],
    ['您是否容易气短(呼吸短促，接不上气)？', '气虚质'],
    ['您是否容易心慌？', '气虚质'],
    ['您是否容易头晕或站起时晕眩？', '气虚质'],
    ['您是否比别人更容易感冒？', '气虚质'],
    // Phlegm-dampness
    ['您是否感到胸闷或腹部胀满？', '痰湿质'],
    ['您是否感觉身体沉重不轻松？', '痰湿质'],
    ['您是否腹部肥满松软？', '痰湿质'],
    ['您是否有额部油脂分泌多的现象？', '痰湿质'],
    ['您是否上眼睑比别人肿(上眼睑有轻微隆起的现象)？', '痰湿质'],
    // Damp-heat
    ['您是否面部或鼻部有油腻感？', '湿热质'],
    ['您是否容易生痤疮或者疮疖？', '湿热质'],
    ['您是否感到口苦或嘴里有异味？', '湿热质'],
    ['您是否大便黏滞不爽、有解不尽的感觉？', '湿热质'],
    ['您是否小便时尿道有发热感、尿色偏深？', '湿热质'],
    // Blood stasis
    ['您是否皮肤常在不知不觉中出现青紫瘀斑？', '血瘀质'],
    ['您是否两颧部有细微红丝？', '血瘀质'],
    ['您是否身体上有哪里疼痛？', '血瘀质'],
    ['您是否面色偏暗或有色素沉着？', '血瘀质'],
    ['您是否容易有黑眼圈？', '血瘀质'],
    // Qi stagnation
    ['您是否感到闷闷不乐、情绪低沉？', '气郁质'],
    ['您是否容易精神紧张、焦虑不安？', '气郁质'],
    ['您是否多愁善感、感情脆弱？', '气郁质'],
    ['您是否容易感到害怕或受到惊吓？', '气郁质'],
    ['您是否胁肋部或乳房胀痛？', '气郁质'],
    // Special diathesis
    ['您是否没有感冒也会打喷嚏？', '特禀质'],
    ['您是否没有感冒也会鼻塞、流鼻涕？', '特禀质'],
    ['您是否有因季节变化、温度变化或异味等原因而咳喘的现象？', '特禀质'],
    ['您是否容易过敏(对药物、食物、花粉等)？', '特禀质'],
    ['您的皮肤是否容易起荨麻疹？', '特禀质'],
    // Balanced
    ['您是否精力充沛？', '平和质'],
    ['您是否容易适应外界环境变化？', '平和质'],
    ['您是否睡眠良好？', '平和质'],
    ['您是否能够较好地应对压力？', '平和质'],
    ['您是否面色红润有光泽？', '平和质'],
  ];

  for (const [q, dim] of questions) {
    db.run('INSERT INTO constitution_questions (question, dimension) VALUES (?, ?)', [q, dim]);
  }

  // Recipes
  const recipes = [
    ['山药枸杞粥', '粥品', '气虚质', '山药50g,枸杞10g,大米100g', '1.大米淘洗干净;2.山药去皮切块;3.所有材料加水煮粥', '补气健脾，适合气虚体质', '/images/recipes/porridge1.jpg'],
    ['当归生姜羊肉汤', '汤羹', '阳虚质', '羊肉500g,当归15g,生姜30g', '1.羊肉焯水;2.当归生姜切片;3.炖煮2小时', '温阳散寒，适合阳虚体质', '/images/recipes/soup1.jpg'],
    ['百合莲子银耳羹', '甜品', '阴虚质', '百合30g,莲子30g,银耳20g,冰糖适量', '1.银耳泡发撕小朵;2.莲子去芯;3.炖煮1小时', '滋阴润燥，适合阴虚体质', '/images/recipes/dessert1.jpg'],
    ['薏米赤小豆汤', '汤羹', '痰湿质', '薏米50g,赤小豆50g,冰糖适量', '1.薏米赤小豆浸泡2小时;2.加水煮烂;3.加冰糖调味', '祛湿化痰，适合痰湿体质', '/images/recipes/soup2.jpg'],
    ['绿豆薏米粥', '粥品', '湿热质', '绿豆50g,薏米50g,大米50g', '1.绿豆薏米浸泡;2.与大米同煮成粥', '清热利湿，适合湿热体质', '/images/recipes/porridge2.jpg'],
    ['山楂红糖水', '茶饮', '血瘀质', '山楂15g,红糖适量,生姜3片', '1.山楂洗净;2.加水煮15分钟;3.加红糖调味', '活血化瘀，适合血瘀体质', '/images/recipes/tea1.jpg'],
    ['玫瑰花茶', '茶饮', '气郁质', '干玫瑰花5朵,蜂蜜适量', '1.玫瑰花放入杯中;2.热水冲泡;3.加蜂蜜', '疏肝解郁，适合气郁体质', '/images/recipes/tea2.jpg'],
    ['黄芪乌鸡汤', '汤羹', '气虚质', '黄芪30g,乌鸡半只,红枣5颗', '1.乌鸡焯水;2.黄芪红枣洗净;3.炖煮1.5小时', '补气养血，适合气虚体质', '/images/recipes/soup3.jpg'],
    ['红枣桂圆茶', '茶饮', '阳虚质', '红枣5颗,桂圆10g,枸杞5g', '1.红枣去核;2.所有材料放入杯中;3.热水冲泡', '温补气血，适合阳虚体质', '/images/recipes/tea3.jpg'],
    ['山药排骨汤', '汤羹', '平和质', '山药200g,排骨300g,姜3片', '1.排骨焯水;2.山药去皮切块;3.炖煮1小时', '健脾养胃，适合平和体质', '/images/recipes/soup4.jpg'],
    ['菊花决明子茶', '茶饮', '湿热质', '菊花5g,决明子10g,枸杞5g', '1.所有材料放入杯中;2.热水冲泡;3.焖5分钟', '清肝明目，适合湿热体质', '/images/recipes/tea4.jpg'],
    ['黑豆核桃粥', '粥品', '血瘀质', '黑豆30g,核桃3个,大米100g', '1.黑豆浸泡;2.核桃去壳;3.同煮成粥', '补肾活血，适合血瘀体质', '/images/recipes/porridge3.jpg'],
    ['百合小米粥', '粥品', '阴虚质', '百合30g,小米100g,红枣3颗', '1.百合小米洗净;2.红枣去核;3.煮成粥', '养阴安神，适合阴虚体质', '/images/recipes/porridge4.jpg'],
    ['陈皮普洱茶', '茶饮', '痰湿质', '陈皮5g,普洱茶10g', '1.陈皮撕小块;2.与普洱茶一起冲泡', '理气化痰，适合痰湿体质', '/images/recipes/tea5.jpg'],
    ['莲子心茶', '茶饮', '气郁质', '莲子心3g,合欢花5g', '1.莲子心合欢花放入杯中;2.热水冲泡', '清心安神，适合气郁体质', '/images/recipes/tea6.jpg'],
  ];

  for (const [name, cat, target, ingr, steps, desc, img] of recipes) {
    db.run('INSERT INTO recipes (name, category, target_group, ingredients, steps, description, image) VALUES (?,?,?,?,?,?,?)',
      [name, cat, target, ingr, steps, desc, img]);
  }

  // Products
  const products = [
    ['有机枸杞', '食材', 39.9, 49.9, '宁夏有机枸杞，颗粒饱满', '/images/products/gouqi.jpg', 500, 328, 4.9],
    ['铁棍山药', '食材', 29.9, 35.0, '河南焦作铁棍山药', '/images/products/shanyao.jpg', 300, 256, 4.8],
    ['古法红糖', '食材', 19.9, 25.0, '传统手工熬制红糖', '/images/products/hongtang.jpg', 800, 189, 4.7],
    ['精选当归', '食材', 35.0, 42.0, '甘肃岷县当归片', '/images/products/danggui.jpg', 400, 156, 4.9],
    ['有机薏米', '食材', 24.9, 29.9, '贵州兴仁薏米', '/images/products/yimi.jpg', 600, 203, 4.6],
    ['特级百合干', '食材', 32.0, 38.0, '湖南龙山百合干', '/images/products/baihe.jpg', 350, 178, 4.8],
    ['黄芪切片', '食材', 28.0, 35.0, '甘肃黄芪饮片', '/images/products/huangqi.jpg', 450, 145, 4.7],
    ['养生壶', '厨具', 199.0, 259.0, '多功能全自动养生壶', '/images/products/pot.jpg', 200, 89, 4.5],
  ];

  for (const [name, cat, price, op, desc, img, stock, sales, rating] of products) {
    db.run('INSERT INTO products (name, category, price, original_price, description, image, stock, sales, rating) VALUES (?,?,?,?,?,?,?,?,?)',
      [name, cat, price, op, desc, img, stock, sales, rating]);
  }

  // Nutritionists
  db.run("INSERT INTO nutritionists (name, title, specialty, bio, rating, service_count, price) VALUES (?,?,?,?,?,?,?)",
    ['张明华', '高级营养师', '慢病管理,三高调理', '国家注册营养师，10年临床营养经验', 4.9, 328, 199]);
  db.run("INSERT INTO nutritionists (name, title, specialty, bio, rating, service_count, price) VALUES (?,?,?,?,?,?,?)",
    ['李秀英', '首席营养师', '产后恢复,减脂调理', '中国营养学会会员，专注女性营养', 4.8, 256, 249]);
  db.run("INSERT INTO nutritionists (name, title, specialty, bio, rating, service_count, price) VALUES (?,?,?,?,?,?,?)",
    ['王建国', '中医食疗师', '体质调理,四季养生', '中医世家，精通食疗药膳', 4.9, 189, 299]);

  // Community posts
  db.run("INSERT INTO community_posts (user_id, content, tab, likes, comments) VALUES (?,?,?,?,?)",
    [1, '坚持山药枸杞粥一周，感觉精神好多了！气虚体质的朋友可以试试', '饮食', 25, 8]);
  db.run("INSERT INTO community_posts (user_id, content, tab, likes, comments) VALUES (?,?,?,?,?)",
    [1, '今天做了当归生姜羊肉汤，暖身效果真的不错', '打卡', 15, 5]);
  db.run("INSERT INTO community_posts (user_id, content, tab, likes, comments) VALUES (?,?,?,?,?)",
    [2, '每周坚持运动3次，配合体质调理食谱，三个月瘦了8斤', '运动', 32, 12]);

  // Solar terms (24)
  const terms = [
    ['立春', '2月4日', '春季开始，万物复苏', '宜食辛甘发散之品，如韭菜、香菜', '宜散步、太极拳', '按揉太冲穴'],
    ['雨水', '2月19日', '降雨增多，湿气渐重', '宜食健脾祛湿之品，如薏米、山药', '宜慢跑、伸展运动', '按揉足三里'],
    ['惊蛰', '3月6日', '春雷始动，阳气生发', '宜食养肝护肝之品', '宜户外运动', '按揉肝俞穴'],
    ['春分', '3月21日', '昼夜平分，阴阳调和', '宜食时令蔬菜，保持阴阳平衡', '宜和缓运动', '按揉关元穴'],
    ['清明', '4月5日', '天地清朗，万物生长', '宜食清淡、养肺之品', '宜踏青、放风筝', '按揉肺俞穴'],
    ['谷雨', '4月20日', '雨生百谷，湿气最重', '宜食祛湿健脾之品', '宜慢跑、瑜伽', '按揉阴陵泉'],
    ['立夏', '5月6日', '夏季开始，心火易旺', '宜食清淡、养心之品', '宜晨练、游泳', '按揉内关穴'],
    ['小满', '5月21日', '麦类灌浆，湿热渐重', '宜食清热利湿之品', '宜散步、太极', '按揉曲池穴'],
    ['芒种', '6月6日', '麦类成熟，暑热渐盛', '宜食清暑解热之品', '宜早晚运动', '按揉合谷穴'],
    ['夏至', '6月21日', '白昼最长，阳气最盛', '宜食清淡、滋阴之品', '宜避免剧烈运动', '按揉神门穴'],
    ['小暑', '7月7日', '暑热渐浓，湿气加重', '宜食清热解暑之品', '宜游泳、晨练', '按揉足三里'],
    ['大暑', '7月23日', '一年最热，暑湿交加', '宜食清热祛湿之品', '宜减少户外活动', '按揉阴陵泉'],
    ['立秋', '8月7日', '秋季开始，燥气渐生', '宜食润肺生津之品', '宜登山、慢跑', '按揉肺俞穴'],
    ['处暑', '8月23日', '暑热消退，秋燥明显', '宜食滋阴润燥之品', '宜户外活动', '按揉太渊穴'],
    ['白露', '9月8日', '天气转凉，露珠凝白', '宜食温润之品', '宜适当增加运动', '按揉列缺穴'],
    ['秋分', '9月23日', '昼夜平分，秋燥最盛', '宜食润肺养阴之品', '宜和缓运动', '按揉中府穴'],
    ['寒露', '10月8日', '露水渐寒，秋意更浓', '宜食温补脾胃之品', '宜登山、太极', '按揉足三里'],
    ['霜降', '10月23日', '天气渐冷，开始有霜', '宜食温补之品', '宜适当运动', '按揉关元穴'],
    ['立冬', '11月7日', '冬季开始，万物收藏', '宜食温补肾阳之品', '宜早睡晚起', '按揉肾俞穴'],
    ['小雪', '11月22日', '开始降雪，寒气加重', '宜食温补暖身之品', '宜室内运动', '按揉命门穴'],
    ['大雪', '12月7日', '降雪增多，寒气最盛', '宜食温补滋腻之品', '宜避免受寒', '按揉涌泉穴'],
    ['冬至', '12月22日', '白昼最短，阴气最盛', '宜食温补阳气之品', '宜静养为宜', '按揉气海穴'],
    ['小寒', '1月6日', '寒冷加剧，小寒胜大寒', '宜食温补肾阳之品', '宜适度运动', '按揉腰眼穴'],
    ['大寒', '1月20日', '一年最冷，寒气极盛', '宜食温补滋养之品', '宜室内运动', '按揉命门穴'],
  ];

  for (const [name, date, desc, diet, exercise, acupoint] of terms) {
    db.run('INSERT INTO solar_terms (name, date, description, diet_tips, exercise_tips, acupoint_tips) VALUES (?,?,?,?,?,?)',
      [name, date, desc, diet, exercise, acupoint]);
  }

  // Articles
  db.run("INSERT INTO articles (title, category, content, summary) VALUES (?,?,?,?)",
    ['九种体质自测指南', '中医养生', '# 九种体质\n\n中医将人的体质分为九种类型……\n\n**平和质**：阴阳气血调和，体态适中\n**气虚质**：元气不足，易疲劳\n**阳虚质**：阳气不足，怕冷\n**阴虚质**：阴液亏少，口干\n**痰湿质**：痰湿凝聚，体胖\n**湿热质**：湿热内蕴，易生痘\n**血瘀质**：血行不畅，肤色暗\n**气郁质**：气机郁滞，情绪低\n**特禀质**：先天失常，易过敏',
      '中医九种体质的特点与调理方向']);

  db.run("INSERT INTO articles (title, category, content, summary) VALUES (?,?,?,?)",
    ['春季养生：顺应阳气生发', '节气养生', '# 春季养生\n\n春季阳气生发，万物复苏……\n\n## 饮食原则\n减酸增甘，养脾气\n\n## 运动建议\n增加户外活动，舒展筋骨\n\n## 情志调养\n保持心情愉悦，避免发怒',
      '春季养生重点：养肝、升阳、防风']);

  db.run("INSERT INTO articles (title, category, content, summary) VALUES (?,?,?,?)",
    ['每天10分钟，改善气虚体质', '运动养生', '# 适合气虚体质的运动\n\n气虚体质的人不宜剧烈运动……\n\n## 推荐运动\n1. 太极拳（15分钟）\n2. 八段锦（20分钟）\n3. 散步（30分钟）\n4. 站桩（10分钟）\n\n## 注意事项\n运动后不要立即洗澡\n出汗后及时补充温水',
      '气虚体质适合的温和运动方案']);

  db.run("INSERT INTO articles (title, category, content, summary) VALUES (?,?,?,?)",
    ['饮食调理：三高人群的日常食谱', '食疗养生', '# 三高人群饮食指南\n\n高血压、高血糖、高血脂……\n\n## 推荐食材\n- 苦瓜、芹菜、木耳\n- 燕麦、荞麦、糙米\n- 鲑鱼、鸡胸肉、豆腐\n\n## 忌口清单\n- 高盐食品\n- 高糖饮品\n- 油炸食品\n- 动物内脏',
      '针对三高人群的饮食调理方案']);

  // ── TCM Doctors（在线中医师） ──
  db.run("INSERT INTO tcm_doctors (name, title, hospital, specialty, introduction, avatar, rating, consultation_count, price_online, price_video, available, certification) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
    ['陈国栋', '主任中医师', '北京中医药大学附属医院', '内科,脾胃病,亚健康调理',
     '38年中医临床经验，擅长运用经方调理各类体质偏颇，尤其对脾胃虚弱、气虚体质的调理有独到见解。中华中医药学会会员，发表核心期刊论文20余篇。',
     '/images/doctors/doctor1.jpg', 4.9, 1586, 99, 199, 1, '主任医师（证号：ZY-2018-00321）']);

  db.run("INSERT INTO tcm_doctors (name, title, hospital, specialty, introduction, avatar, rating, consultation_count, price_online, price_video, available, certification) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
    ['林雅文', '副主任中医师', '广东省中医院', '妇科,气血调理,失眠,情志病',
     '20年中医妇科临床经验，擅长女性气血调理、经期不适、更年期综合征等。独创"气血双补＋情志疏导"疗法，已帮助2000+女性改善体质。',
     '/images/doctors/doctor2.jpg', 4.8, 1243, 79, 159, 1, '副主任医师（证号：ZY-2015-00687）']);

  db.run("INSERT INTO tcm_doctors (name, title, hospital, specialty, introduction, avatar, rating, consultation_count, price_online, price_video, available, certification) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
    ['张志强', '中医主治医师', '上海中医药大学附属岳阳医院', '痰湿体质,三高调理,痛风,肥胖',
     '擅长从"痰湿"角度入手调理代谢类疾病。十年门诊经验，针对肥胖、高尿酸血症、脂肪肝等有系统调理方案。曾任上海市中医体质学会青年委员。',
     '/images/doctors/doctor3.jpg', 4.7, 892, 59, 129, 1, '主治医师（证号：ZY-2019-00142）']);

  db.run("INSERT INTO tcm_doctors (name, title, hospital, specialty, introduction, avatar, rating, consultation_count, price_online, price_video, available, certification) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
    ['王丽萍', '中医博士/主治医师', '成都中医药大学附属医院', '小儿童体调,过敏,鼻炎,咳喘',
     '中医药大学博士毕业，主攻小儿体质调理与过敏性疾病。擅长运用小儿推拿＋中药内服的综合疗法。温和耐心，深受家长信赖。',
     '/images/doctors/doctor4.jpg', 4.9, 678, 69, 139, 1, '博士研究生学历 执业医师（证号：ZY-2020-00593）']);

  db.run("INSERT INTO tcm_doctors (name, title, hospital, specialty, introduction, avatar, rating, consultation_count, price_online, price_video, available, certification) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
    ['刘明远', '中医执业医师', '八珍堂中医诊所（创始人）', '痛症,颈肩腰腿痛,针灸推拿',
     '专注中医外治法15年，精通针灸、推拿、正骨。擅长通过经络辨证治疗颈肩腰腿痛、腰椎间盘突出等。线上下诊断，结合线下手法。',
     '/images/doctors/doctor5.jpg', 4.6, 435, 49, 99, 1, '执业医师（证号：ZY-2012-00278）']);

  // Save DB
  const buf = Buffer.from(db.export());
  fs.writeFileSync(DB_PATH, buf);
  console.log('Database created successfully at', DB_PATH);
  console.log('Test account: demo / 123456');
  console.log('TCM Doctors seeded: 5 traditional Chinese medicine practitioners');
}

seed().catch(e => {
  console.error('Seed error:', e.message);
  process.exit(1);
});
