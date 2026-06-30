# Game Engine Contract

## MultiplayerGameDefinition

`packages/game-engine` 提供通用 `MultiplayerGameDefinition`。Phase 2 版本包含：

- `setup`
- `validateCommand`
- `applyCommand`
- `applyEvent`
- `getPlayerView`
- `getSpectatorView`
- `getReviewSummary`

具体游戏规则必须放在 `packages/game-definitions`，不能写在 React 组件或 API route handler 中。

## GameCommand

`GameCommand` 表示玩家提交的命令。Token Bluffing Demo 当前支持：

```text
DECLARE_TOKEN_COUNT
```

命令只表达玩家声明，不直接修改状态。

## GameEvent

命令通过校验后生成 event。Phase 2 的 public event 不能包含任何玩家实际隐藏 token 列表。

## GameSessionState

`GameSessionState` 是服务器权威状态，可以包含隐藏 token。完整 state 不允许发送给前端。

## PlayerView

`getPlayerView` 为单个玩家生成安全视角。玩家可以看到自己的隐藏 token，也只能看到其他玩家的 token 数量。

## SpectatorView

`getSpectatorView` 为观战者生成安全视角。观战者只能看到玩家列表、连接状态、token 数量和 public events。

## Command/Event/State/View

多人游戏必须保持：

```text
Command -> Validate -> Event -> State -> View
```

这个顺序是 Ludoria 多人游戏架构的核心护栏。

## getReviewSummary

Phase 2 只保留 placeholder summary：session id、game id、玩家数量和 public event 数量。后续真实游戏结束后再生成复盘摘要。
