---
name: cloudflare-workers-fullstack
description: 当任务涉及 Worker、Hono、Wrangler、D1、R2 或 Durable Objects 时触发。
---

# Cloudflare Workers 全栈开发

## 什么时候触发

当任务涉及 Worker、Hono、Wrangler、D1、R2 或 Durable Objects 时触发。

## 开发规则

使用 Cloudflare-first 架构，Worker 负责 BFF，复杂会话状态进入 Durable Objects，平台数据进入 D1，素材进入 R2。

## 禁止事项

不要写成传统 Node/Express 后端；Phase 0 不创建真实 Cloudflare 资源。

## Checklist

- 新增 Worker API 前先确认协议类型
- 不要部署
- 不要修改 DNS

## 项目示例

示例：为 `/api/games` 增加字段时，先更新 `packages/protocol`，再更新 `apps/worker`。
