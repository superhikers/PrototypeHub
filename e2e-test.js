// Full E2E test for PrototypeHub prototype/folder/upload flow
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const API = 'http://localhost:3001';
let passed = 0, failed = 0;

function assert(condition, msg) {
  if (condition) { passed++; console.log('  ✅', msg); }
  else { failed++; console.error('  ❌', msg); }
}

async function req(method, urlPath, opts = {}) {
  const url = new URL(urlPath, API);
  return new Promise((resolve, reject) => {
    const options = { method, hostname: url.hostname, port: url.port, path: url.pathname + (url.search || '') };

    if (opts.formData) {
      const boundary = '----TestBoundary' + Date.now();
      const bodyParts = [];
      opts.formData.forEach((f, i) => {
        if (f.type === 'file') {
          bodyParts.push(Buffer.from(
            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="${f.name}"; filename="${f.filename}"\r\n` +
            `Content-Type: text/html\r\n\r\n`
          ));
          bodyParts.push(Buffer.from(f.content));
          bodyParts.push(Buffer.from('\r\n'));
        } else {
          bodyParts.push(Buffer.from(
            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="${f.name}"\r\n\r\n` +
            `${f.value}\r\n`
          ));
        }
      });
      bodyParts.push(Buffer.from(`--${boundary}--\r\n`));
      const body = Buffer.concat(bodyParts);
      options.headers = {
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        'Content-Length': body.length,
      };
      options.agent = false;
      options.headers = options.headers || {};
      options.headers['Connection'] = 'close';
      const r = http.request(options, res => {
        let data = '';
        res.on('data', d => data += d);
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
          catch (e) { resolve({ status: res.statusCode, body: data }); }
        });
      });
      r.on('error', reject);
      r.write(body);
      r.end();
    } else {
      const bodyStr = JSON.stringify(opts.body || {});
      options.agent = false;
      options.headers = { 'Content-Type': 'application/json', 'Connection': 'close' };
      const r = http.request(options, res => {
        let data = '';
        res.on('data', d => data += d);
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
          catch (e) { resolve({ status: res.statusCode, body: data }); }
        });
      });
      r.on('error', reject);
      r.write(bodyStr);
      r.end();
    }
  });
}

async function main() {
  console.log('\n========== E2E 全流程测试 ==========\n');

  // 1. Create project
  console.log('【1. 创建项目】');
  const r1 = await req('POST', '/api/projects', { body: { name: 'E2E测试项目', description: '全流程测试' } });
  assert(r1.status === 201 && r1.body.data?.id, `项目创建成功 ID: ${r1.body.data?.id?.substring(0,8)}`);
  const pid = r1.body.data.id;

  // 2. Create folders
  console.log('\n【2. 创建文件夹】');
  const r2a = await req('POST', `/api/projects/${pid}/folders`, { body: { name: '登录页' } });
  assert(r2a.status === 201 && r2a.body.data?.id, `文件夹"登录页"创建成功`);
  const folder1Id = r2a.body.data.id;

  const r2b = await req('POST', `/api/projects/${pid}/folders`, { body: { name: '首页' } });
  assert(r2b.status === 201 && r2b.body.data?.id, `文件夹"首页"创建成功`);
  const folder2Id = r2b.body.data.id;

  // 3. Upload to folder 1 with Chinese filename
  console.log('\n【3. 文件夹1上传中文名文件】');
  const r3 = await req('POST', `/api/projects/${pid}/versions`, {
    formData: [
      { type: 'file', name: 'file', filename: '登录页.html', content: '<h1>登录页面</h1>' },
      { type: 'text', name: 'title', value: '登录页.html' },
      { type: 'text', name: 'folder_id', value: folder1Id },
    ]
  });
  assert(r3.status === 201 && r3.body.data?.id, `上传成功，版本号: ${r3.body.data?.version_number}`);
  assert(r3.body.data?.folder_id === folder1Id, `版本归入文件夹1`);
  const v1Id = r3.body.data.id;
  const p1Id = r3.body.data.prototype_id;
  assert(p1Id, `原型ID已分配: ${p1Id?.substring(0,8)}`);

  // 4. Check prototype in folder 1
  console.log('\n【4. 查看文件夹1的原型列表】');
  const r4 = await req('GET', `/api/projects/${pid}/prototypes?folder_id=${folder1Id}`);
  assert(r4.status === 200, `请求成功`);
  assert(r4.body.data.length === 1, `文件夹1有1个原型`);
  assert(r4.body.data[0].name === '登录页.html' || r4.body.data[0].name.includes('登录'), `原型名称正确: ${r4.body.data[0].name}`);

  // 5. Upload same name to folder 1 (should create v2)
  console.log('\n【5. 文件夹1上传同名文件 → 版本2】');
  const r5 = await req('POST', `/api/projects/${pid}/versions`, {
    formData: [
      { type: 'file', name: 'file', filename: '登录页.html', content: '<h1>登录页面v2</h1>' },
      { type: 'text', name: 'title', value: '登录页.html' },
      { type: 'text', name: 'folder_id', value: folder1Id },
    ]
  });
  assert(r5.status === 201, `上传成功`);
  assert(r5.body.data.prototype_id === p1Id, `归入同一原型`);
  assert(r5.body.data.version_number === 2, `版本号为2`);

  // 6. Check folder 1 prototype now has 2 versions
  console.log('\n【6. 验证文件夹1原型版本数】');
  const r6 = await req('GET', `/api/projects/${pid}/prototypes?folder_id=${folder1Id}`);
  assert(r6.body.data.length === 1, `仍有1个原型`);
  assert(r6.body.data[0].version_count === 2, `版本数为2`);
  assert(r6.body.data[0].latest_version === 2, `最新版本为2`);

  // 7. Upload to folder 2 with different Chinese name
  console.log('\n【7. 文件夹2上传中文名文件】');
  const r7 = await req('POST', `/api/projects/${pid}/versions`, {
    formData: [
      { type: 'file', name: 'file', filename: '首页.html', content: '<h1>首页</h1>' },
      { type: 'text', name: 'title', value: '首页.html' },
      { type: 'text', name: 'folder_id', value: folder2Id },
    ]
  });
  assert(r7.status === 201, `上传成功`);
  assert(r7.body.data.folder_id === folder2Id, `归入文件夹2`);
  const p2Id = r7.body.data.prototype_id;
  assert(p2Id !== p1Id, `创建了不同的原型`);

  // 8. Check folder 2 has its own prototype
  console.log('\n【8. 验证文件夹2的原型】');
  const r8 = await req('GET', `/api/projects/${pid}/prototypes?folder_id=${folder2Id}`);
  assert(r8.body.data.length === 1, `文件夹2有1个原型`);
  assert(r8.body.data[0].name.includes('首页'), `原型名称含"首页": ${r8.body.data[0].name}`);
  assert(r8.body.data[0].version_count === 1, `版本数为1`);

  // 9. Check all prototypes across both folders
  console.log('\n【9. 查看全部原型】');
  const r9 = await req('GET', `/api/projects/${pid}/prototypes`);
  assert(r9.body.data.length === 2, `共有2个原型`);
  r9.body.data.forEach(p => console.log(`    原型: ${p.name} | v${p.latest_version} | ${p.version_count}版本 | 文件夹: ${p.folder_id === folder1Id ? '登录页' : p.folder_id === folder2Id ? '首页' : '无'}`));

  // 10. Upload without folder (root level)
  console.log('\n【10. 无文件夹上传】');
  const r10 = await req('POST', `/api/projects/${pid}/versions`, {
    formData: [
      { type: 'file', name: 'file', filename: '其他.html', content: '<h1>其他</h1>' },
      { type: 'text', name: 'title', value: '其他.html' },
    ]
  });
  assert(r10.status === 201, `上传成功`);
  assert(!r10.body.data.folder_id, `无文件夹`);

  // 11. Final check
  console.log('\n【11. 最终状态】');
  const r11 = await req('GET', `/api/projects/${pid}/prototypes`);
  assert(r11.body.data.length === 3, `共3个原型`);
  console.log('\n');

  // Summary
  console.log(`========== 测试结果: ${passed} 通过, ${failed} 失败 ==========`);
  if (failed > 0) process.exit(1);
}

main().catch(e => {
  console.error('测试异常:', e.message);
  process.exit(1);
});
