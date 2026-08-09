# pet-plugin-registry

桌宠（吐梨邦）插件市场的登记表仓库。宿主从这里拉插件清单与黑名单——零服务器成本，
照 Obsidian 的做法。

```
registry/
  plugins.json     插件登记表
  blocklist.json   黑名单（kill switch）
  policy.md        开发者政策 / 审核对照表
  SCHEMA.md        两份 JSON 的字段语义（改结构 = 改契约）
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

初始化中，尚未开放提交。宿主端市场功能开发中；对外开放还需先完成 SDK 契约冻结
（见宿主仓库 `docs/plugin-open-platform-design.md` §3）。
