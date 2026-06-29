# Security Model

## 隐藏信息安全

隐藏手牌、身份、私有 token 和未公开状态只能保存在服务器权威状态中。

## 不信任前端

前端提交的命令必须校验。不能因为 UI 禁用了按钮就跳过服务端规则。

## session token

session token 用于重连和身份恢复，必须按最小权限设计，未来需要过期和轮换策略。

## guest user

游客用户只能获得临时身份和有限权限，不能绕过房间规则。

## spectator 权限

观战者只接收 `getSpectatorView`，不能访问玩家私有视角。

## 不泄露 solution

单人 puzzle 不把明文 solution 发给前端。需要校验时使用服务端检查、hash 或专用验证逻辑。

## 不泄露 full state

多人游戏不能发送完整 `GameState`。所有消息都必须经过 view projection。
