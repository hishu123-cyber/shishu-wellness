const fs = require('fs');
const code = fs.readFileSync('D:/deepclaw/projects/wellness_app/frontend/app.js', 'utf8');
console.log('文件大小:', code.length, '字符');

const opens = (code.match(/\{/g) || []).length;
const closes = (code.match(/\}/g) || []).length;
const openParens = (code.match(/\(/g) || []).length;
const closeParens = (code.match(/\)/g) || []).length;

console.log('大括号: {', opens, '} ', closes, '差:', opens - closes);
console.log('圆括号: (', openParens, ') ', closeParens, '差:', openParens - closeParens);

if (opens !== closes) {
  console.log('ERROR: 大括号不匹配!');
}
if (openParens !== closeParens) {
  console.log('ERROR: 圆括号不匹配!');
}

// 检查函数定义
const renderShopMatch = code.match(/async function renderShop\(cat\)/);
console.log('renderShop函数:', renderShopMatch ? '找到' : '未找到');

// 检查最后100个字符
console.log('文件末尾:', code.slice(-100));
