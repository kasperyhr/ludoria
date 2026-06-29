---
name: durable-object-game-session
description: 当任务涉及多人房间、WebSocket、玩家、观战、断线重连、长考、TTL 或 idle check 时触发。
---

# GameSessionActor 设计

## 什么时候触发

当任务涉及多人房间、WebSocket、玩家、观战、断线重连、长考、TTL 或 idle check 时触发。

## 开发规则

GameSessionActor 是多人游戏的服务器权威状态机，一个房间对应一个 actor。

## 禁止事项

不要在 React 或普通 API handler 中保存权威状态；Phase 0 只写接口和 placeholder。

## Checklist

- 确认 command/event/state/view 边界
- 确认 player view 和 spectator view
- 确认重连 token 设计

## 项目示例

示例：玩家提交出牌命令后，Actor 校验并产生 event，再推送安全 view。
