# Ludoria

Ludoria 是一个 Cloudflare-first 的 TypeScript monorepo，用于构建在线 Game Hub：多人桌游和单人益智游戏共存。

Phase 0 只建立项目骨架、placeholder source files、架构文档、Codex 项目规则和 repo-scoped skills，不实现完整业务、不部署、不创建真实 Cloudflare 资源。

## 工作区

- `apps/web`: Vite + React placeholder。
- `apps/worker`: Hono Worker placeholder。
- `packages/game-engine`: 通用游戏抽象。
- `packages/game-definitions`: 具体游戏定义入口。
- `packages/protocol`: 前后端共享协议类型。
- `packages/db`: 数据库 schema placeholder。
- `packages/ui`: 最小共享 UI 组件。
- `packages/config`: 共享配置 placeholder。

## 常用命令

当前机器上全局 `pnpm` shim 可能不可用，推荐使用 Corepack：

```powershell
corepack pnpm install
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test
corepack pnpm build
```

如果本机已经能直接运行 `pnpm`，也可以使用：

```powershell
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## 架构原则

多人游戏遵循 `Command -> Validate -> Event -> State -> View`，由服务器权威状态生成 `getPlayerView` / `getSpectatorView`。单人 puzzle 遵循 `Puzzle -> Progress -> Move -> Completion`，不能把明文 solution 发给前端。
