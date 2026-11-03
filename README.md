# 手机聊天镜像 · dsh-im-phone-chat

[![npm version](https://img.shields.io/npm/v/dsh-im-phone-chat.svg)](https://www.npmjs.com/package/dsh-im-phone-chat)
[![npm downloads](https://img.shields.io/npm/dm/dsh-im-phone-chat.svg)](https://www.npmjs.com/package/dsh-im-phone-chat)
[![license](https://img.shields.io/npm/l/dsh-im-phone-chat.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/FST-EchoFly/dsh-im-phone-chat.svg?style=social)](https://github.com/FST-EchoFly/dsh-im-phone-chat)

配套 [dsh-im](https://github.com/xmanrui/dsh-im)（`@xmanrui/dsh-im`）的 DSH 桌面端插件：
把手机 IM 通道（QQ / 微信 / 飞书 …）经 dsh-im 桥接进 DSH 的会话，以**只读聊天镜像**的形式显示在 DSH 界面里。

- 左侧栏入口 → 主区域聊天面板
- 手机消息 / 助手流式回复实时同步，顺序正确
- Markdown + LaTeX 公式渲染（KaTeX → MathML）
- 手机图片内联显示，点击放大、可旋转
- 多个手机会话可切换，支持加载更早历史

> 只读镜像：不写入会话，也不修改 dsh-im 安装包，dsh-im 升级/重装不影响本插件。
> 已在 DSH `0.2.1-rc.2` + dsh-im `5.0.3`（Windows 桌面端）实测可用。

## 安装

### 前置条件

1. 已安装 DSH（Web / 桌面端均可）
2. 已安装并启用 `@xmanrui/dsh-im`，且至少一个 IM 通道（如 QQ）已连接
3. 如果用命令行安装：`dsh` 命令可用；用插件管理器安装则不需要

### 方式一：npm（推荐）

```bash
# <profile>：桌面端一般是 desktop，Web 端一般是 web
dsh plugin --profile <profile> add dsh-im-phone-chat
```

安装后刷新一次页面（桌面端 `Ctrl+R` / `F5`），左侧栏底部、设置按钮上方出现「聊天气泡」图标。

### 方式二：插件管理器（本地目录）

1. 克隆或下载本仓库到本地任意目录（目录之后不要删/移动，插件以本地链接方式安装）：

   ```bash
   git clone https://github.com/FST-EchoFly/dsh-im-phone-chat.git
   ```

2. 打开 DSH：**设置 → 插件 → 安装本地插件**，选择克隆下来的目录（包名 `dsh-im-phone-chat`）
3. 启用「手机聊天镜像」插件
4. **刷新一次页面**（桌面端按 `Ctrl+R` / `F5`）
5. 左侧栏底部、设置按钮上方出现「聊天气泡」图标，点击即可打开面板

### 方式三：命令行（本地 link）

```bash
git clone https://github.com/FST-EchoFly/dsh-im-phone-chat.git

# <profile> 换成你正在使用的 profile：桌面端一般是 desktop，Web 端一般是 web
# <克隆目录> 换成克隆出来的绝对路径，例如 D:\tools\dsh-im-phone-chat
dsh plugin --profile <profile> add link:<克隆目录>
```

### 更新

- npm 安装：重新执行安装命令拉取最新版（或在插件管理器里更新）：
  ```bash
  dsh plugin --profile <profile> add dsh-im-phone-chat
  ```
- 本地 link 安装：进入克隆目录 `git pull`，再重启 DSH 或刷新页面。

### 卸载

- 插件管理器里停用/移除「手机聊天镜像」；或
- 命令行：`dsh plugin --profile <profile> remove dsh-im-phone-chat`

> 以 `link:` 方式安装的包指向克隆目录，卸载插件不会删除源码目录。

## 使用

1. 从手机给已连接的 IM 机器人发一条消息
2. 打开左侧「手机聊天」面板：顶部会列出发现的手机会话（如 `QQ · 问候`、`QQ · 你好`，带日期便于区分），默认选中最新的手机通道会话
3. 面板会实时显示你的消息与助手回复；助手回复中的 Markdown / LaTeX 公式会自动排版，手机图片会内联显示，点击图片可放大并旋转
4. 想看更早的消息，点顶部「加载更早消息」
5. 需要继续对话：点「在会话中打开」跳到真实会话，或直接在手机上回复

## 配置

一般情况下无需配置：插件会通过 dsh-im 的管理 RPC（`connection.status` 返回的 `bot.workspace`）自动发现手机通道工作区，并结合「标题带 IM 通道前缀」的会话兜底。

只有在以下情况才需要改：

- dsh-im 的管理 RPC 不可用，且手机机器人的工作区**不是**默认路径
- 这种情况下，修改 `src/plugin.js` 顶部的 `FALLBACK_WORKSPACES` 数组（填你的工作区绝对路径），然后重新构建（见下）

## 开发

仓库里已提交构建好的 `client.js`，普通使用无需构建；只有改源码时才需要：

```bash
# 安装构建依赖（esbuild / katex / markdown-it）
pnpm install

# 重新构建 client.js
pnpm run build
```

- 源码：`src/plugin.js`
- 构建：`build.mjs`（esbuild 打包后包一层 DSH 的 `window.__ModuleLoader__` 注册格式）
- 包结构说明：见下方「结构」

## 结构

| 文件 | 作用 |
|---|---|
| `package.json` | bundle 与 `dsh.client` 声明（`platform: web`、`immediately: true`） |
| `cordis.patch.yml` | 向 DSH 宿主插入插件行 |
| `index.js` | 宿主侧空实现（本插件是纯客户端 UI） |
| `src/plugin.js` | 客户端插件源码：UI、事件折叠、Markdown / KaTeX 渲染、图片预览 |
| `client.js` | 构建产物：`window.__ModuleLoader__` 客户端 bundle（内置 KaTeX、markdown-it） |
| `build.mjs` / `wrap.mjs` | esbuild 构建脚本；`wrap.mjs` 是在受限环境里先手动跑 esbuild 再包装的兜底脚本 |
| `locale/zh.json` / `locale/en.json` | 插件管理器展示用的标题/描述 |
| `icon.svg` | 插件图标 |
| `LICENSE` | MIT |
| `THIRD_PARTY_NOTICES.md` | 内置第三方库（KaTeX、markdown-it）的 MIT 声明 |

## 原理（简述）

- 面板注册到 DSH 的 `main` 全局面板槽位，图标注册到 `sidebar.panellist`，两者使用同一个 id，点击图标即切换到该面板
- 会话数据走 DSH 客户端公开接口：`ctx.sessions.retain()` 拿到会话绑定，订阅 `binding.eventSource` 的连续事件窗口（用户消息、助手流式 chunk、结算消息）
- 按事件顺序折叠气泡：用户消息把上一条助手气泡收尾，助手回复出现在其真实位置；流式文本结算后替换为正式消息
- 公式：消息文本中的 Markdown 与 `$...$` / `$$...$$` 用 KaTeX 渲染成 MathML（Chromium 原生渲染，无需字体文件）；流式中的半成品按纯文本显示，结束后排版
- 图片：`session.readAttachment()` 取原图字节 → Blob URL 渲染，滚动到附近才懒加载，卸载释放

## 与同类插件的区别

截至 2026-11，在 GitHub 与 npm 的 DSH 插件生态里没有找到功能完全相同的实现。下面是最接近的几类，以及本插件的差异：

| 插件 | 做什么 | 与本插件的差异 |
|---|---|---|
| [xmanrui/dsh-im](https://github.com/xmanrui/dsh-im)（含 `integrations/desktop-panel`） | IM 接入本体；可在左侧栏加「IM机器人」全局面板 | 打开的是**机器人管理/配置面板**，不是聊天内容镜像 |
| [MichengAI/dsh-im-connect](https://github.com/MichengAI/dsh-im-connect) | 另一套 IM 接入；IM 会话归到工作区 **Channels** 标签下 | 只是把 IM 会话作为普通 DSH 会话查看，没有独立聊天镜像面板，也没有侧栏常驻聊天入口 |
| [unfar/dsh-chat-plugin](https://github.com/unfar/dsh-chat-plugin)（dsh Chat） | 左栏 + 全屏 IM 风聊天面板 | 是 **DSH 与 DSH 之间**的聊天室，不是手机 IM 镜像 |
| [JaMoLpE88/dsh-desktop-chat](https://github.com/JaMoLpE88/dsh-desktop-chat) | 在 DSH 桌面侧栏内嵌 DeepSeek 官方 Chat | 数据源是 DeepSeek Chat，不是手机 IM |
| [Jydsh/dsh-ding-card](https://github.com/Jydsh/dsh-ding-card) | 复用 dsh-im 连接，侧栏加「钉卡片」面板 | 功能是钉钉卡片设计/投放 |
| [201222-L/dsh-mobile-remote](https://github.com/201222-L/dsh-mobile-remote)、[dsh-mobile](https://www.npmjs.com/package/dsh-mobile) 等 | 在手机上看/控制电脑上的 DSH | **方向相反**：把桌面 DSH 搬到手机，而不是把手机消息镜像到桌面 |

本插件的差异点：**dsh-im 配套 + 左侧栏入口 + 实时气泡镜像 + Markdown/LaTeX/图片渲染**，只读、不改 dsh-im 本体。

> 如果你发现了同类插件，欢迎开 issue 补充。

## 已知限制

- 纯只读：发送消息仍需在手机或真实会话中进行
- 手机会话的发现是启发式规则；若 DSH 把一次手机对话拆成多个会话，可在顶部下拉里选择
- 历史只加载当前事件窗口（约 500 条消息），更早内容用「加载更早消息」
- 首次安装后需要刷新页面一次（Electron 桌面端限制）
- 依赖 dsh-im 的公开管理 RPC 做工作区发现；dsh-im 若改私有协议可能影响自动发现，此时用 `FALLBACK_WORKSPACES` 兜底

## License

MIT，见 [LICENSE](LICENSE)。内置第三方库许可见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

---

## English quick start

A read-only chat mirror for DSH desktop: shows the phone IM conversation bridged by
[dsh-im](https://github.com/xmanrui/dsh-im), with live assistant streaming, Markdown + LaTeX,
and inline images.

**Requirements**: DSH (web or desktop), `@xmanrui/dsh-im` installed and enabled with a connected channel.

**Install (from npm, recommended)**

```bash
dsh plugin --profile <your-profile> add dsh-im-phone-chat
```

Or clone this repo and install the local directory via DSH **Settings → Plugins → Install local plugin**,
or `dsh plugin --profile <your-profile> add link:<absolute-path-to-clone>`.
Then refresh the page once (`Ctrl+R` / `F5`). A chat-bubble icon appears in the left sidebar; click it to open the mirror panel.

**Update**: `dsh plugin --profile <your-profile> add dsh-im-phone-chat` (npm) or `git pull` in a local clone.

**Uninstall**: disable/remove the plugin in DSH, or
`dsh plugin --profile <your-profile> remove dsh-im-phone-chat`.

Built with KaTeX (MIT) and markdown-it (MIT); see third-party notices.

**How it differs from related plugins**: as of 2026-11 there is no other DSH plugin that
mirrors the phone IM conversation itself in a desktop panel. The closest ones are dsh-im's
own sidebar panel (bot *management*, not chat content), dsh-im-connect's "Channels" tab
(IM sessions shown as ordinary DSH sessions), dsh Chat (DSH↔DSH chat rooms) and
dsh-desktop-chat (official DeepSeek Chat, not IM). This plugin is the dsh-im companion that
adds a real-time, read-only chat mirror with Markdown/LaTeX and inline images.
