import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/connection.js';

const router = Router();

const createSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  color: z.string().optional().default('#FFD700'),
  content: z.string().optional().default(''),
  author: z.string().min(1, '作者名不能为空'),
});

const updateSchema = z.object({
  x: z.number().min(0).max(100).optional(),
  y: z.number().min(0).max(100).optional(),
  color: z.string().optional(),
  content: z.string().optional(),
});

// 获取版本的所有标注
router.get('/versions/:vid/annotations', (req, res, next) => {
  try {
    const db = getDb();
    const annotations = db.prepare(
      'SELECT * FROM annotations WHERE version_id = ? ORDER BY created_at ASC'
    ).all(req.params.vid);
    res.json({ data: annotations });
  } catch (err) { next(err); }
});

// 创建标注
router.post('/versions/:vid/annotations', (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const db = getDb();
    const version = db.prepare('SELECT id FROM prototype_versions WHERE id = ?').get(req.params.vid);
    if (!version) return res.status(404).json({ error: { message: '版本不存在' } });

    const id = uuid();
    db.prepare(
      'INSERT INTO annotations (id, version_id, x, y, color, content, author) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, req.params.vid, data.x, data.y, data.color, data.content, data.author);

    const annotation = db.prepare('SELECT * FROM annotations WHERE id = ?').get(id);
    res.status(201).json({ data: annotation });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: { message: '参数错误', details: err.errors } });
    next(err);
  }
});

// 编辑标注
router.put('/versions/:vid/annotations/:aid', (req, res, next) => {
  try {
    const data = updateSchema.parse(req.body);
    const db = getDb();
    const annotation = db.prepare('SELECT * FROM annotations WHERE id = ? AND version_id = ?').get(req.params.aid, req.params.vid);
    if (!annotation) return res.status(404).json({ error: { message: '标注不存在' } });

    db.prepare(
      'UPDATE annotations SET x = COALESCE(?, x), y = COALESCE(?, y), color = COALESCE(?, color), content = COALESCE(?, content) WHERE id = ?'
    ).run(data.x ?? null, data.y ?? null, data.color ?? null, data.content ?? null, req.params.aid);

    const updated = db.prepare('SELECT * FROM annotations WHERE id = ?').get(req.params.aid);
    res.json({ data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: { message: '参数错误', details: err.errors } });
    next(err);
  }
});

// 删除标注
router.delete('/versions/:vid/annotations/:aid', (req, res, next) => {
  try {
    const db = getDb();
    const annotation = db.prepare('SELECT * FROM annotations WHERE id = ? AND version_id = ?').get(req.params.aid, req.params.vid);
    if (!annotation) return res.status(404).json({ error: { message: '标注不存在' } });
    db.prepare('DELETE FROM annotations WHERE id = ?').run(req.params.aid);
    res.json({ data: { id: req.params.aid } });
  } catch (err) { next(err); }
});

export default router;
