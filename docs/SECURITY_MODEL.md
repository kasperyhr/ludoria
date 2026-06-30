# Security Model

## 隐藏信息安全

Token Bluffing Demo 的 full state 中包含玩家 hidden tokens，但 full state 永远不发送给前端。

## 不信任前端

前端只能提交 command。服务器必须校验玩家是否存在、命令类型是否合法、payload 是否合理。前端 UI 禁用按钮不算安全边界。

## Player view

`getPlayerView` 只把当前玩家自己的 hidden tokens 放进 `self.hiddenTokens`。其他玩家只暴露：

- `id`
- `displayName`
- `tokenCount`
- `connected`

## Spectator view

`getSpectatorView` 不包含任何 `hiddenTokens` 字段。观战者只能看到玩家列表、token 数量和 public events。

## Public event

Public event 可以包含玩家声明了什么，但不能包含玩家实际持有哪些 token。Phase 2 测试覆盖了 public event 不泄露 hidden token 字段。

## Session token

Phase 2 的 session token 用于本地重连，保存在浏览器 `sessionStorage` 中。它仍是 placeholder：没有过期、轮换、撤销和持久化策略。

## Guest user

Phase 2 没有账号系统。玩家和观战者都是临时 participant。

## 不泄露 solution

单人 puzzle 尚未进入实现阶段。Phase 3 处理 solo puzzle 时仍然不能把明文 solution 发给前端。

## 测试覆盖

隐藏信息测试位于 `packages/game-definitions/test/token-bluffing-demo.test.mjs`，覆盖：

- 玩家只能看到自己的 hidden token。
- 玩家看不到其他玩家 hidden token 种类。
- 观战者看不到任何 hidden token 种类。
- public event 不泄露 hidden token 字段。
- 非法 command 会被 reject。
