import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/connection.js';

const router = Router();

const createSchema = z.object({
  author: z.string().min(1, '作者名不能为空'),
  content: z.string().min(1, '评论内容不能为空'),
  parentId: z.string().nullable().optional(),
});

// 获取标注的评论列表
router.get('/annotations/:aid/comments', (req, res, next) => {
  try {
    const db = getDb();
    const comments = db.prepare(
      'SELECT * FROM comments WHERE annotation_id = ? ORDER BY created_at ASC'
    ).all(req.params.aid);
    res.json({ data: comments });
  } catch (err) { next(err); }
});

// 添加评论
router.post('/annotations/:aid/comments', (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const db = getDb();
    const annotation = db.prepare('SELECT id FROM annotations WHERE id = ?').get(req.params.aid);
    if (!annotation) return res.status(404).json({ error: { message: '标注不存在' } });

    if (data.parentId) {
      const parent = db.prepare('SELECT id FROM comments WHERE id = ? AND annotation_id = ?').get(data.parentId, req.params.aid);
      if (!parent) return res.status(404).json({ error: { message: '父评论不存在' } });
    }

    const id = uuid();
    db.prepare(
      'INSERT INTO comments (id, annotation_id, author, content, parent_id) VALUES (?, ?, ?, ?, ?)'
    ).run(id, req.params.aid, data.author, data.content, data.parentId || null);

    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(id);
    res.status(201).json({ data: comment });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: { message: '参数错误', details: err.errors } });
    next(err);
  }
});

export default router;
