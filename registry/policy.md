# 开发者政策（审核对照表）

提交插件到本 registry 即表示同意本政策。审核按本清单逐条对照，**声明外的能力使用即拒审**。

> 为什么是"政策"而不是"沙箱"：插件运行在完整 Node 环境的子进程里，
> utilityProcess 是**稳定性边界，不是安全边界**。权限模型的定位是**行为契约**——
> 审核时的对照表 + 用户的知情告知，不是技术围栏。
> 真正的强制点只有两个：**市场入口**（不过审进不了 registry）和**官方 relay 服务端**。

---

## 1. 只使用声明过的能力

只使用 manifest 中声明的权限对应的 SDK 能力。**禁止绕过 SDK 直接访问文件系统 / 网络 / 子进程。**

审核 grep 红线（命中即人工复核，无正当理由则拒）：

- `require('fs')`、`require('child_process')`、`require('net')`、`require('http')`／`https`
- 动态 `require(变量)`
- `eval()`、`new Function()`

## 2. 禁止下载执行代码

禁止任何形式的自更新或运行期拉取代码执行。更新只能走 registry 版本发布。

## 3. 数据最小化

- 禁止采集与插件功能无关的数据。
- 联网域名必须逐一以 `net:<hostname>` 声明，并在 README 说明用途。

## 4. secrets 必须走 `pet.secrets`

凭据、token 一律走 `pet.secrets`（加密仓），**禁止明文落盘**。

## 5. 构建可复现

release 必须由公开 repo 的 CI 构建，zip 内容与 repo 源码一致（审核会抽查 diff）。

## 6. 违规处置

下架 + 进 `blocklist.json`（宿主侧立即禁用）；恶意行为公示。

---

## 审核流程

1. 开发者向本仓库提 PR，在 `registry/plugins.json` 增加条目。
2. CI 自动检查：manifest 合法性、权限与 registry 登记比对、红线 grep、zip hash 复算。
3. 人工过一遍本政策清单。
4. merge 即上架。

## 关于旁加载

用户可在桌宠"开发者模式"下从本地目录旁加载插件。**旁加载不经任何审核**，
宿主会向用户展示最坏情况警告。这条路径供开发者调试自己的插件使用；
分发给他人请走 registry。
