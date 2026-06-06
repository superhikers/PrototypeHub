# PrototypeHub

AI 驱动的开源原型协作平台。面向小型技术团队，提供从 AI 原型生成、版本管理到团队标注协作的全流程工具。

## 功能

- **AI 对话生成原型（即将推出）** — 通过对话直接生成 HTML 原型
- **AI 微调已有原型（即将推出）** — 输入修改需求，AI 生成新版本
- **在线原型展示** — iframe 安全沙箱渲染，高度自适应
- **版本管理** — 多版本自增，按原型分组管理，文件夹归类
- **标注系统** — 点击/拖拽创建便签，颜色标记，位置标记
- **评论系统** — 标注下评论和回复，支持嵌套
- **分辨率切换** — Desktop / Tablet / Mobile 预览
- **项目管理** — 创建、组织、删除
- **Docker 部署** — 一键启动

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Vite + Pinia + Vue Router + Tailwind CSS |
| 后端 | Node.js + Express |
| 数据库 | SQLite + better-sqlite3 |
| 部署 | Docker + docker-compose |

## 快速开始

```bash
# 开发环境
git clone https://gitee.com/hikers/prototype-hub.git
cd prototype-hub
npm install
npm run dev
# 访问 http://localhost:5173
```

```bash
# 生产环境（Docker）
docker compose up -d
# 访问 http://localhost:3000
```

## 项目结构

```
prototypehub/
├── server/          # 后端 Express API
│   ├── src/
│   │   ├── routes/    # 路由
│   │   ├── db/        # 数据库连接和初始化
│   │   └── middleware/ # 中间件（文件上传等）
│   └── tests/         # 测试
├── client/          # 前端 Vue 3 SPA
│   ├── src/
│   │   ├── pages/     # 页面
│   │   ├── components/ # 组件
│   │   ├── stores/    # Pinia 状态管理
│   │   ├── router/    # 路由
│   │   └── utils/     # 工具函数
├── data/            # 运行数据（SQLite + HTML 文件）
└── docs/            # 设计文档
```

## License

MIT
