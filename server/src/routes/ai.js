import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import fs from 'fs';
import path from 'path';
import { getDb } from '../db/connection.js';
import { LLMAdapter } from '../ai/llm.js';
import { systemPrompt, generatePrompt, modifyPrompt } from '../ai/prompts.js';
import config from '../config.js';

const router = Router();

function sse(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function extractAiConfig(req) {
  return {
    provider: req.headers['x-ai-provider'] || undefined,
    apiKey: req.headers['x-ai-api-key'] || undefined,
    baseUrl: req.headers['x-ai-base-url'] || undefined,
    model: req.headers['x-ai-model'] || undefined,
    maxTokens: req.headers['x-ai-max-tokens'] || undefined,
  }
}

// Test connection
router.post('/ai/test', async (req, res, next) => {
  try {
    const aiConfig = extractAiConfig(req)
    if (!aiConfig.apiKey) {
      // If no user API key, try server config
      const serverConfig = { provider: config.aiProvider, apiKey: config.claudeApiKey }
      if (!serverConfig.apiKey) {
        return res.status(400).json({ ok: false, error: '请提供 API Key 或配置服务端 Key' })
      }
      return res.json({ ok: true, message: '使用服务端配置' })
    }
    const adapter = new LLMAdapter(aiConfig)
    let receivedAny = false
    await adapter.generateStream(
      '回复"ok"即可',
      '你是一个测试助手。只回复"ok"。',
      () => { receivedAny = true },
      () => {},
      { maxRetries: 1 }
    )
    res.json({ ok: true, message: '连接成功' })
  } catch (err) {
    res.json({ ok: false, error: err.message })
  }
})

// AI Generate
router.post('/ai/generate', async (req, res) => {
  const { prompt, projectId } = req.body
  if (!prompt || !projectId) {
    return res.status(400).json({ error: { message: '缺少必要参数 prompt 或 projectId' } })
  }

  const db = getDb()
  const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(projectId)
  if (!project) return res.status(404).json({ error: { message: '项目不存在' } })

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  let aborted = false
  req.on('close', () => { aborted = true })

  const aiConfig = extractAiConfig(req)
  const adapter = new LLMAdapter(aiConfig)

  sse(res, 'progress', { step: 'starting', message: '正在准备生成环境...' })

  let fullHtml = ''
  const filename = `ai-${uuid()}.html`
  const onToken = (token) => { if (!aborted) sse(res, 'token', { html: token }) }
  const onProgress = (p) => { if (!aborted) sse(res, 'progress', p) }

  try {
    fullHtml = await adapter.generateStream(
      generatePrompt(prompt), systemPrompt(), onToken, onProgress
    )
  } catch (err) {
    if (!aborted) {
      sse(res, 'error', { error: err.message })
      res.end()
    }
    return
  }

  if (aborted) { res.end(); return }

  if (!fullHtml.trim()) {
    sse(res, 'error', { error: '生成内容为空，请重试' })
    res.end()
    return
  }

  const filePath = path.resolve(config.uploadDir, filename)
  fs.writeFileSync(filePath, fullHtml, 'utf-8')

  const ptid = uuid()
  const name = `AI 生成-${new Date().toLocaleString('zh-CN')}`
  db.prepare('INSERT INTO prototypes (id, project_id, folder_id, name) VALUES (?, ?, NULL, ?)').run(ptid, projectId, name)

  const versionNumber = 1
  const versionId = uuid()
  db.prepare(
    'INSERT INTO prototype_versions (id, project_id, prototype_id, version_number, title, source, html_file_path) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(versionId, projectId, ptid, versionNumber, 'AI 生成', 'ai', filename)

  db.prepare("UPDATE projects SET updated_at = datetime('now') WHERE id = ?").run(projectId)
  db.prepare("UPDATE prototypes SET updated_at = datetime('now') WHERE id = ?").run(ptid)

  sse(res, 'done', { versionId, prototypeId: ptid, name })
  res.end()
})

// AI Modify
router.post('/ai/modify', async (req, res) => {
  const { versionId, prompt } = req.body
  if (!versionId || !prompt) {
    return res.status(400).json({ error: { message: '缺少必要参数 versionId 或 prompt' } })
  }

  const db = getDb()
  const version = db.prepare('SELECT * FROM prototype_versions WHERE id = ?').get(versionId)
  if (!version) return res.status(404).json({ error: { message: '版本不存在' } })

  const filePath = path.resolve(config.uploadDir, version.html_file_path)
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: { message: 'HTML 文件不存在' } })

  const originalHtml = fs.readFileSync(filePath, 'utf-8')

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  let aborted = false
  req.on('close', () => { aborted = true })

  const aiConfig = extractAiConfig(req)
  const adapter = new LLMAdapter(aiConfig)

  sse(res, 'progress', { step: 'starting', message: '正在准备生成环境...' })

  let fullHtml = ''
  const filename = `ai-${uuid()}.html`
  const onToken = (token) => { if (!aborted) sse(res, 'token', { html: token }) }
  const onProgress = (p) => { if (!aborted) sse(res, 'progress', p) }

  try {
    fullHtml = await adapter.generateStream(
      modifyPrompt(originalHtml, prompt), systemPrompt(), onToken, onProgress
    )
  } catch (err) {
    if (!aborted) {
      sse(res, 'error', { error: err.message })
      res.end()
    }
    return
  }

  if (aborted) { res.end(); return }

  if (!fullHtml.trim()) {
    sse(res, 'error', { error: '生成内容为空，请重试' })
    res.end()
    return
  }

  const outPath = path.resolve(config.uploadDir, filename)
  fs.writeFileSync(outPath, fullHtml, 'utf-8')

  const maxVer = db.prepare('SELECT MAX(version_number) AS max_ver FROM prototype_versions WHERE prototype_id = ?').get(version.prototype_id)
  const versionNumber = (maxVer?.max_ver || 0) + 1
  const newVersionId = uuid()
  db.prepare(
    'INSERT INTO prototype_versions (id, project_id, prototype_id, version_number, title, source, html_file_path, folder_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(newVersionId, version.project_id, version.prototype_id, versionNumber, prompt.slice(0, 100), 'ai', filename, version.folder_id)

  db.prepare("UPDATE projects SET updated_at = datetime('now') WHERE id = ?").run(version.project_id)
  const prototype = db.prepare('SELECT name FROM prototypes WHERE id = ?').get(version.prototype_id)

  sse(res, 'done', { versionId: newVersionId, prototypeId: version.prototype_id, name: prototype?.name || '' })
  res.end()
})

export default router;
