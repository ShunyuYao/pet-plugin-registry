# pet-plugin-registry

桌宠（吐梨邦）插件市场的登记表仓库。宿主从这里拉插件清单与黑名单——零服务器成本，
照 Obsidian 的做法。

```
registry/
  plugins.json     插件登记表
  blocklist.json   黑名单（kill switch）
  policy.md        开发者政策 / 审核对照表
  SCHEMA.md        两份 JSON 的字段语义（改结构 = 改契约）
  SDK.md           SDK 同步、权限与最低宿主版本核对
```

## 提交插件

1. 读 [`registry/policy.md`](registry/policy.md)。
2. 把插件开源到一个**公开** repo，用 CI 产出 release zip。
3. 提 PR，在 `registry/plugins.json` 里加一条（字段见 [`SCHEMA.md`](registry/SCHEMA.md)），
   `sha256` 填 release zip 的校验和。
4. CI 自动检查 + 人工过政策清单，merge 即上架。

## 宿主拉取地址

- 主源 `https://raw.githubusercontent.com/ShunyuYao/pet-plugin-registry/main/registry/<file>`
- 兜底 `https://cdn.jsdelivr.net/gh/ShunyuYao/pet-plugin-registry@main/registry/<file>`

## 状态

已有插件登记条目；当前清单以 [`plugins.json`](registry/plugins.json) 为准。
SDK `apiVersion: 1` 包含已冻结与实验能力，完整定义见
[pet-plugin-types](https://github.com/ShunyuYao/pet-plugin-types)。
SDK 变更交付必须完成[同步与兼容核对](registry/SDK.md)，不能把外部类型对账的 SKIP 当作通过。
