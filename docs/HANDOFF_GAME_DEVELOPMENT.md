English summary:
This document is the handoff guide for adding new multiplayer board games or solo puzzles to Ludoria. It explains the mandatory architecture patterns, hidden information safety rules, test requirements, and which files can and cannot be modified.

---

# Handoff: Game Development

## 入口说明

Token Bluffing Demo 和 Sudoku Lite 是架构验证 demo，不一定是最终主打游戏。新游戏开发应遵循同样的架构模式。

## 多人游戏架构

必须遵循：

```
Command -> Validate -> Event -> State -> View
```

1. 游戏规则在 `packages/game-definitions/multiplayer/`
2. 实现 `MultiplayerGameDefinition` 接口
3. `setup(sessionId)` — 初始化状态
4. `validateCommand(command, state)` — 校验命令
5. `applyCommand(command, state)` — 应用命令，返回 event + new state
6. `getPlayerView(state, playerId)` — 只返回该玩家可见信息
7. `getSpectatorView(state)` — 只返回观战可见信息

## 单人 Puzzle 架构

必须遵循：

```
Puzzle -> Progress -> Move -> Completion
```

1. 游戏规则在 `packages/game-definitions/solo/`
2. 实现 `SoloPuzzleDefinition` 接口
3. 不做网络实时同步
4. 进度写入 D1 puzzle_progress（不含 solution）

## 隐藏信息安全

- 玩家只能看到自己的 hidden tokens/手牌/身份
- 观战者看不到任何隐藏信息
- public event 不能泄露隐藏 state
- 前端不能从后端请求完整 GameState
- 前端不能从后端请求其他玩家的 hidden state

## 新增多人游戏步骤

1. 在 `packages/game-definitions/src/multiplayer/` 创建游戏文件
2. 实现 `MultiplayerGameDefinition`
3. 在 `packages/game-definitions/src/index.ts` 注册
4. 在 `packages/db/src/seed-data.ts` 添加 game_catalog 条目（可选）
5. 写测试：验证 getPlayerView/getSpectatorView 安全
6. 在 `apps/web` 创建 demo 页面
7. 在 `apps/web/src/routes.ts` 添加路由
8. 运行 `pnpm typecheck && pnpm test && pnpm build`

## 新增 Solo Puzzle 步骤

1. 在 `packages/game-definitions/src/solo/` 创建 puzzle 文件
2. 实现 `SoloPuzzleDefinition`
3. 在 `packages/game-definitions/src/index.ts` 注册
4. 写测试：验证 public puzzle 不含 solution
5. 在 `apps/worker/src/routes/solo-puzzles.ts` 添加 API
6. 在 `apps/web` 创建 puzzle 页面
7. 运行 `pnpm typecheck && pnpm test && pnpm build`

## 可以改的文件

- `packages/game-definitions/src/`
- `apps/web/src/pages/`
- `apps/web/src/components/`
- `packages/protocol/src/` （新增类型）
- 测试文件

## 不能随便改的文件

- `packages/game-engine/src/` （改接口影响所有游戏）
- `apps/worker/src/durable-objects/` （改 DO 影响所有多人游戏）
- `packages/db/src/schema.ts` （改 schema 需要 migration）

## 推荐先读的 Skills

- `game-engine-contract`
- `hidden-information-security`
- `durable-object-game-session`
- `solo-puzzle-engine`
