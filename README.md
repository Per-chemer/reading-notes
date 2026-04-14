<<<<<<< HEAD
# reading-notes
读书笔记
=======
# Reading Notes MVP

前后端分离的读书笔记项目，支持邮箱密码登录、笔记增删改查、关键词搜索。

## 目录

- `frontend`：React + Vite 前端
- `backend`：Express + PostgreSQL API

## 使用 Supabase 数据库

### 1) 在 Supabase 创建项目

- 打开 [Supabase Dashboard](https://supabase.com/dashboard)
- 创建新项目
- 进入 `Project Settings -> Database`
- 复制连接串（Connection string / URI）

### 2) 导入表结构

在 Supabase 的 SQL Editor 里执行 `backend/db/schema.sql` 全部内容。

### 3) 配置后端环境变量

```bash
cd backend
copy .env.example .env
```

然后把 `.env` 里的 `DATABASE_URL` 改成你的 Supabase URI，保留：

- `DATABASE_SSL=true`
- `JWT_SECRET=<你的随机密钥>`

### 4) 启动后端

```bash
cd backend
npm run dev
```

默认监听 `http://localhost:4000`。

### 5) 启动前端

```bash
cd frontend
copy .env.example .env
npm run dev
```

默认地址 `http://localhost:5173`。

## 一步启动（Supabase 版，Windows）

在项目根目录执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\start-supabase.ps1
```

脚本会自动完成：
- 生成缺失的 `backend/.env`、`frontend/.env`
- 安装前后端依赖
- 分别打开两个终端运行前后端
>>>>>>> 08b0c63 (init: reading-notes with frontend and backend)
