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

## 飞书与超级剪贴板独立市场发布（2026-09-13）

两插件 v1.1.0 要求宿主 0.21.0+：旧宿主中同名内置插件占位，不能用 apiVersion=1 推断可安装。宿主正式安装包另行发布；本登记不表示旧客户端已经支持它们。

飞书使用单独授权的 `host:feishu` 迁移兼容能力，仍然是外部、可卸载插件，不因官方登记自动取得权限。该能力是对既有 C 档接口的有限兼容开放，不进入通用 `pet-plugin-types` 根 SDK：仅工具进程、id=feishu、manifest 声明且用户同意时提供。只可访问 config.feishu、飞书登录进度/状态、白名单 host 导出和旧 feishu-token.json 的加密迁移；auth-window、secrets、pet 和各 net 域仍需独立授权。OAuth 窗只允许声明并授予的 open.feishu.cn、accounts.feishu.cn、passport.feishu.cn HTTPS 导航；异常退出与卸载强制销毁所属窗口。不能据此为任意市场插件开放 host/auth 或其他宿主配置。

超级剪贴板使用现有公共 clipboard/ui/errands/storage API，安装前如实说明持续剪贴板采集；卸载停止采集。两插件 `nodeAccess: false`，运行代码无直接 Node 系统访问。源码公开供审核，当前各仓库未授予独立开源再分发许可；第三方字体按其 OFL 单独保留授权。

发布资产由各自公开 GitHub Actions 生成，登记前下载复算 SHA-256，并与本地验收包逐字节比对。宿主真实市场安装路径、授权拒绝/同意、面板/Provider、新进程持久化和卸载已用隐藏隔离实例验证；真实飞书账号授权仍需人工验收。


## 插件账号授权增量（experimental，尚未发布）

新增 `account.getState` / `account.authorize`，tool 与增强 HTML work 可用，前提是目标宿主与账号服务均支持，并登记了对应 serviceId。权限为 `account:authorize:<serviceId>`；同一 apiVersion 1 不代表旧宿主已有此能力。当前最低已发布支持版本尚未确定，不能据文档更新提高兼容承诺。

三仓同步：类型包提供状态 / 一次性码类型、权限及编译断言；脚手架更新矩阵但不自动申请新权限；本仓增加审核规则。这次没有游戏插件发布包，不改 plugins.json 的版本、下载和摘要。All three public repositories must be checked for each SDK change, with an explicit reason for every unchanged surface. Public synchronization is not evidence of a released host or deployed account service.

## 插件外观 / Plugin appearance（experimental，0.23.0 测试构建）

`pet.appearance.getState()`、`apply()`、`reset()` 仅 tool/panel 可用，要求已激活的 asset 插件声明并获准 `appearance` 权限；面板另需 `ui` 权限和 panel 入口。基础模板不自动申请这些权限。

返回 `companion: {key,name}`、`current: {key,name,isDefault,ownedByCaller}`、`own: {key,name}`、`canRestore`。查询不修改状态；面板打开期间刷新状态并丢弃迟到响应。`apply()` 只使用本插件注册的素材，保留当前伙伴身份、名字、人设与记忆，重启保留选择。`reset()` 只在本插件外观仍生效时恢复原伙伴外观；用户已换为 B 插件时 A 的 reset 不改变 B，也不恢复之前的其他插件外观。

All three methods take no arguments and return `Promise<AppearanceState>`. They expose no host configuration, memory, credentials or disk paths. Successful apply/reset acknowledges a persisted selection; the renderer paints asynchronously. A failed write rejects with `persistence_failed` and restores the in-memory selection. Installation and local preview must not silently apply a skin. Closing a panel preserves the selection; removing or disabling the active asset restores the companion's original appearance.

Errors in `Error.message`: `permission_denied`, `unsupported_context`, `appearance_unavailable`, `plugin_inactive`, `invalid_request`, `method_not_found`, `persistence_failed`. Only the owning active asset can change its appearance; dashboard blocks have no appearance API. Handle errors visibly and offer retry.

新增接口已经过 macOS arm64 宿主 0.23.0 本地兼容测试安装包验证，依赖它的刀盾插件声明 `minHostVersion: "0.23.0"`。0.22.0 安装包不含此能力；`apiVersion: 1` 不能代表旧宿主已支持，先探测 `pet.appearance?.getState`，缺失时提示需支持该功能的测试版本。Host 0.23.0 has been validated as a local macOS arm64 compatibility build. This is not a public host release or an npm release; host distribution remains invitation-only. Feature-detect the appearance API on older hosts.


类型包对账包含新增三方法；脚手架基础模板仍仅使用冻结能力。类型与说明随各自 Git 主分支提供，本轮没有 npm 发布。刀盾插件使用公开仓库 CI 构建的独立发布包，版本、权限、最低宿主版本和下载摘要以 plugins.json 的条目为准。


## 动作查询与可选素材 / Animation metadata (experimental, 0.23.0 test build)

新增 `pet.pet.getAnimations(): Promise<PetAnimation[]>`，tool / panel / block 均可用，需要声明并获得 `pet` 权限。无参数，查询当前实际外观；每项只有 `state`、`frameCount`、`fps`、`loop`、`standard`，对应首个素材变体，不包含路径。未加载的外观返回空数组。已在 0.23.0 本地兼容测试安装包验证；旧宿主须先探测 `pet.pet.getAnimations`，不能据 apiVersion 1 推断支持。

The query returns the current appearance's available clips, including locally registered custom keys. It takes no arguments, requires an active plugin with the `pet` permission, and is available in tool, panel and block contexts. It exposes first-variant metadata only, with no filesystem paths. Errors include `permission_denied`, `plugin_inactive`, `unsupported_context` and `invalid_request`. The local host 0.23.0 compatibility package has been validated; this does not announce a public host or npm release. Feature-detect the method on older hosts.

继续通过已有 `pet.pet.playAnim(state)` 播放，不为各动作新增方法。其布尔返回值仅确认已向宠物窗口分发，不能代表播放完成。单次素材自然结束回待机，循环素材持续到下一动作或真实交互。既有唤醒优先级保持：wake 不打断走路/送文件等行为。缺失标准动作默认回 idle；send 优先回 walk，edgehide 优先回 sleep；未注册的未知键不播放。动画调用只控制本机伙伴；不是远程操控访客的接口。

`playAnim` keeps its existing boolean dispatch acknowledgement, not a completion promise. Non-looping clips return to idle; looping clips continue until superseded by another animation or interaction. Existing wake priority remains. Missing standard states resolve to idle, except send prefers walk and edgehide prefers sleep; unknown unregistered names do nothing. Playback addresses the local companion, not a remote visitor.

14 个标准键：`idle walk sleep wake speak send drag unread edgehide peek unpeek greet dropempty dropfull`。跨机包要求 idle/walk，其余选配；扩展描述 v2 显式声明 loop，只传严格验证的静态 PNG 与描述，不能携带代码。旧 v1 双动作包继续兼容。接收端不支持扩展描述时，出发前明确失败；不会悄悄删掉动作。局域网无需登录或好友验证，串门期间外观不变。

Cross-machine appearance v2 permits the fourteen listed states with explicit loop flags; idle and walk are required. Legacy v1 two-state packages remain supported. Unsupported receivers fail preparation before departure. Only validated static PNG frames and animation metadata are transferred, never plugin code. Other visitor action slots can be decoded without a new automatic behavior: actual visitor triggers follow its existing arrival, speaking, dragging, delivery and edge lifecycle.

公网验证使用独立测试中转；生产中转尚未部署此扩展。市场上架不表示生产公网串门已可用。Internet validation used a dedicated test relay; deployment to the production relay remains pending.

查询沿用现有 SDK 桥参数归一化：JavaScript 多传的参数会被零参数方法忽略，TypeScript 签名在编译时拒绝它们；原始主进程协议载荷若带参数则拒绝 invalid_request。The existing JavaScript bridge normalizes this method to zero arguments (extra caller arguments are ignored); TypeScript rejects extra arguments at compile time. A malformed raw host protocol request with arguments is rejected with invalid_request.


## Arrival audio v3 / 入场配音 v3

宿主 0.24.0 增加可选 character.json `arrivalAudio: {"file":"arrival.wav","repeats":2,"gapMs":180}`。仅普通站定入场，声音播放结束后进入 greet，拖动/召回终止；探头不播。file 仅根目录英文文件名 WAV，单声道 PCM16 16kHz、单次最多 2 秒、1–2 次、间隔 0–500ms。数据随外观 v3 描述传输并参与 SHA256 和资源上限，不能携带代码或外部音频 URL。两端均需支持 v3，否则出发前明确失败。接收方无需安装发起方插件。未增加 SDK 方法或权限。

Host 0.24.0 adds optional arrivalAudio metadata. Normal arrival plays the bounded PCM voice before greet; drag and recall cancel it, edge peek does not play it. Both peers must support appearance v3. Inline audio participates in the content hash and the existing descriptor/aggregate limits; no executable code or remote audio URL is accepted. Existing v1/v2 packs remain compatible. No SDK method or permission was added. Host distribution remains invitation-only.

## 聊天主题包 v1 / Chat themes (experimental, unreleased)

本节描述开发分支的格式，最低已发布宿主版本尚未确定，不能据类型或文档更新宣称既有宿主支持。主题包由用户在设置中选择，安装不会自动应用，不读取聊天内容，不运行主题脚本，不增加 tool/panel/block 方法。

This data-only format is experimental and unreleased. No released host compatibility is claimed. Installing registers a choice; the user selects it in host settings. Themes cannot read chat content or execute code, and add no SDK methods. Raw ui.injectStyle remains closed.

manifest 使用 kind: ['theme']、permissions: ['ui:theme']，entry 仅有 theme 字段，值为包内相对路径（推荐 theme.json）。不接受其他入口、services、provides 或 activation。

Only the theme kind and ui:theme permission are accepted; entry contains only a relative theme path. Service, activation and executable entry declarations are rejected.

主题 JSON 精确包含 schemaVersion: 1、target: 'chat'、colors、radius、bubbleRadius、texture 六个字段，最多 16 KiB。colors 必须提供 canvas、panel、ink、muted、surface、card、line、accent、accentInk、tint、success、error、errorSurface、file、fileInk，每值为 #RRGGBB。两个圆角为 0–28 整数，texture 为 plain / paper / grid。未知字段、脚本、任意 CSS、URL、越界路径均拒绝。

JSON has exactly six fields and fifteen #RRGGBB color slots, integer radii 0–28, and a plain/paper/grid texture preset. The host enforces the 16 KiB limit, exact values and path containment. TypeScript checks do not replace runtime validation.

切换保留草稿和会话，重启恢复有效选择；卸载、停用或失效恢复默认并解释原因，重新安装不自动选中。保存失败保留现有选择，包更新失败保留之前可用版本。

Switching preserves drafts and conversation state. Valid choices survive restart. Removal, disabling or invalidation restores the default with a reason; reinstalling does not automatically select the package. Failed selection writes keep the current choice; failed updates retain the previous working version.


## 实时形象 / Realtime appearance（experimental，M1b / M2 候选，未发布）

新增专用渲染插件种类 `appearance-renderer`，只允许该单一 kind、`appearance:render` 权限及 `entry.renderer:{src,apiVersion:1,dataVersions:[1]}` 入口。src 必须是包内 HTML；不可混用 tool/panel/service 入口或通用权限。渲染桥版本与 renderer 数据格式版本分开。dataVersions 是 1–64 项不重复的正安全整数，由 renderer 定义；示例 [1] 不是对所有 renderer 数据版本的限制。

个人 asset 包保留普通动作，在 character.json 中声明 `realtime:{renderer:<已安装提供者ID>,dataVersion:1,data:<包内JSON路径>,assets:<逻辑名到包内路径映射>}`。路径相对于 character.json，不能携带远端代码、URL 或宿主路径。公共 renderer 包与照片等个人资源包分开；宿主授予当前会话的不可变数据和资源 URL，不暴露个人插件目录。

专用 render 上下文只有 `pet.render.onControl(listener):()=>void`、`submitFrame(frame):void`、`fail(code):void`，均为 experimental。普通 tool/panel/block 不获得这些方法。帧仅 seq/width/height/pixels/x/y/phase，phase 是 active/idle；宿主认证 session 和目标，始终一帧在途。首个有效 idle 帧在宿主离屏准备画布绘制后 ACK，表示准备完成，不覆盖当前普通姿态；活动阶段 ACK 在可见画布提交后发出。`appearance.getState().own.realtime` 可选状态为 ready/missing-renderer/unsupported/unavailable；旧宿主需探测可选字段，缺兼容 renderer 或运行失败时本机继续普通动作。

The renderer is installed code; personal appearance resources are data. The sandbox receives no general SDK, arbitrary target selector, host credentials, or asset-directory access. Preparation acknowledges drawing to the host preparation canvas without replacing the ordinary pose; active rendering is acknowledged after visible-canvas submission. Appearance selection still belongs to the asset owner's existing appearance permission; character:read does not grant rendering authority. Session cleanup applies to refresh, switch, disable/remove, owner closure, departure, display change, error and timeout. Closing a settings panel does not end the session.

M1b 只创建 host；尚未发布的 M2 候选支持 `init.instance.kind:'visitor'`，沿用既有三个方法和权限。来访数据使用现有认证通道，按出发时快照传递，不跟随发送端之后的换装；v1–v3 普通动作描述保持不变。接收端仅运行本地已安装、已授权且数据版本兼容的 provider，每位访客独立会话；不传送、安装或执行远端插件代码，不跨机传送连续 RGBA 帧。召回/离开优先取消抓取和自由落体并清理会话。

缺少、未授权或不兼容 provider 时照常串门，使用普通动作并提示暂不支持布偶拖拽；损坏资源或准备失败须明确失败。可用实时访客须等待普通帧解码与首个有效 idle 帧在宿主离屏准备画布绘制后 ACK 才能出发。本节描述预期兼容契约，具体平台的验证状态见本文件末尾；兼容契约不等同公开发版。本次不修改 plugins.json，不发布 npm 或登记最低已发布宿主版本，测试宿主仍按邀请范围分发。

The unreleased M2 candidate binds visitor instances through the existing render API. An authenticated visit channel carries immutable departure data and resources; ordinary v1–v3 descriptors stay unchanged. Each visitor uses a separate session with a locally installed, authorized and data-compatible provider. Remote plugin code and continuous RGBA frames are never transferred. Recall or departure cancels local grabbing/falling and releases the session.

Missing, unauthorized or incompatible providers fall back to ordinary actions with a notice; corrupt resources or failed preparation must fail explicitly. Supported realtime visitors require ordinary-frame decoding and acknowledgement after drawing the first valid idle frame to the host preparation canvas before departure. These are candidate compatibility requirements, not a public release declaration; see the dated validation status below. No marketplace entry, npm release, minimum released host version or public host download is established. Host distribution remains invitation-only.

### 私有候选验证 / Private candidate validation

2026-09-22 验证状态：私有 macOS arm64 候选的真实签名 ASAR 完成 168 项隐藏端到端检查；两个独立 Mac 经虚拟局域网完成 153 项检查，覆盖双向来访、轻放/抛出、召回、重启和缺 provider 回退。不是物理 Wi-Fi 广播、Windows、原生焦点/穿透或公开发布的证明。未新增能力或最低已发布宿主版本；个人素材不随这些公开仓库分发。

Validation status (2026-09-22): a private macOS arm64 signed-ASAR candidate passed 168 hidden E2E checks; two separate Macs passed 153 checks over a virtual LAN, including both visit directions, placement/throwing, recall, restart and missing-provider fallback. This does not establish physical Wi-Fi broadcast, Windows, native focus/passthrough or a public release. No API or minimum released host version is added, and personal assets are not distributed by these public repositories.


## 独立布偶提供者 / Independent ragdoll provider

`pet-ragdoll-renderer` 使用现有实验 `PetRender` 三方法和声明式资源接口；它定义的 `dataVersion: 2` 将衣服贴图、轮廓及头像都放在角色包，公共 provider 不含形象素材。这是 provider 私有数据版本的变化，不是宿主桥 API 升级。兼容基线为受邀 macOS arm64 候选 `0.26.0-ragdoll.1`，旧 `0.26.0` 不支持。宿主仍仅受邀分发，不因插件公开而公开宿主。

The independent provider uses the existing experimental three-method render bridge. Provider-owned appearance data v2 moves clothing textures, contours and portraits into the owning appearance package; it does not add a host SDK method or a scaffold permission. Compatibility is limited to the invited realtime-capable macOS arm64 candidate `0.26.0-ragdoll.1`; older `0.26.0` is unsupported. Publishing a provider does not publish host installers or an npm SDK version.

## 读取实时外观 / Realtime appearance read（实验，未发布）

新增 `pet.character.getRealtime(): Promise<RealtimeSnapshot | null>`，tool / panel / block 与宿主 HTML 作品可用，复用 `character:read`。返回当前形象 `realtime` 描述的 renderer、dataVersion、data 与资源内容（base64，不含路径）；无实时描述返回 `null`。只读，不授予 `appearance:render`。尚无已发布宿主支持，插件必须先探测并回退到 `getCurrent`；不得据 apiVersion 1 或类型包版本声明最低宿主版本。

Read-only snapshot of the current appearance's realtime data. No released host supports it yet; probe and fall back. It does not grant rendering authority.


## HTML 作品多人房间 / HTML work rooms（实验，未发布）

只影响宿主 HTML 作品专用的 `pet.sessions`，插件（tool / panel / block）不可见，不新增方法、不改权限名（仍为 `sessions:connect`）。作品声明 `interaction.players` 由固定 2 放宽到 2–4：3–4 人作品的房主可以在游戏窗口控制栏「＋ 邀请」再邀请局域网设备加入同一房间（每位客人独立配对、同意与授权，房主一次只能有一张未应答邀请）。增量：`getContext()` 对 3–4 人作品增加 `maxPlayers`，房主另有 `peers`；`send` / `transfer` 可选 `to`（客人 id 或 `'*'`，房主有多位客人时必填，客人不得使用）；房主收到的事件带 `from`，新增 `peer_joined` / `peer_left`。2 人作品的行为与返回值不变。旧宿主只接受 `players: 2`，会拒绝声明 3–4 人的整份作品，作品作者应保留 2 人版本给旧宿主。尚无已发布宿主支持。

HTML-work-only `pet.sessions` now accepts `interaction.players` 2–4. Hosts of 3–4 player works invite more LAN guests from the work window's control bar, each with its own pairing, consent and grant. Additions: `maxPlayers` (and host-only `peers`) in `getContext()`, optional `to` on `send`/`transfer`, `from` on host events, `peer_joined`/`peer_left`. Two-player works are unchanged. Older hosts reject any declaration other than `players: 2`, so keep a two-player build for them. No released host supports rooms yet.


## 通用手柄输入 / Action input（experimental，未发布）

2026-09-29 候选新增 `input` 10 个 B 档方法。`input.d.ts` 声明输入数据和方法，`work.d.ts` 补齐 HTML 作品独立根；普通 plugin 根没有 work 的输入捕获或联机会话权限。`apiVersion: 1`、源码包版本和手柄协议 1 均不证明旧宿主支持；本轮没有 npm 发布、最低已发布宿主版本或硬件兼容承诺。

The September 29 candidate adds ten experimental input methods and a separate HTML-work type root. This is unreleased source, not a published npm package or a minimum supported host release. Input protocol 1, package version and host apiVersion are independent; none proves hardware compatibility.

| Context | Input methods | Permission |
| --- | --- | --- |
| tool | registerProvider, getConfig, updateConfig, unregisterProvider | input:provide |
| panel | getConfig, updateConfig | input:provide; panel entry also needs ui |
| work | connect, read, setContext, onStatus, openSettings, disconnect | service:gamepad-input |
| block / render | None | No input authority |

提供方必须包含 tool 入口，身份由宿主绑定；panel 只改自己提供方的配置，关面板不会停输入。第一次已授权登记选择提供方，后来的插件不能抢占。默认值不覆盖旧偏好；updateConfig 用 expectedRevision 原子比较写入，写失败不广播，逐游戏 target 只接受宿主登记的 gameKey。全局绑定限通用 ui.*，自定义动作在逐游戏层配置；实际合并后的映射也校验类型和冲突。

A provider must have a tool entry. Identity and selection belong to the host, and panels configure only their own provider. Registration preserves preferences. Configuration changes use atomic revision/CAS updates; failure keeps the old active configuration. Game targets are host-issued identities; global bindings use only common ui.* actions, while custom actions are configured per game. Closing a panel does not stop its provider.

高频采样与 read 留在游戏的隔离 preload 中，不逐帧调用提供方/主进程。游戏声明动作并保留键鼠路径；失焦、断连、撤权或提供方失败会中和，resetRevision 变化时须取消旧持续动作并推进 press/release 消费基线。强制中和不伪造物理 releaseCount，避免蓄力误发招。重新启用先等待回中；gameplay 中的新配置到菜单/暂停才整体生效，onStatus 报 pendingRevision。提示取 presentation 的有限文本/glyph，不能假定按钮数组下标或具体品牌。

Sampling and synchronous read remain inside the work preload. Games retain keyboard/mouse paths and consume monotonic edges once. Focus loss, disconnection, revocation and provider failure cancel held actions without synthesizing a physical release. On resetRevision changes, cancel gameplay and advance consumption baselines. Restoration requires neutral controls; configuration changes wait for a menu/pause boundary and report pendingRevision. Use presentation labels/glyphs for prompts.

HTML 沿用 v1/v2 的 service:gamepad-input 权限，并探测 pet.input 后回退键鼠。该服务名是宿主保留名；不得通过 services.provide/get/invoke 冒用，通用 provide 仍为 C 档未公开。work 没有通用 events/get 服务代理。work.sessions 类型反映已有 2–4 人实际契约，不能由此推断旧宿主支持 3–4 人声明。

HTML keeps the existing named-service permission and feature-detects pet.input. gamepad-input is reserved and cannot be impersonated or accessed through generic service discovery/invocation. Generic services.provide remains closed. Work receives no generic plugin events or service proxies; its session types reflect the current 2–4 player contract, not compatibility with older hosts.

首轮真机目标是 macOS + PS5 DualSense；Xbox、PS4/PS5 是计划支持范围，USB/蓝牙、原生焦点和具体型号仍需单独记录证据。纯 Node/类型/示例编译不证明设备兼容。当前数据格式只接受浏览器 standard mapping；auto 无可靠型号信息时显示通用标签，手动 Xbox/PlayStation 标签也不改变物理映射。没有震动、陀螺仪、自适应扳机或同机多人契约。

The first hardware target is macOS with PS5 DualSense. Planned Xbox/PS4/PS5 coverage still requires model, OS and USB/Bluetooth evidence. Unit/type/example compilation is not hardware validation. This candidate accepts standard Gamepad mappings only; label preferences do not change physical mappings. Haptics, gyro, adaptive triggers and local multiplayer are outside this contract.


## HTML account authorization / HTML 账号授权（未发布候选）

The account capability is now available in the enhanced HTML `work` context as well as plugin `tool`; panel/block remain unsupported. This is a context extension of the existing experimental methods, not a new authentication protocol. No published host/package compatibility is claimed.

增强 HTML 可声明 `account:authorize:cat-leaderboard`（或另一个已登记服务），再由用户通过可信宿主授权界面批准。调用 `pet.account.getState({serviceId})` 读取 `{signedIn,uid,revision}`；`pet.account.authorize({serviceId,challengeId,codeChallenge})` 返回一次性 `{code,expiresIn,revision}`。`PetAccount` 是两种上下文共用的账号能力类型，`PetWork.account` 显式复用它，不继承其他 tool 能力。权限声明不等于授权；授权仅对应指定服务，不能继承别的作品、插件或账号权限。

UID identifies an account; it is not proof of ownership. The registered service backend exchanges the short-lived code with PKCE and revalidates the parent session. Host access/refresh tokens never enter an HTML work or service backend. Closing/revoking a work or switching accounts cancels pending authorization.

HTML 只在用户主动启用相关功能时调用 `capabilities.request({})`。新增网络许可会重载页面，须在游戏开局或编辑草稿之前完成；拒绝或能力不支持时保留本地功能，不能伪造登录或降级创建匿名参榜身份。账号查询本身不会弹出授权，也不会提供登录凭据。

| Method | tool | panel | block | work | Permission |
|---|---|---|---|---|---|
| account.getState | experimental | — | — | experimental | account:authorize:<serviceId> |
| account.authorize | experimental | — | — | experimental | account:authorize:<serviceId> |

No new method is added: method counts and apiVersion remain unchanged. Base scaffold permissions are unchanged. Host and account service support must be detected at runtime; this documentation does not establish a minimum released host version.

旧宿主若尚不识别 `account:authorize:<serviceId>`，会在读取声明时拒绝整份 HTML，运行时方法探测无法补救；需要兼容它们时保留无账号权限声明的作品版本。纯手柄示例沿用旧命名服务权限的兼容路径不受此影响。

Older hosts that do not recognize the account permission reject the HTML declaration before scripts run; feature detection alone cannot provide fallback. Retain a build without account permissions when supporting those hosts. The controller-only example's existing named-service permission path is unchanged.



### 本机 HTML 授权记忆 / Local HTML grant memory（未发布候选）

本机预览的已批准权限可按当前账号作用域、作品字节摘要和完整声明记忆；重开相同内容无需重复批准。作品内容或声明变化、账号切换不会继承该授权，收到的作品仍按其来源单独隔离。撤权保持到用户明确重新批准；不能将相同标题、文件名或游戏自报 id 当作授权身份。此记忆只复用已批准能力，不扩大手柄、存储或账号能力权限，也不新增公开 SDK 方法。输入配置、游戏私有存储和调用者生命周期仍按各自原有作用域处理。

Approved local-preview grants may be remembered for the current account scope, exact work content hash and complete declaration. Changed content/declarations or another account do not inherit approval; received works retain source isolation. Revocation remains until explicit approval. Names and self-declared game ids are not authority. This reuses approval without expanding input, storage or account authority. It adds no public SDK method; input preferences, private storage and caller lifetimes retain their existing scopes.

这次同步不增加公开方法总数（仍为30个A档、59个B档），仅使work入口从25增至27项；手柄输入10方法、三种普通插件及render隔离保持原契约。授权记忆与账号扩展均需实际候选宿主验证，不据文档推断已发布兼容版本。

The public method count remains 30 frozen and 59 experimental; work gains the two existing account methods, increasing its exposed members from 25 to 27. Input's ten methods and ordinary-plugin/render boundaries are unchanged. These candidate semantics require host verification and do not establish a released compatibility version.
