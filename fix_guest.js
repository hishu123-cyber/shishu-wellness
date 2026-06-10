const fs = require('fs');
const path = 'D:/deepclaw/projects/wellness_app/frontend/app.js';
let js = fs.readFileSync(path, 'utf8');

let changes = 0;

// === 1. 修改 render() 函数 ===
const oldRender = "function render(){console.log('[render] called, page=', state.page, 'user=', !!state.user, 'token=', !!state.token);if(!state.user&&state.token){api('/auth/me').then(function(u){state.user=u;render();}).catch(function(){state.token=null;localStorage.removeItem('token');render();});document.getElementById('app').innerHTML='<div class=\"loading\"><div class=\"spinner\"></div><p>加载中...</p></div>';return;}if(!state.user){renderLogin();return;}";

const newRender = `function render(){console.log('[render] called, page=', state.page, 'user=', !!state.user, 'token=', !!state.token);var guestPages=['shop','shop-product','shop-cart','recipes','recipe-detail','solar','articles','article-detail'];var needAuth=state.page&&!guestPages.includes(state.page);if(!state.user&&state.token){api('/auth/me').then(function(u){state.user=u;render();}).catch(function(){state.token=null;localStorage.removeItem('token');if(needAuth){renderLogin();}else{render();}});document.getElementById('app').innerHTML='<div class="loading"><div class="spinner"></div><p>加载中...</p></div>';return;}if(!state.user&&needAuth){renderLogin();return;}`;

if (js.includes(oldRender)) {
  js = js.replace(oldRender, newRender);
  console.log('✅ 1/3 render() 游客模式已添加');
  changes++;
} else {
  console.log('❌ 未找到 render() 原代码');
  // 输出实际内容做对比
  const idx = js.indexOf('function render()');
  if (idx >= 0) console.log('实际render开头:', js.substring(idx, idx + 200));
}

// === 2. 修改 renderHome() 头部 ===
const oldHomeHead = "async function renderHome(){updateThemeIcon();var nick=esc(state.user.nickname||state.user.username);\nvar hd='<div class=\"header\"><div style=\"display:flex;justify-content:space-between;align-items:center\"><h1><i class=\"fa-solid fa-leaf\"></i> 体质养生</h1><button class=\"theme-toggle\" onclick=\"toggleTheme()\" style=\"background:none;border:none;color:#fff;font-size:20px;padding:4px\"><i class=\"fa-solid fa-moon\"></i></button></div><p>你好，'+nick+' 🌟</p></div>';";

const newHomeHead = `async function renderHome(){updateThemeIcon();var isGuest=!state.user;var nick=isGuest?'游客':esc(state.user.nickname||state.user.username);
var hd='<div class="header"><div style="display:flex;justify-content:space-between;align-items:center"><h1><i class="fa-solid fa-leaf"></i> 体质养生</h1><div style="display:flex;align-items:center;gap:8px"><button class="theme-toggle" onclick="toggleTheme()" style="background:none;border:none;color:#fff;font-size:20px;padding:4px"><i class="fa-solid fa-moon"></i></button>'+(isGuest?'<button class="btn btn-sm btn-outline" style="color:#fff;border-color:rgba(255,255,255,0.5)" onclick="navigate(\\'login\\')">登录</button>':'')+'</div></div><p>你好，'+nick+' 🌟</p></div>';`;

if (js.includes(oldHomeHead)) {
  js = js.replace(oldHomeHead, newHomeHead);
  console.log('✅ 2/3 renderHome() 游客版头部');
  changes++;
} else {
  console.log('⚠️ renderHome 头部匹配失败，尝试逐行替换');
  // 尝试只替换 nick 行
  const nickOld = "var nick=esc(state.user.nickname||state.user.username);";
  const nickNew = "var isGuest=!state.user;var nick=isGuest?'游客':esc(state.user.nickname||state.user.username);";
  if (js.includes(nickOld)) {
    js = js.replace(nickOld, nickNew);
    console.log('✅ 2/3 nick变量已修改');
    changes++;
  }
}

// === 3. 修改 renderHome 中 diary API 调用 ===
const oldDiary = "var results=await Promise.all([api('/diary/today'),api('/diary')]);";
const newDiary = "var todayData=null,diaryData=null;if(!isGuest){try{var results=await Promise.all([api('/diary/today'),api('/diary')]);todayData=results[0];diaryData=results[1];}catch(e){}}";

if (js.includes(oldDiary)) {
  js = js.replace(oldDiary, newDiary);
  console.log('✅ 3/3 diary API 容错');
  changes++;
} else {
  console.log('⚠️ diary API 未找到');
}

// === 4. 替换 renderHome 中的 results[0]/results[1] 引用 ===
// 在 renderHome 函数范围内
let homeStart = js.indexOf('async function renderHome()');
let homeEnd = js.indexOf('\nfunction ', homeStart + 20);
if (homeEnd < 0) homeEnd = js.indexOf('\nasync function ', homeStart + 20);
let homeBody = js.substring(homeStart, homeEnd);

// 找 results[0] 和 results[1]
if (homeBody.includes('results[0]')) {
  // 替换函数范围内的 results[0] -> todayData, results[1] -> diaryData
  let newHomeBody = homeBody.replace(/results\[0\]/g, 'todayData||{}').replace(/results\[1\]/g, 'diaryData||[]');
  js = js.substring(0, homeStart) + newHomeBody + js.substring(homeEnd);
  console.log('✅ 4 results[] 引用已替换');
  changes++;
}

// === 5. 在 renderHome 的健康日记快捷入口点击时检查登录 ===
// 让快捷入口在游客模式下提示登录而非崩溃
// 检查 navigate('diary-edit') 和 navigate('constitution') 等
// 这些已经通过 render() 的 needAuth 检查处理了

fs.writeFileSync(path, js, 'utf8');
console.log(`\n✅ 共修改 ${changes} 处，文件已保存`);

// 验证语法
try {
  require('fs').readFileSync(path, 'utf8');
  // 简单语法检查
  const opens = (js.match(/\{/g) || []).length;
  const closes = (js.match(/\}/g) || []).length;
  console.log(`括号检查: { ${opens} } ${closes} 差 ${opens - closes}`);
} catch(e) {
  console.log('❌ 保存失败:', e.message);
}
