import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import { initDb } from './db/init.js';
import { getDb } from './db/connection.js';
import config from './config.js';

const app = express();

app.use(cors());
app.use(express.json());

initDb();

import projectRoutes from './routes/projects.js';
app.use('/api', projectRoutes);

import versionRoutes from './routes/versions.js';
app.use('/api', versionRoutes);

import annotationRoutes from './routes/annotations.js';
app.use('/api', annotationRoutes);

import commentRoutes from './routes/comments.js';
app.use('/api', commentRoutes);

import settingsRoutes from './routes/settings.js';
app.use('/api', settingsRoutes);

import folderRoutes from './routes/folders.js';
app.use('/api', folderRoutes);

import prototypeRoutes from './routes/prototypes.js';
app.use('/api', prototypeRoutes);

// 生产环境静态文件服务
if (process.env.NODE_ENV === 'production') {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  app.use(express.static(path.resolve(__dirname, '..', 'public')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'public', 'index.html'));
  });
}

// 全局错误处理
app.use((err, req, res, next) => {
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    error: {
      message: err.message || '服务器内部错误',
      ...(err.code ? { code: err.code } : {}),
    },
  });
});

const server = process.env.VITEST ? null : app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});

function gracefulShutdown() {
  console.log('\nShutting down...');
  const db = getDb();
  if (db) db.close();
  if (server) server.close(() => process.exit(0));
  else process.exit(0);
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

export default app;
