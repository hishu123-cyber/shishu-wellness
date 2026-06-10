const fs = require('fs');
const js = fs.readFileSync('D:/deepclaw/projects/wellness_app/frontend/app.js', 'utf8');

// 检查所有公开页面函数是否引用了 state.user（未登录时为null会崩溃）
const guestPages = ['renderShop', 'renderRecipes', 'renderSolar', 'renderArticles', 'renderRecipeDetail', 'renderArticleDetail', 'renderShopProduct', 'renderShopCart'];

for (const fn of guestPages) {
  const idx = js.indexOf(`function ${fn}(`);
  if (idx < 0) { console.log(`❌ ${fn} 未找到`); continue; }
  
  const end = js.indexOf('\nfunction ', idx + 5);
  const body = js.substring(idx, end > 0 ? end : idx + 500);
  
  const userRefs = body.match(/state\.user\.\w+/g) || [];
  if (userRefs.length > 0) {
    console.log(`⚠️ ${fn} 引用 state.user: ${userRefs.join(', ')}`);
  } else {
    console.log(`✅ ${fn} 未直接引用 state.user`);
  }
}

// 检查 navigate 函数
const navIdx = js.indexOf('function navigate(');
if (navIdx > 0) {
  const navBody = js.substring(navIdx, navIdx + 300);
  console.log('\n=== navigate() ===');
  console.log(navBody);
}
