import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import path from 'path';
import fs from 'fs';
import { getDb } from '../db/connection.js';
import { upload } from '../middleware/upload.js';
import config from '../config.js';

const router = Router();

const postMessageScript = `<script>parent.postMessage({type:'resize',height:document.body.scrollHeight},'*')</script>`;

// 版本列表（可按原型筛选）
router.get('/projects/:pid/versions', (req, res, next) => {
  try {
    const db = getDb();
    const { prototype_id } = req.query;
    let sql = 'SELECT v.*, (SELECT COUNT(*) FROM annotations WHERE version_id = v.id) AS annotation_count FROM prototype_versions v WHERE v.project_id = ?';
    const params = [req.params.pid];

    if (prototype_id) {
      sql += ' AND v.prototype_id = ?';
      params.push(prototype_id);
    }
    sql += ' ORDER BY v.version_number DESC';

    const versions = db.prepare(sql).all(...params);
    res.json({ data: versions });
  } catch (err) { next(err); }
});

// 上传 HTML 创建版本（支持原型管理）
router.post('/projects/:pid/versions', upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: { message: '请上传 HTML 文件' } });
    const title = req.body.title || '';
    const folderId = req.body.folder_id || null;
    const prototypeId = req.body.prototype_id || null;

    const db = getDb();
    const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(req.params.pid);
    if (!project) return res.status(404).json({ error: { message: '项目不存在' } });

    // Determine prototype
    let ptid = prototypeId;
    if (!ptid) {
      const baseName = req.file.originalname.replace(/\.[^.]+$/, '');
      const existing = db.prepare('SELECT id FROM prototypes WHERE project_id = ? AND name = ?').get(req.params.pid, baseName);
      if (existing) {
        ptid = existing.id;
      } else {
        ptid = uuid();
        db.prepare('INSERT INTO prototypes (id, project_id, folder_id, name) VALUES (?, ?, ?, ?)')
          .run(ptid, req.params.pid, folderId, baseName);
      }
    }

    // Max version number per prototype
    const maxVer = db.prepare('SELECT MAX(version_number) AS max_ver FROM prototype_versions WHERE prototype_id = ?').get(ptid);
    const versionNumber = (maxVer?.max_ver || 0) + 1;
    const id = uuid();

    db.prepare(
      'INSERT INTO prototype_versions (id, project_id, prototype_id, version_number, title, source, html_file_path, folder_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, req.params.pid, ptid, versionNumber, title, 'upload', req.file.filename, folderId);

    db.prepare("UPDATE projects SET updated_at = datetime('now') WHERE id = ?").run(req.params.pid);
    db.prepare("UPDATE prototypes SET updated_at = datetime('now') WHERE id = ?").run(ptid);

    const version = db.prepare('SELECT * FROM prototype_versions WHERE id = ?').get(id);
    res.status(201).json({ data: version });
  } catch (err) { next(err); }
});

// 版本详情
router.get('/projects/:pid/versions/:vid', (req, res, next) => {
  try {
    const db = getDb();
    const version = db.prepare('SELECT * FROM prototype_versions WHERE id = ? AND project_id = ?').get(req.params.vid, req.params.pid);
    if (!version) return res.status(404).json({ error: { message: '版本不存在' } });
    res.json({ data: version });
  } catch (err) { next(err); }
});

// 编辑版本描述
router.put('/projects/:pid/versions/:vid', (req, res, next) => {
  try {
    const schema = z.object({ title: z.string().max(200).optional() });
    const data = schema.parse(req.body);
    const db = getDb();
    const version = db.prepare('SELECT * FROM prototype_versions WHERE id = ? AND project_id = ?').get(req.params.vid, req.params.pid);
    if (!version) return res.status(404).json({ error: { message: '版本不存在' } });
    db.prepare('UPDATE prototype_versions SET title = COALESCE(?, title) WHERE id = ?').run(data.title ?? null, req.params.vid);
    const updated = db.prepare('SELECT * FROM prototype_versions WHERE id = ?').get(req.params.vid);
    res.json({ data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: { message: '参数错误', details: err.errors } });
    next(err);
  }
});

// 删除版本（级联删除标注和评论 + 删除物理文件）
router.delete('/projects/:pid/versions/:vid', (req, res, next) => {
  try {
    const db = getDb();
    const version = db.prepare('SELECT * FROM prototype_versions WHERE id = ? AND project_id = ?').get(req.params.vid, req.params.pid);
    if (!version) return res.status(404).json({ error: { message: '版本不存在' } });

    const filePath = path.resolve(config.uploadDir, version.html_file_path);
    try { fs.unlinkSync(filePath); } catch {}

    db.prepare('DELETE FROM prototype_versions WHERE id = ?').run(req.params.vid);
    res.json({ data: { id: req.params.vid } });
  } catch (err) { next(err); }
});

// raw HTML 服务（供 iframe 直接引用，自动注入 postMessage）
router.get('/raw/:vid', (req, res, next) => {
  try {
    const db = getDb();
    const version = db.prepare('SELECT * FROM prototype_versions WHERE id = ?').get(req.params.vid);
    if (!version) return res.status(404).json({ error: { message: '版本不存在' } });

    const filePath = path.resolve(config.uploadDir, version.html_file_path);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: { message: '文件不存在' } });

    let html = fs.readFileSync(filePath, 'utf-8');
    // 注入 postMessage 实现 iframe 高度自适应
    html = html.replace('</body>', `${postMessageScript}</body>`);

    res.type('text/html; charset=utf-8').send(html);
  } catch (err) { next(err); }
});

export default router;
