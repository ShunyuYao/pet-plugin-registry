# Registry 数据格式

宿主按本文件读取 `plugins.json` 与 `blocklist.json`。**改这两个文件的结构等于改契约**，
必须同步宿主端解析代码与 `demo/tests/` 下的相关测试。

SDK 新方法的同步、权限与最低版本核对见 [SDK 同步与兼容核对](SDK.md)。
本表不登记每个 SDK 方法；仅文档/类型补全不需要升级 registry schema。

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
      "nodeAccess": false,
      "meshTier": null
    }
  ]
}
```

字段语义：

| 字段 | 必填 | 说明 |
|---|---|---|
| `id` | 是 | 插件唯一 id，须与 zip 内 manifest 的 id 一致 |
| `description` | 上架必填 | 从同版本插件 manifest 同步的一句话用途，单行纯文本，1–200 个 Unicode 码点。旧宿主忽略；新宿主缺失时显示未提供简介，不影响安装兼容。 |
| `repo` | 是 | **必须公开**。release zip 必须由该 repo 的 CI 产出 |
| `version` | 是 | 与 zip 内 manifest.version 一致 |
| `minHostVersion` | 否 | 低于此宿主版本不安装 |
| `platforms` | 否 | 实验性平台／架构白名单，须与 Release ZIP manifest 完全一致。声明时为非空、不重复列表；可用值为 `darwin-arm64`、`darwin-x64`、`win32-arm64`、`win32-x64`、`win32-ia32`、`linux-arm64`、`linux-x64`、`linux-arm`。省略保留原不限平台行为。须同时声明实际验证的最低支持宿主；旧宿主忽略此字段 |
| `apiVersion` | 否 | SDK 契约版本；缺省按最低兼容版本处理 |
| `sha256` | 是 | zip 的校验和。**宿主先校验再解压** |
| `permissions` | 是 | 完整登记 manifest 权限和由 `services` 展开的 `service:<name>`。**zip 内声明超出此处即拒装**（防过审后换包）；不能只复制 permissions 数组而漏掉服务授权 |
| `nodeAccess` | 否 | 插件是否声明直接使用 Node 内建模块（policy.md 第 1 条，2026-09-10 起的声明披露制）。缺省按 `false`；`true` 时审核要求 README 披露用途，宿主安装弹窗按最坏情况措辞展示（宿主侧展示逻辑待落地，落地前旧宿主忽略该字段） |
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

## 主动更新提醒的参与权威

参与开关为本机已安装 manifest 的可选 `updateReminders: boolean`（实验）。
缺省 false；只有 true 才参与，远端 plugins.json 不得代替已安装插件开启。
现有 version/download/sha256/permissions/minHostVersion/apiVersion 字段承载候选与校验信息；
此功能不新增 registry 开关、不升级 schemaVersion。关闭参与仍保留手动市场更新。

## 简介同步 / Description synchronization

由插件作者在 manifest.json 维护 description。维护者使用仓库根目录的 `npm run sync:description -- --id ID --ref FULL_COMMIT_SHA` 从已登记的 GitHub repo 读取 manifest；核对 ID/version 和简介后，加 `--write` 更新登记表。默认仅预览差异。元数据修订可以来自与已发布版本号相同的后续源码提交，但不得包含未发布功能的宣传；不修改旧 ZIP 或其摘要。安装不依赖简介字段。

Maintain the purpose in the plugin manifest and import it from a reviewed full commit SHA in the registered repository. The command checks matching ID/version and updates only description. Same-version metadata corrections are allowed after reviewing that the copy describes the released functionality; do not replace release archives, hashes, versions or permissions. Old entries remain installable without descriptions.
