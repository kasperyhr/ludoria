# Deployment Plan

## 本地开发

安装依赖：

```powershell
corepack pnpm install
```

启动 Worker：

```powershell
corepack pnpm dev:worker
```

启动 Web：

```powershell
corepack pnpm dev:web
```

也可以同时启动：

```powershell
corepack pnpm dev
```

## 本地联调

Worker 默认运行在：

```text
http://127.0.0.1:8787
```

Web 默认运行在：

```text
http://127.0.0.1:5173
```

Web 使用 Vite proxy 将 `/worker-api/*` 转发到本地 Worker。可以通过 `LUDORIA_WORKER_ORIGIN` 改写 proxy target，也可以通过 `VITE_LUDORIA_WORKER_API_URL` 改写前端请求 base URL。

## 测试 health API

```powershell
curl http://127.0.0.1:8787/health
```

预期返回：

```json
{
  "ok": true,
  "service": "ludoria-worker",
  "phase": "phase-1"
}
```

## Wrangler

`apps/worker/wrangler.toml` 仅用于本地 Worker runnable shell。根目录 `wrangler.example.toml` 记录未来配置形状。

## 未来 Cloudflare 部署步骤

后续阶段再创建 D1、R2、Durable Objects 绑定，配置环境变量，运行 migrations，然后部署 Worker 和前端资源。

## 当前限制

现在不要部署，不创建真实 Cloudflare 资源，不修改 DNS，不创建付费资源。
