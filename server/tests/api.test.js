import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import app from '../src/index.js';
import { getDb } from '../src/db/connection.js';

const request = supertest(app);

describe('Projects API', () => {
  const testProject = { name: '测试项目', description: '这是一个测试' };

  beforeEach(() => {
    getDb().prepare('DELETE FROM projects').run();
  });

  it('POST /api/projects — 创建项目', async () => {
    const res = await request.post('/api/projects').send(testProject);
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.name).toBe('测试项目');
  });

  it('GET /api/projects — 项目列表', async () => {
    const res = await request.get('/api/projects');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(0);
  });

  it('GET /api/projects/:id — 项目详情', async () => {
    const created = await request.post('/api/projects').send(testProject);
    const res = await request.get(`/api/projects/${created.body.data.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('测试项目');
  });

  it('PUT /api/projects/:id — 编辑项目', async () => {
    const created = await request.post('/api/projects').send(testProject);
    const res = await request.put(`/api/projects/${created.body.data.id}`).send({ name: '新名字' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('新名字');
  });

  it('DELETE /api/projects/:id — 删除项目', async () => {
    const created = await request.post('/api/projects').send(testProject);
    const res = await request.delete(`/api/projects/${created.body.data.id}`);
    expect(res.status).toBe(200);
    const getRes = await request.get(`/api/projects/${created.body.data.id}`);
    expect(getRes.status).toBe(404);
  });

  it('POST /api/projects — 空名称返回 400', async () => {
    const res = await request.post('/api/projects').send({ name: '' });
    expect(res.status).toBe(400);
  });
});
