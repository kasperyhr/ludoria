# Multiplayer Protocol

Phase 0 只定义 WebSocket 消息草案。具体 schema validation 将在后续阶段加入。

## Client to Server

- `JOIN_SESSION`: 使用邀请码或 session id 加入。
- `RECONNECT`: 使用 session token 恢复连接。
- `SUBMIT_COMMAND`: 提交游戏命令。
- `CHAT_MESSAGE`: 发送房间聊天。
- `HEARTBEAT`: 保持连接活跃。

## Server to Client

- `SESSION_SNAPSHOT`: 初始安全视角快照。
- `PLAYER_VIEW_UPDATE`: 玩家视角更新。
- `PUBLIC_EVENT`: 可公开事件。
- `ERROR`: 协议或业务错误。
- `IDLE_CHECK`: 长时间无操作检查。
