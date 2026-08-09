# Registry 数据格式

宿主按本文件读取 `plugins.json` 与 `blocklist.json`。**改这两个文件的结构等于改契约**，
必须同步宿主端解析代码与 `demo/tests/` 下的相关测试。

拉取地址（宿主端两源，主源失败自动兜底）：

- 主源 `https://raw.githubusercontent.com/ShunyuYao/pet-plugin-registry/main/registry/<file>`
- 兜底 `https://cdn.jsdelivr.net/gh/ShunyuYao/pet-plugin-registry@main/registry/<file>`

---

## plugins.json

```json
{
  "schemaVersion": 1,
  "updatedAt": "2026-08-09",
  "plugins": [
    {
      "id": "pomodoro-plus",
      "name": "番茄钟增强",
      "author": "github:someone",
      "repo": "someone/pet-pomodoro-plus",
      "version": "1.2.0",
      "minHostVersion": "0.12.0",
      "apiVersion": 1,
      "download": "https://github.com/someone/pet-pomodoro-plus/releases/download/1.2.0/plugin.zip",
      "sha256": "…",
      "permissions": ["storage", "pet", "scheduler"],
      "meshTier": null
    }
  ]
}
```

字段语义：

| 字段 | 必填 | 说明 |
|---|---|---|
| `id` | 是 | 插件唯一 id，须与 zip 内 manifest 的 id 一致 |
| `repo` | 是 | **必须公开**。release zip 必须由该 repo 的 CI 产出 |
| `version` | 是 | 与 zip 内 manifest.version 一致 |
| `minHostVersion` | 否 | 低于此宿主版本不安装 |
| `apiVersion` | 否 | SDK 契约版本；缺省按最低兼容版本处理 |
| `sha256` | 是 | zip 的校验和。**宿主先校验再解压** |
| `permissions` | 是 | 冗余登记一份 manifest 权限。**zip 内声明超出此处即拒装**（防过审后换包） |
| `meshTier` | 否 | 官方 relay 准入标记；`null` 表示不得使用官方 relay |

## blocklist.json（kill switch）

```json
{
  "schemaVersion": 1,
  "updatedAt": "2026-08-09",
  "blocked": [
    { "id": "bad-plugin", "versions": "*", "reason": "上报用户剪贴板内容" },
    { "id": "other", "versions": ">=1.0.0 <1.2.3", "reason": "越权读取文件" }
  ]
}
```

- `versions`：`*` 表示全部版本；范围语法用 semver range。
- `reason`：**会原样展示给用户**，写清楚为什么禁用。

宿主端行为约定（对应 US-PP12）：

1. 启动时与每日各拉一次；命中的已装插件立即禁用并展示 reason。
2. 拉取失败用上次缓存，**不阻断启动**。
3. **从未拉取成功时不禁用任何插件**——空 blocklist 不等于全部拉黑。
