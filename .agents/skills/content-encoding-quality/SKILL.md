---
name: content-encoding-quality
description: 当任务涉及中文文档、README、AGENTS、repo-scoped skills、Markdown 生成、文件编码或出现问号乱码时触发。
---

# 内容编码与中文文档质量

## 什么时候触发

当任务涉及中文文档、README、AGENTS、repo-scoped skills、Markdown 生成、文件编码，或用户发现连续问号、乱码、替换字符时触发。

## 开发规则

- 所有中文文档必须以 UTF-8 正确保存。
- 写入中文文件后必须抽样读取确认中文没有变成问号、乱码或替换字符。
- Markdown 中的代码、命令、API、路径和包名保持英文，解释性内容使用中文。
- 如果用脚本批量生成文档，必须避免 PowerShell 默认编码或控制台编码污染。
- 对 README、AGENTS、docs 和 `.agents/skills` 的修改，应把内容可读性视为质量门槛。

## 禁止事项

- 禁止提交含有连续问号代替中文的文档。
- 禁止在没有确认编码的情况下继续新增大量中文 Markdown。
- 禁止把编码问题解释成正常占位符。
- 禁止只修 README 而忽略 AGENTS、docs 和 repo-scoped skills 中的同类损坏。

## Checklist

- 读取关键 Markdown，确认中文显示正常。
- 搜索连续问号、乱码、替换字符等可疑编码损坏痕迹。
- 检查 README、AGENTS、docs、`.agents/skills`。
- 运行 `corepack pnpm lint`。
- 如改动影响前端文案，运行 `corepack pnpm typecheck` 和 `corepack pnpm build`。
- 在总结中说明是否发现并修复编码损坏。

## 项目示例

如果 `README.md` 出现连续问号替代中文的乱码，必须恢复为正确中文，并继续检查 `AGENTS.md`、`docs/*.md` 和 `.agents/skills/*/SKILL.md`。

