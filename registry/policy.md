# 开发者政策（审核对照表）

提交插件到本 registry 即表示同意本政策。审核按本清单逐条对照，**声明外的能力使用即拒审**。

> 为什么是"政策"而不是"沙箱"：插件运行在完整 Node 环境的子进程里，
> utilityProcess 是**稳定性边界，不是安全边界**。权限模型的定位是**行为契约**——
> 审核时的对照表 + 用户的知情告知，不是技术围栏。
> 真正的强制点只有两个：**市场入口**（不过审进不了 registry）和**官方 relay 服务端**。

---

## 1. 只使用声明过的能力（2026-09-10 起：声明 + 披露制）

有 SDK 等价能力的一律走 `pet.*`。确需直接使用 Node 内建模块
（`fs` / `child_process` / `net` / `http` / `https` 等）的插件，必须同时满足：

1. registry 条目标记 `nodeAccess: true`（见 SCHEMA.md）；
2. README 显著披露**访问什么、为什么需要**（如"读取 `~/.claude` 下的会话状态文件以显示 agent 运行状态"）；
3. 审核时人工核对代码用途与披露一致，且确认当前 SDK 无等价能力。

**未声明、未披露而使用 Node 内建即拒审。**

用户侧后果（提交前请知悉）：标记 `nodeAccess` 的插件，安装弹窗按最坏情况措辞展示
（"该插件将获得对你电脑的完全访问权限"），且 blocklist 禁用只能停掉经 SDK 注册的资源，
对插件自行创建的文件/进程无回收能力。

**无条件硬禁（命中即拒，无裁量）**：

- 代码混淆（隐藏代码真实用途）
- 动态拼接 `require(变量)`
- `eval()`、`new Function()`

## 2. 禁止下载执行代码

禁止插件自行下载更新包或运行期拉取代码执行。更新只能走 registry 版本发布及宿主安装管线。

插件可在已安装 manifest 中显式声明 `updateReminders: true`，参与宿主的登录后新版提醒；
未声明或 false 默认关闭。宿主仅在用户逐次确认后，按 registry 登记版本、摘要和权限安装；
这不属于插件自更新，不授权任何静默安装或插件自行执行远端代码的行为。

## 3. 数据最小化

- 禁止采集与插件功能无关的数据。
- 联网域名必须逐一以 `net:<hostname>` 声明，并在 README 说明用途。

## 4. secrets 必须走 `pet.secrets`

凭据、token 一律走 `pet.secrets`（加密仓），**禁止明文落盘**。

## 5. 构建可复现

release 必须由公开 repo 的 CI 构建，zip 内容与 repo 源码一致（审核会抽查 diff）。

使用新增 SDK 时，类型、权限、最低宿主版本和实际可用上下文应同步核对，见
[SDK 同步与兼容核对](SDK.md)。宿主 SDK 更新不能仅凭宿主测试通过就认定公开开发包已同步；
交付前必须运行带真实宿主与类型包的对账，依赖缺失的 SKIP 不算通过。

## 6. 违规处置

下架 + 进 `blocklist.json`（宿主侧立即禁用）；恶意行为公示。

---

## 审核流程

1. 开发者向本仓库提 PR，在 `registry/plugins.json` 增加条目。
2. CI 自动检查：manifest 合法性、权限与 registry 登记比对、Node 内建 grep（命中且未标记
   `nodeAccess` 即拒；已标记则转人工核对披露一致性）、混淆/动态 require/eval 命中即拒、
   zip hash 复算。
3. 人工过一遍本政策清单。
4. merge 即上架。

## 关于旁加载

用户可在桌宠"开发者模式"下从本地目录旁加载插件。**旁加载不经任何审核**，
宿主会向用户展示最坏情况警告。这条路径供开发者调试自己的插件使用；
分发给他人请走 registry。


## 插件账号授权审核（新实验能力，待支持版本发布）

- 只可使用已登记的 `account:authorize:<serviceId>`，README 披露目标服务、验证身份的用途及上传的公开资料 / 成绩；不能借用别的服务授权或把 UID 当作登录凭据。
- `account.getState` / `account.authorize` 仅 tool；宿主 access / refresh token 不得暴露给插件、页面或服务后端，禁止读取宿主账号文件来绕过 SDK。
- 一次性码绑定目标服务、每次独立挑战与 S256 PKCE，禁止重用；游戏会话只保存在 tool 内存，不发到 panel、通用事件总线或日志。无需长期保存的密钥不落盘；确有持久化必要时仍遵守 secrets 政策。
- 登录变化、停用、卸载或崩溃后停止旧身份请求并丢弃迟到结果；服务端每次受保护操作验证父账号授权。只有账号服务成功确认登出才保证立即失效；离线登出或撤销请求失败时，本机立即停用、服务端最长 10 分钟的撤销延迟必须如实说明。
- 声明对应网络域名，核对真实最低宿主版本和服务端支持；此能力未发布前不能将依赖它的插件登记为对旧宿主可用。Account verification must never expose host credentials, bypass public SDK boundaries, or claim support based only on API documentation.

## 插件外观审核（新实验能力，待支持版本发布）

- `appearance` 仅授权活动 asset 插件在 tool/panel 查询外观、应用自身素材及撤销自身当前外观；不得指定其他插件素材、读取宿主配置或改变伙伴身份与记忆。
- 安装和预览不自动换装，使用需明确操作；关闭面板保留选择，停用/卸载当前素材后恢复原伙伴。A 不得撤掉后来启用的 B 外观，也不得用旧状态覆盖用户的新选择。
- 披露所需 `appearance` 与 `ui` 权限；失败明确呈现，保存失败不能宣称成功。面板持续更新使用状态，避免仅启动时查询一次。
- 核对素材来源、实际包内容、最低宿主版本与构建证据；新接口尚未发布时不得登记为旧宿主可用。

Appearance access is owner-scoped, not general host configuration access. Review explicit application, live state, error handling and cleanup. Documentation or apiVersion 1 alone does not prove released host support.


### 可选动画素材（未发布扩展）

- 动作查询/播放需披露 `pet` 权限；不得把 `playAnim` 的分发成功宣传为播放完成，也不得宣称能操控远程访客。
- 跨机仅接受标准白名单 PNG 帧和版本化动画描述；保持尺寸、帧数、字节与解码预算限制，不附带脚本、HTML、远程 URL 或本地路径。扩展接收端不支持时须在出发前呈现失败。
- Animation query/playback requires the pet permission. Dispatch acknowledgement is not playback completion. Appearance transfer contains validated PNG data and versioned metadata only, never executable plugin code; resource limits and version negotiation remain mandatory.
- 本轮无新公开插件包及宿主构建，市场条目、下载摘要及最低支持版本不变。No package is being published or listed by this documentation change.
