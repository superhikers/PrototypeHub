import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/connection.js';

const router = Router();

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().default(''),
});

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

router.post('/projects', (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const db = getDb();
    const id = uuid();
    db.prepare('INSERT INTO projects (id, name, description) VALUES (?, ?, ?)').run(id, data.name, data.description);
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    res.status(201).json({ data: project });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: { message: '参数错误', details: err.errors } });
    next(err);
  }
});

router.get('/projects', (_req, res, next) => {
  try {
    const db = getDb();
    const projects = db.prepare('SELECT * FROM projects ORDER BY updated_at DESC').all();
    res.json({ data: projects });
  } catch (err) { next(err); }
});

router.get('/projects/:id', (req, res, next) => {
  try {
    const db = getDb();
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) return res.status(404).json({ error: { message: '项目不存在' } });
    res.json({ data: project });
  } catch (err) { next(err); }
});

router.put('/projects/:id', (req, res, next) => {
  try {
    const data = updateSchema.parse(req.body);
    const db = getDb();
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) return res.status(404).json({ error: { message: '项目不存在' } });
    db.prepare("UPDATE projects SET name = COALESCE(?, name), description = COALESCE(?, description), updated_at = datetime('now') WHERE id = ?")
      .run(data.name ?? null, data.description !== undefined ? data.description : null, req.params.id);
    const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    res.json({ data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: { message: '参数错误', details: err.errors } });
    next(err);
  }
});

router.delete('/projects/:id', (req, res, next) => {
  try {
    const db = getDb();
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) return res.status(404).json({ error: { message: '项目不存在' } });
    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    res.json({ data: { id: req.params.id } });
  } catch (err) { next(err); }
});

export default router;
