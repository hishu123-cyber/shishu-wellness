// 简单的测试脚本
const http = require('http');

// 测试 API
function testAPI() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:8000/api/shop/products', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const products = JSON.parse(data);
          console.log('✅ API 成功返回', products.length, '个商品');
          resolve(products);
        } catch (e) {
          console.log('❌ JSON 解析失败:', e.message);
          reject(e);
        }
      });
    }).on('error', e => {
      console.log('❌ 请求失败:', e.message);
      reject(e);
    });
  });
}

// 测试分类 API
function testCategories() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:8000/api/shop/categories', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const cats = JSON.parse(data);
          console.log('✅ 分类 API 成功返回', cats.length, '个分类');
          resolve(cats);
        } catch (e) {
          console.log('❌ 分类 JSON 解析失败:', e.message);
          reject(e);
        }
      });
    }).on('error', e => {
      console.log('❌ 分类请求失败:', e.message);
      reject(e);
    });
  });
}

// 测试购物车 API
function testCart() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:8000/api/shop/cart', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const cart = JSON.parse(data);
          console.log('✅ 购物车 API 成功返回', Array.isArray(cart) ? cart.length : '?','项');
          resolve(cart);
        } catch (e) {
          console.log('❌ 购物车 JSON 解析失败:', e.message);
          reject(e);
        }
      });
    }).on('error', e => {
      console.log('❌ 购物车请求失败:', e.message);
      reject(e);
    });
  });
}

async function run() {
  console.log('=== 商城 API 测试 ===\n');
  try {
    await testAPI();
    await testCategories();
    await testCart();
    console.log('\n✅ 所有 API 测试通过');
  } catch (e) {
    console.log('\n❌ 部分 API 测试失败');
  }
}

run();
