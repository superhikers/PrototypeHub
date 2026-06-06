import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/connection.js';

const router = Router();

const updateSchema = z.object({
  allow_comment: z.boolean().optional(),
  allow_annotate: z.boolean().optional(),
});

// 获取项目设置
router.get('/projects/:pid/settings', (req, res, next) => {
  try {
    const db = getDb();
    const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(req.params.pid);
    if (!project) return res.status(404).json({ error: { message: '项目不存在' } });

    let settings = db.prepare('SELECT * FROM settings WHERE project_id = ?').get(req.params.pid);
    if (!settings) {
      const id = uuid();
      db.prepare('INSERT INTO settings (id, project_id) VALUES (?, ?)').run(id, req.params.pid);
      settings = db.prepare('SELECT * FROM settings WHERE id = ?').get(id);
    }
    res.json({ data: settings });
  } catch (err) { next(err); }
});

// 更新项目设置
router.put('/projects/:pid/settings', (req, res, next) => {
  try {
    const data = updateSchema.parse(req.body);
    const db = getDb();
    const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(req.params.pid);
    if (!project) return res.status(404).json({ error: { message: '项目不存在' } });

    let settings = db.prepare('SELECT * FROM settings WHERE project_id = ?').get(req.params.pid);
    if (!settings) {
      const id = uuid();
      db.prepare('INSERT INTO settings (id, project_id) VALUES (?, ?)').run(id, req.params.pid);
    }

    const toInt = (v) => v === undefined ? null : (v ? 1 : 0);
    db.prepare(
      'UPDATE settings SET allow_comment = COALESCE(?, allow_comment), allow_annotate = COALESCE(?, allow_annotate) WHERE project_id = ?'
    ).run(toInt(data.allow_comment), toInt(data.allow_annotate), req.params.pid);

    const updated = db.prepare('SELECT * FROM settings WHERE project_id = ?').get(req.params.pid);
    res.json({ data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: { message: '参数错误', details: err.errors } });
    next(err);
  }
});

export default router;
