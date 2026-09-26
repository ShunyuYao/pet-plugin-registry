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

## 插件外观审核（实验能力，0.23.0 测试构建）

- `appearance` 仅授权活动 asset 插件在 tool/panel 查询外观、应用自身素材及撤销自身当前外观；不得指定其他插件素材、读取宿主配置或改变伙伴身份与记忆。
- 安装和预览不自动换装，使用需明确操作；关闭面板保留选择，停用/卸载当前素材后恢复原伙伴。A 不得撤掉后来启用的 B 外观，也不得用旧状态覆盖用户的新选择。
- 披露所需 `appearance` 与 `ui` 权限；失败明确呈现，保存失败不能宣称成功。面板持续更新使用状态，避免仅启动时查询一次。
- 核对素材来源、实际包内容、最低宿主版本与构建证据；新接口尚未发布时不得登记为旧宿主可用。

Appearance access is owner-scoped, not general host configuration access. Review explicit application, live state, error handling and cleanup. Documentation or apiVersion 1 alone does not prove released host support.


### 可选动画素材（0.23.0 测试构建）

- 动作查询/播放需披露 `pet` 权限；不得把 `playAnim` 的分发成功宣传为播放完成，也不得宣称能操控远程访客。
- 跨机仅接受标准白名单 PNG 帧和版本化动画描述；保持尺寸、帧数、字节与解码预算限制，不附带脚本、HTML、远程 URL 或本地路径。扩展接收端不支持时须在出发前呈现失败。
- Animation query/playback requires the pet permission. Dispatch acknowledgement is not playback completion. Appearance transfer contains validated PNG data and versioned metadata only, never executable plugin code; resource limits and version negotiation remain mandatory.
- 刀盾小狗使用公开 CI 构建发布包，市场最低宿主版本为经本地 macOS arm64 安装包验证的 0.23.0。此次登记不代表宿主公开发布或生产中转已经部署；宿主仍通过受邀测试渠道分发。The plugin release is built by public CI. Its minimum host version is 0.23.0, verified using a local macOS arm64 compatibility package; listing does not announce public host distribution or production relay deployment.


### Arrival voice assets / 入场配音素材

带配音的外观插件需声明经过实际构建验证的最低宿主版本，核对声音素材来源与授权说明。仅允许宿主 v3 支持的有界 PCM WAV，音频不得通过远端 URL 或插件代码绕过外观校验。审核说明不得包含宿主公开下载入口。

Appearance plugins with voice must declare a build-verified minimum host version and document audio provenance and rights. Only bounded PCM WAV supported by appearance v3 is permitted; remote URLs and plugin code must not bypass asset validation. Public review materials must not expose host download locations.

## 纯数据主题审核 / Data-only theme review (unreleased)

主题包只允许 theme 种类、ui:theme 权限、JSON 入口。审核实际内容，拒绝代码入口、服务声明、任意 CSS、外部资源 URL 和路径越界。核对六字段、十五项 #RRGGBB 颜色、0–28 整数圆角、plain/paper/grid 装饰及 16 KiB 上限；确保文字、文件、输入、错误与选中状态可读。

Review actual package contents: only the theme kind, ui:theme permission and JSON entry are accepted. Reject executable/service declarations, arbitrary CSS, external resource URLs and escaping paths. Check exact fields, fifteen colors, bounded radii, texture presets, the 16 KiB limit, and readability of all user states.

安装不自动应用；选择、默认恢复、草稿保留、重启、停用和卸载须有真实宿主证据。当前未发布，类型或文档变化不能证明旧宿主支持；实际宿主构建与类型/脚手架交付通过前，不登记虚构支持版本、下载包或摘要。本轮 plugins.json 不变。

Installation must not take over the current appearance. Selection, reset, draft preservation, restart and disable/removal require real host evidence. The capability is unreleased: docs alone cannot establish compatibility or justify marketplace metadata. This change does not add a registry entry or a host download link.


## 实时形象审核 / Realtime appearance review（M1b / M2 候选，未发布）

- 公共 renderer 包和个人 asset 包分开审核。前者只含公共渲染代码与模型；照片及个人参数必须留在个人包，不因授权发布 renderer 而公开个人素材。
- renderer 必须仅声明 appearance-renderer kind、appearance:render 权限，以及包内 HTML 入口与真实支持的桥/数据版本。本期桥版本 apiVersion 为 1；dataVersions 是 1–64 项不重复的正安全整数，由 renderer 定义。声明示例为 `entry.renderer:{src,apiVersion:1,dataVersions:[1]}`；不得附带 tool/panel/service 入口、申请额外通用权限、下载执行远端代码或自行选择目标宠物。
- asset 的 realtime 声明只能引用本地已安装提供者。data/assets 使用 character.json 相对路径；校验真实路径与软链接边界。data JSON 上限 64 KiB；最多 32 项资源，单项 16 MiB、总计 64 MiB，类型限 png/jpg/jpeg/webp/json/glb/bin。单张图片每边最多 8192 像素、总像素最多 16 × 1024²；资源只作为数据读取，不能用 JSON、模型依赖或纹理路径绕过代码/网络限制。
- 申请 `character:read` 的插件可经 `character.getRealtime` 读到当前形象的实时外观资源，其中可能含用户个人照片。说明中须写明用途；未经明示同意不得上传、转发或长期保存这些资源，审核时按个人数据处理。
- 渲染上下文只获得绑定会话、不可变数据及资源句柄。不得申请宿主目录、凭据、全局鼠标监听或另一主宠/访客的身份。appearance 与 character:read 均不能替代 appearance:render 授权。
- 实测首帧就绪、有界帧通道、无效帧不保活、透明命中、抓取结束后继续渲染、异常回退。准备阶段 ACK 必须在离屏准备画布绘制后发出，且不覆盖当前普通姿态；活动阶段 ACK 必须在可见画布提交后发出。刷新同 key、切换形象、禁用/卸载任一包、关闭目标、出发及显示器变化必须回收旧会话；旧帧与通知不能恢复已结束会话。面板关闭不能意外终止渲染。
- 安装不能自动换装。没有兼容 renderer 时本机使用普通动作并提供可识别状态；不可将配置 ready 或 IPC 发送成功当作显示完成。
- 核对实际类型、上下文、权限、包内容和构建证据。当前能力未发布，不登记虚构最低宿主版本、下载 URL、摘要或市场版本，不公开测试宿主下载入口。

M2 候选审核还须覆盖访客会话：来访数据只走认证通道并固定为出发时快照，接收端只使用本地已安装、已授权且数据版本兼容的 provider；不得传送、安装或执行远端插件代码，不得跨机传送连续 RGBA 帧。缺少、未授权或不兼容 provider 时必须保持普通串门并提示暂不支持布偶拖拽，不能将损坏资源或准备失败伪装成缺能力降级。可用实时访客在普通帧解码及首个有效 idle 帧在宿主离屏准备画布绘制后 ACK 后才能放行出发。检查多访客会话隔离、访客拖动许可、召回/离开抢占抓取和自由落体、失败/断线/取消后的资源清理；普通动作 v1–v3 描述和原有回程义务必须保留。上述是未发布候选的验收要求，具体平台的验证状态见本文件末尾；政策要求不等同公开发版。

Review executable renderer code separately from personal appearance data. Enforce bounded resources and session ownership; no remote code execution, arbitrary pet targeting or general SDK access is granted. For the unreleased M2 visitor candidate, require an authenticated channel, immutable departure snapshots and a locally installed, authorized, data-compatible provider. Peer plugin code and continuous RGBA frames must not be transferred. Missing, unauthorized or incompatible providers must retain ordinary visits with a notice; corrupt resources or failed preparation must fail explicitly. Require ordinary-frame decoding and acknowledgement after drawing the first valid idle frame to the host preparation canvas before departure, without replacing the ordinary pose. During active rendering, acknowledgement must follow visible-canvas submission. Require independent visitor sessions, drag permission enforcement, recall/departure preemption and cleanup after failure, disconnect or cancellation. Preserve ordinary v1–v3 descriptors and return obligations. These are review requirements, not a public release declaration; see the dated validation status below; publication and testing-stage host-distribution restrictions remain unchanged.

### 私有候选验证 / Private candidate validation

2026-09-22 验证状态：私有 macOS arm64 候选的真实签名 ASAR 完成 168 项隐藏端到端检查；两个独立 Mac 经虚拟局域网完成 153 项检查，覆盖双向来访、轻放/抛出、召回、重启和缺 provider 回退。不是物理 Wi-Fi 广播、Windows、原生焦点/穿透或公开发布的证明。未新增能力或最低已发布宿主版本；个人素材不随这些公开仓库分发。

Validation status (2026-09-22): a private macOS arm64 signed-ASAR candidate passed 168 hidden E2E checks; two separate Macs passed 153 checks over a virtual LAN, including both visit directions, placement/throwing, recall, restart and missing-provider fallback. This does not establish physical Wi-Fi broadcast, Windows, native focus/passthrough or a public release. No API or minimum released host version is added, and personal assets are not distributed by these public repositories.


### 独立布偶套件 0.2.0 / Independent provider release

`rat-doll-renderer` 0.2.0 以独立公开仓库及 CI ZIP 发布，只包含引擎、渲染和通用骨架/蒙皮算法。无照片、衣服贴图或角色轮廓；数据 v2 要求 owning asset 提供这些会话素材。头像与服装图片只接受有界 PNG（单边2048、九图槽合计8 MiPixels），轮廓每个 JSON 仍限64 KiB，允许无损uint8 Base64距离图；派生网格另有顶点/三角上限。

兼容基线是实际签名构建验证的受邀 macOS arm64 `0.26.0-ragdoll.1`，不声称旧 `0.26.0` 支持。旧版本在 renderer kind 校验处拒装；当前版本比较不严格区分预发布后缀，不能只凭版本号比较宣称兼容。此登记只发布插件，不公开宿主安装包。普通动作继续使用原有 PNG，缺少/未授权/版本不兼容 renderer 时回退；v1角色包需配套迁移至v2。

The public CI release contains algorithms and dependencies only, no character assets. Data v2 is owned by this provider and does not change the host bridge. The verified compatibility baseline is the invited signed macOS arm64 candidate `0.26.0-ragdoll.1`, not older `0.26.0`. Older hosts reject the renderer kind; numeric version comparison alone cannot prove support. Publication is limited to the plugin, with no host download locations. Ordinary PNG animations and missing-provider fallback remain available. Legacy v1 appearances require separate migration.

发布前证据：隐藏真实宿主市场管线安装/授权及双角色重启84项通过；签名候选真实跨实例来访等168项通过，零未捕获异常。本轮无Windows或物理Wi-Fi广播验收；线上发布后仍须实测正式市场下载、摘要与安装。

Pre-release evidence: 84 hidden real-host marketplace/appearance checks and 168 signed-candidate cross-instance visitor checks passed without uncaught exceptions. This does not claim Windows or physical Wi-Fi broadcast coverage. The live marketplace download, hash and install are verified separately after publication.
