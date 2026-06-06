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

const server = app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});

function gracefulShutdown() {
  console.log('\nShutting down...');
  const db = getDb();
  if (db) db.close();
  server.close(() => process.exit(0));
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

export default app;
