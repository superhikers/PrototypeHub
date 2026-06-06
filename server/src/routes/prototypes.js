import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/connection.js';

const router = Router();

// 获取项目的原型列表（含版本统计）
router.get('/projects/:pid/prototypes', (req, res, next) => {
  try {
    const db = getDb();
    const { folder_id } = req.query;
    let sql = `SELECT p.*,
      (SELECT MAX(version_number) FROM prototype_versions v WHERE v.prototype_id = p.id) AS latest_version,
      (SELECT COUNT(*) FROM prototype_versions v WHERE v.prototype_id = p.id) AS version_count
      FROM prototypes p WHERE p.project_id = ?`;
    const params = [req.params.pid];

    if (folder_id) {
      sql += ' AND p.folder_id = ?';
      params.push(folder_id);
    }
    sql += ' ORDER BY p.updated_at DESC';

    const prototypes = db.prepare(sql).all(...params);
    res.json({ data: prototypes });
  } catch (err) { next(err); }
});

// 创建原型
router.post('/projects/:pid/prototypes', (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(1).max(200),
      folder_id: z.string().nullable().optional(),
    });
    const data = schema.parse(req.body);
    const db = getDb();
    const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(req.params.pid);
    if (!project) return res.status(404).json({ error: { message: '项目不存在' } });
    const id = uuid();
    db.prepare('INSERT INTO prototypes (id, project_id, folder_id, name) VALUES (?, ?, ?, ?)')
      .run(id, req.params.pid, data.folder_id || null, data.name);
    const proto = db.prepare('SELECT * FROM prototypes WHERE id = ?').get(id);
    res.status(201).json({ data: proto });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: { message: '参数错误', details: err.errors } });
    next(err);
  }
});

// 重命名原型
router.put('/prototypes/:ptid', (req, res, next) => {
  try {
    const schema = z.object({ name: z.string().min(1).max(200) });
    const data = schema.parse(req.body);
    const db = getDb();
    const proto = db.prepare('SELECT * FROM prototypes WHERE id = ?').get(req.params.ptid);
    if (!proto) return res.status(404).json({ error: { message: '原型不存在' } });
    db.prepare('UPDATE prototypes SET name = ?, updated_at = datetime(\'now\') WHERE id = ?').run(data.name, req.params.ptid);
    res.json({ data: { ...proto, name: data.name } });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: { message: '参数错误', details: err.errors } });
    next(err);
  }
});

// 删除原型（级联删除所有版本）
router.delete('/prototypes/:ptid', (req, res, next) => {
  try {
    const db = getDb();
    const proto = db.prepare('SELECT * FROM prototypes WHERE id = ?').get(req.params.ptid);
    if (!proto) return res.status(404).json({ error: { message: '原型不存在' } });
    db.prepare('DELETE FROM prototypes WHERE id = ?').run(req.params.ptid);
    res.json({ data: { id: req.params.ptid } });
  } catch (err) { next(err); }
});

export default router;
