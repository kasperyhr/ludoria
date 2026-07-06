---
name: testing-quality-gates
description: 当任务涉及测试、CI、类型检查、lint、build 或质量风险时触发。
---

# 测试与质量门槛

## 什么时候触发

当任务涉及测试、CI、类型检查、lint、build 或质量风险时触发。

## 开发规则

尽量运行 `corepack pnpm typecheck`、`corepack pnpm lint`、`corepack pnpm test`、`corepack pnpm build`。

## 禁止事项

不要声称未运行的命令通过；不要跳过隐藏信息和协议 schema 的关键测试。

## Checklist

- 类型通过
- lint 通过
- 测试覆盖游戏引擎、隐藏信息、协议
- build 通过或说明阻塞

## 项目示例

示例：修改 `packages/protocol` 后运行 typecheck 和相关协议测试。
