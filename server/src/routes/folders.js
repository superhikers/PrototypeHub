import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/connection.js';

const router = Router();

const createSchema = z.object({
  name: z.string().min(1).max(100),
});

const updateSchema = z.object({
  name: z.string().min(1).max(100),
});

// 获取项目的所有文件夹（含版本数）
router.get('/projects/:pid/folders', (req, res, next) => {
  try {
    const db = getDb();
    const folders = db.prepare(
      `SELECT f.*, (SELECT COUNT(*) FROM prototype_versions v WHERE v.folder_id = f.id) AS version_count
       FROM folders f WHERE f.project_id = ? ORDER BY f.created_at ASC`
    ).all(req.params.pid);
    res.json({ data: folders });
  } catch (err) { next(err); }
});

// 创建文件夹
router.post('/projects/:pid/folders', (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const db = getDb();
    const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(req.params.pid);
    if (!project) return res.status(404).json({ error: { message: '项目不存在' } });
    const id = uuid();
    db.prepare('INSERT INTO folders (id, project_id, name) VALUES (?, ?, ?)').run(id, req.params.pid, data.name);
    const folder = db.prepare('SELECT * FROM folders WHERE id = ?').get(id);
    res.status(201).json({ data: folder });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: { message: '参数错误', details: err.errors } });
    next(err);
  }
});

// 重命名文件夹
router.put('/folders/:fid', (req, res, next) => {
  try {
    const data = updateSchema.parse(req.body);
    const db = getDb();
    const folder = db.prepare('SELECT * FROM folders WHERE id = ?').get(req.params.fid);
    if (!folder) return res.status(404).json({ error: { message: '文件夹不存在' } });
    db.prepare('UPDATE folders SET name = ? WHERE id = ?').run(data.name, req.params.fid);
    const updated = db.prepare('SELECT * FROM folders WHERE id = ?').get(req.params.fid);
    res.json({ data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: { message: '参数错误', details: err.errors } });
    next(err);
  }
});

// 删除文件夹（版本移出到根目录）
router.delete('/folders/:fid', (req, res, next) => {
  try {
    const db = getDb();
    const folder = db.prepare('SELECT * FROM folders WHERE id = ?').get(req.params.fid);
    if (!folder) return res.status(404).json({ error: { message: '文件夹不存在' } });
    db.prepare('UPDATE prototype_versions SET folder_id = NULL WHERE folder_id = ?').run(req.params.fid);
    db.prepare('DELETE FROM folders WHERE id = ?').run(req.params.fid);
    res.json({ data: { id: req.params.fid } });
  } catch (err) { next(err); }
});

export default router;
