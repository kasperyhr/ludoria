# Game Engine Contract

## MultiplayerGameDefinition

多人游戏定义放在 `packages/game-definitions`，共享接口来自 `packages/game-engine`。接口必须描述命令校验、事件应用、视角生成和复盘摘要。

## SoloPuzzleDefinition

单人 puzzle 定义描述 puzzle、progress、move 和 completion，不直接向前端暴露明文 solution。

## Command/Event/State/View

多人游戏必须遵循 `Command -> Validate -> Event -> State -> View`。Command 来自玩家，Validate 产生结果，Event 更新 State，View 是发给玩家或观战者的安全投影。

## getPlayerView

根据玩家身份生成只属于该玩家的视角，可以包含自己的手牌、私有 token 或允许查看的信息。

## getSpectatorView

生成观战视角，不能包含任何玩家私有信息。

## getReviewSummary

游戏结束后生成复盘摘要，只包含可公开或可授权查看的信息。
