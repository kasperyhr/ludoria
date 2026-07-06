---
name: vibe-coding-architecture-guardrails
description: 当任务新增功能、重构或快速试验可能影响分层时触发。
---

# 架构护栏

## 什么时候触发

当任务新增功能、重构或快速试验可能影响分层时触发。

## 开发规则

所有功能必须尊重 monorepo 分层，协议、引擎、定义、UI、DB 各归其位。

## 禁止事项

禁止绕过 `packages/protocol`；禁止前端重复后端规则；禁止把所有逻辑堆在一个文件。

## Checklist

- 新代码放对包
- 共享类型在 protocol
- 游戏规则在 engine/definitions
- UI 在 ui
- 数据 schema 在 db

## 项目示例

示例：新增房间聊天时，先定义协议消息，再实现 Actor/Worker，再接 UI。
