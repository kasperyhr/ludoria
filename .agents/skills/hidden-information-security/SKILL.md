---
name: hidden-information-security
description: 当任务涉及手牌、身份、私有 token、solution、full state 或视角投影时触发。
---

# 隐藏信息安全

## 什么时候触发

当任务涉及手牌、身份、私有 token、solution、full state 或视角投影时触发。

## 开发规则

所有多人游戏必须通过 `getPlayerView` / `getSpectatorView` 输出安全视角。

## 禁止事项

禁止把完整 `GameState` 或明文 puzzle solution 发给前端。

## Checklist

- 检查 player view
- 检查 spectator view
- 添加泄露测试
- 检查日志不包含敏感信息

## 项目示例

示例：观战者只能看到公共棋盘和公开事件，不能看到任何玩家手牌。
