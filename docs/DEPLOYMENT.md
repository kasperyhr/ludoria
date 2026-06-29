# Deployment Plan

## 本地开发

使用 `corepack pnpm install` 安装依赖，`corepack pnpm dev` 启动可运行 shell。Phase 0 主要验证结构和类型。

## Wrangler

`apps/worker/wrangler.toml` 仅用于本地 Worker placeholder。根目录 `wrangler.example.toml` 记录未来配置形状。

## 未来 Cloudflare 部署步骤

后续阶段再创建 D1、R2、Durable Objects 绑定，配置环境变量，运行 migrations，然后部署 Worker 和前端资源。

## 当前限制

现在不要部署，不创建真实 Cloudflare 资源，不修改 DNS，不创建付费资源。
