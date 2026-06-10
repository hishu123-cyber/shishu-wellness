const fs = require('fs');
const path = 'D:/deepclaw/projects/wellness_app/frontend/app.js';
let js = fs.readFileSync(path, 'utf8');

// 在 renderLogin 函数末尾添加"跳过登录直接体验"按钮
// 找到 renderLogin 函数末尾的 HTML 闭合位置
const oldLoginEnd = "document.getElementById(\"login-pass\").addEventListener(\"keydown\",function(e){if(e.key===\"Enter\")handleLogin();});if(du){setTimeout(function(){handleLogin();},500);}},50);}";
const newLoginEnd = `document.getElementById(\"login-pass\").addEventListener(\"keydown\",function(e){if(e.key===\"Enter\")handleLogin();});if(du){setTimeout(function(){handleLogin();},500);}var skipBtn=document.createElement('button');skipBtn.className='btn btn-outline btn-block';skipBtn.style.marginTop='12px';skipBtn.textContent='跳过登录，先看看';skipBtn.onclick=function(){navigate('shop');};document.querySelector('.auth-form').appendChild(skipBtn);},50);}`;

if (js.includes(oldLoginEnd)) {
  js = js.replace(oldLoginEnd, newLoginEnd);
  console.log('✅ 跳过登录按钮已添加');
} else {
  console.log('❌ 未找到登录函数结尾');
  // 输出实际结尾
  const idx = js.indexOf('function renderLogin()');
  if (idx >= 0) {
    console.log('实际结尾:', js.substring(idx + 1200, idx + 1500));
  }
}

// 在 index.html 中添加 app.js 版本戳防止缓存
const idxPath = 'D:/deepclaw/projects/wellness_app/frontend/index.html';
let html = fs.readFileSync(idxPath, 'utf8');

// 找到 app.js 引用，加版本戳
const v = Date.now();
if (html.includes('src="/app.js"')) {
  html = html.replace('src="/app.js"', `src="/app.js?v=${v}"`);
  console.log(`✅ index.html 版本戳已添加 (v=${v})`);
}
fs.writeFileSync(idxPath, html, 'utf8');

// 同时更新 app.html 中的 app.js 引用
const appHtmlPath = 'D:/deepclaw/projects/wellness_app/frontend/app.html';
let appHtml = fs.readFileSync(appHtmlPath, 'utf8');
if (appHtml.includes('src="/app.js"')) {
  appHtml = appHtml.replace('src="/app.js"', `src="/app.js?v=${v}"`);
  fs.writeFileSync(appHtmlPath, appHtml, 'utf8');
  console.log('✅ app.html 版本戳已添加');
}

fs.writeFileSync(path, js, 'utf8');

// 语法检查
const opens = (js.match(/\{/g) || []).length;
const closes = (js.match(/\}/g) || []).length;
console.log(`括号检查: { ${opens} } ${closes} 差 ${opens - closes}`);
try {
  require('vm').createScript(js);
  console.log('✅ 语法检查通过');
} catch(e) {
  console.log('❌ 语法错误:', e.message);
}
