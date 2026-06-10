const fs = require('fs');
const ts = Date.now();
// sw.js
let sw = fs.readFileSync('D:/deepclaw/projects/wellness_app/frontend/sw.js', 'utf8');
sw = sw.replace(/CACHE_NAME\s*=\s*['"]v\d+['"]/, "CACHE_NAME = 'v5'");
fs.writeFileSync('D:/deepclaw/projects/wellness_app/frontend/sw.js', sw, 'utf8');
// app.html
let app = fs.readFileSync('D:/deepclaw/projects/wellness_app/frontend/app.html', 'utf8');
app = app.replace(/app\.js\?v=\d+/, 'app.js?v=' + ts);
app = app.replace(/styles\.css(\?v=\d+)?/, 'styles.css?v=' + ts);
fs.writeFileSync('D:/deepclaw/projects/wellness_app/frontend/app.html', app, 'utf8');
console.log('OK - sw.js v5, app.html v=' + ts);
