# SDK 同步与兼容核对

SDK 方法、类型和市场条目有不同职责：

- 宿主 `demo/core/plugin-runtime/sdk-surface.js` 决定实际方法、上下文和稳定性等级。
- [pet-plugin-types](https://github.com/ShunyuYao/pet-plugin-types) 提供 SDK 类型、manifest 类型和可执行交付检查。
- [create-pet-plugin](https://github.com/ShunyuYao/create-pet-plugin) 提供基础模板与开发说明。
- 本 registry 保存插件版本、下载地址、摘要、权限与兼容要求；不重复维护 SDK 方法清单。

## 2026-09 同步基线

本轮按宿主 0.19.1 源码核对，`apiVersion` 仍为 1。类型包需要覆盖：

| 能力 | 上下文 | 权限与边界 |
| --- | --- | --- |
| `pet.badge.set/clear` | tool | 实验能力，复用 `pet`；点击打开面板另需 `ui` 和 panel 入口。无需增加 `badge` 权限。 |
| `pet.ui.setPanelPinned` | tool / panel | 实验能力，`ui` 权限。 |
| `pet.clipboard` | tool / panel | 实验能力，`clipboard` 权限；`startHistory/stopHistory` 仅 tool。 |
| `pet.errands.composeFile` | tool / panel | 实验能力，`errands` 权限；图片历史来源另需 `clipboard`。用户在宿主卡片选择收件人并发送。 |

本表仅说明这轮同步范围，完整能力与签名以类型包及宿主为准。
`files.revoke` 表示撤销文件授权，旧文档中的 `files.remove` 已失效。
manifest 的 `activation: 'opt-in'` 是插件启用策略，不是更新策略。
新增的 `updateReminders?: boolean`（实验）只控制主动新版提醒，默认关闭，仍需用户逐次确认安装；
宿主实现尚未发版，不能把类型包或文档更新当作线上宿主已支持的证据。

## 最低版本与上架

`apiVersion: 1` 不表示每一个历史宿主版本都有后来新增的实验能力。
徽标以 0.19.1 为支持基线：0.19.0 发布构建没有包含该能力。插件如果必须使用徽标，
应明确要求相应最低版本；若旧宿主可降级，则先探测 `pet.badge?.set` 并继续提供其他功能。
不要仅因为插件“使用过”某个可降级接口，就未经验证提高其最低版本。

SDK 文档修正本身不需要重写所有 registry 条目。实际发布插件时，仍逐一校验：

1. registry 的版本、权限、摘要与实际发布包一致。
2. `minHostVersion` 能覆盖插件真正必需的能力。
3. 新增权限已进入类型定义与审核披露；没有擅自引入自下载代码行为。

## SDK 交付门禁

先准备并固定宿主、类型包和脚手架的提交，再安装类型包开发依赖；离线测试本身不联网。
在类型包仓运行：

```sh
npm ci
PET_PLUGIN_HOST_DIR=/path/to/desktop-pet/demo npm run test:delivery
```

在脚手架仓运行：

```sh
PET_PLUGIN_HOST_DIR=/path/to/desktop-pet/demo \
PET_PLUGIN_TYPES_DIR=/path/to/pet-plugin-types npm run test:delivery
```

两项交付检查都必须实际运行，缺少所需路径直接失败。宿主旧的对账脚本在找不到类型包时可能
SKIP；这种结果不能当作 SDK 已完成同步的证据。应记录：三个仓库提交、编译正反例、方法与
上下文矩阵结果，以及相关的隔离隐藏宿主端到端结果。

发布顺序：先保证宿主实际支持，再同步类型包与文档，最后更新消费方及必要的市场条目。
仅在本地完成修改不等于 GitHub 已更新；维护者推送后应通过 GitHub API 回读核对实际文件。
