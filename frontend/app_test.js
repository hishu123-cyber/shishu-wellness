// 最小化测试版本 - 用于排查卡在加载的问题
console.log('[app_test] 脚本已加载');

// 最简单的 render 函数 - 直接显示内容，不调用 API
function render() {
  console.log('[render] 被调用');
  var app = document.getElementById('app');
  if (!app) {
    console.error('[render] 找不到 #app 元素');
    return;
  }
  app.innerHTML = '<div style="padding:40px;text-align:center">' +
    '<h1>✅ app.js 已加载</h1>' +
    '<p>如果你看到这个，说明 JavaScript 执行正常</p>' +
    '<button onclick="testAPI()">测试 API 连接</button>' +
    '<div id="api-result" style="margin-top:20px"></div>' +
  '</div>';
  console.log('[render] 内容已渲染');
}

function testAPI() {
  var result = document.getElementById('api-result');
  result.innerHTML = '正在测试...';
  fetch('/api/health')
    .then(function(r) { return r.json(); })
    .then(function(d) { result.innerHTML = '✅ API 正常: ' + JSON.stringify(d); })
    .catch(function(e) { result.innerHTML = '❌ API 失败: ' + e.message; });
}

// 页面加载后执行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', render);
} else {
  render();
}
