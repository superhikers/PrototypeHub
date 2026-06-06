import express from 'express';
import cors from 'cors';
import { initDb } from './db/init.js';
import config from './config.js';

const app = express();

app.use(cors());
app.use(express.json());

initDb();

// 路由（后续 task 添加）
// import projectRoutes from './routes/projects.js';
// app.use('/api', projectRoutes);

// 全局错误处理
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({
    error: {
      message: err.message || '服务器内部错误',
      ...(err.code ? { code: err.code } : {}),
    },
  });
});

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});

export default app;
