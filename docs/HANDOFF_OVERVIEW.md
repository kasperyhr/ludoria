English summary:
This document is the overview handoff guide for Ludoria. It explains the project, current state, architecture boundaries, and which documents to read for each development direction. Read this first before starting any new feature.

---

# Ludoria Handoff Overview

## 项目简介

Ludoria 是一个 Cloudflare-first TypeScript monorepo，在线桌游 Game Hub。支持多人隐藏信息桌游（服务器权威状态）和单人益智 puzzle。

## 当前完成阶段

Phase 0-8C：monorepo scaffold、Web+Worker runnable shell、Token Bluffing multiplayer demo、Sudoku Lite solo puzzle、Durable Object 架构、D1 metadata layer、本地部署 readiness、Cloudflare preview deploy、UI polish、Worker Static Assets MVP。

## Preview URL

https://ludoria-worker.kasperyhr.workers.dev/

## 当前部署方式

Worker Static Assets MVP：Worker 同时服务 Web UI 和 API。未来计划迁移到 Cloudflare Pages + Worker API。

## Monorepo 结构

```
apps/web       Vite + React 前端
apps/worker    Cloudflare Workers + Hono API
packages/game-engine    游戏引擎抽象
packages/game-definitions   游戏规则实现
packages/protocol       共享协议类型 + Valibot
packages/db             Drizzle ORM + D1 schema
packages/ui             基础 UI 组件
packages/config         共享配置
scripts/                工具脚本
docs/                   文档
.agents/skills/         Codex repo-scoped skills
```

## 关键架构边界

- Durable Object storage：多人房间权威状态、隐藏信息、session snapshot
- D1：平台 metadata（游戏目录、session 摘要、puzzle progress），不含 hidden state
- Web：展示和交互，不保存权威状态

## 当前可玩的 Demo

- Token Bluffing Demo — 多人隐藏信息架构验证
- Sudoku Lite — 4x4 单人数独流程验证
- Nonogram — 规划中，不可玩

## 开发方向与对应文档

| 方向 | 文档 |
|------|------|
| 前端 UX | docs/HANDOFF_FRONTEND_UX.md |
| 游戏开发 | docs/HANDOFF_GAME_DEVELOPMENT.md |
| Admin/安全 | docs/HANDOFF_ADMIN_SECURITY.md |
| 认证/账户 | docs/HANDOFF_AUTH_ACCOUNT.md |
| 部署 | docs/HANDOFF_DEPLOYMENT.md |
| 后续 Phase 计划 | docs/NEXT_PHASE_PLAN.md |
