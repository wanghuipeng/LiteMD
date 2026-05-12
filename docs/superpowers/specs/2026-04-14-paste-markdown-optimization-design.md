# 粘贴 Markdown 优化功能设计

## 概述

为 LiteMD 增加粘贴优化功能，自动识别粘贴内容类型并智能处理：

- 网页/富文本粘贴 → 自动清理并转换为 Markdown
- 纯文本粘贴 → 提供 AI 优化按钮，调用 AI 增强结构

## 核心流程

```
用户 Ctrl+V / 右键粘贴
    ↓
读取剪贴板内容 (navigator.clipboard)
    ↓
检测内容类型
    ↓
┌─────────────────┬─────────────────┐
│   HTML/富文本   │    纯文本       │
│ (clipboardData) │                │
└────────┬────────┴───────┬────────┘
         ↓                 ↓
    自动转 Markdown    插入原文到编辑器
         ↓            + 显示"AI优化"按钮
    插入编辑器
```

## 功能拆分

### 1. 剪贴板内容检测

**检测逻辑：**

- 优先检查 `clipboardData.types` 是否包含 `text/html`
- 若包含 `text/html` → 视为富文本/网页内容
- 仅包含 `text/plain` → 纯文本

**技术实现：**

- 在 EditorPanel 的 `handleInput` 或专用 paste handler 中处理
- 需拦截默认粘贴行为 (`e.preventDefault()`)

### 2. 富文本转 Markdown

**转换规则（本地处理，无需 AI）：**
| 来源格式 | 转换目标 |
|---------|---------|
| `<h1>` ~ `<h6>` | `#` ~ `######` 标题 |
| `<strong>`/`<b>` | `**粗体**` |
| `<em>`/`<i>` | `*斜体*` |
| `<code>` | `` `代码` `` |
| `<pre>` | ` `代码块` ` |
| `<a href="...">` | `[文本](链接)` |
| `<ul>/<ol>` 列表 | `-` / `1.` 列表项 |
| `<blockquote>` | `>` 引用块 |
| `<table>` | Markdown 表格 |
| `<p>` 段落 | 空行分隔 |

**工具库选择：**

- `turndown` — 成熟的 HTML → Markdown 转换库
- 或使用 `marked` 的内部解析再输出

**代码块处理：**

- 识别 `class="language-*"` 或 `data-lang="*"` 标注语言
- 保留缩进格式

### 3. AI 优化功能

**触发条件：**

- 粘贴纯文本后，在编辑器工具栏/按钮区显示"AI 优化"按钮
- 用户点击后开始处理

**AI 调用接口：**

```typescript
// 请求
interface AIOptimizeRequest {
  text: string // 原始纯文本
  apiKey: string // 用户配置的 API Key
  apiUrl: string // 用户配置的 API URL
  model: string // 模型名称
}

// 提示词设计
const SYSTEM_PROMPT = `你是一个 Markdown 优化助手。用户会粘贴纯文本内容，请将其转换为结构良好的 Markdown 格式。

要求：
1. 识别标题（标题通常较短且位于段落之前）
2. 识别列表（数字序列、 bullet points）
3. 识别代码块（技术术语、命令行等）
4. 识别链接（URL、邮箱）
5. 识别引用块
6. 保持原文语义不变
7. 直接输出 Markdown，不要解释

示例：
输入：我今天去了北京 故宫 长城 天坛
输出：# 北京之旅\n\n- 故宫\n- 长城\n- 天坛`

// 响应
interface AIOptimizeResponse {
  success: boolean
  markdown: string
  error?: string
}
```

**超时处理：** 30 秒超时，超时后提示用户重试

### 4. 设置面板

**新增配置项：**
| 配置项 | 类型 | 说明 |
|-------|------|------|
| `aiApiUrl` | string | AI API 地址 |
| `aiApiKey` | string | API Key（密码输入） |
| `aiModel` | string | 模型名称 |

**存储方式：** electron-store 持久化存储

**配置入口：** 暂时放在 MenuBar 工具栏区域，点击设置图标弹出

### 5. UI 改动

#### 5.1 工具栏区域 (MenuBar.vue)

在现有按钮区域增加：

- `AI优化` 按钮（纯文本粘贴后可见）
- `设置` 按钮（齿轮图标，点击弹出 AI 配置）

#### 5.2 AI 优化按钮

**显示条件：** 粘贴纯文本后显示

**状态：**

- 默认：显示"AI优化"
- 加载中：显示加载动画 + "优化中..."
- 成功：闪动成功状态
- 失败：显示错误，点击可重试

#### 5.3 设置弹窗

使用 Element Plus Dialog，包含：

- API URL 输入框
- API Key 密码输入框
- 模型名称输入框
- 保存/取消按钮

## 数据流

```
Clipboard
    ↓
EditorPanel paste handler
    ↓
ContentTypeDetector (检测类型)
    ↓
┌──────────────┴──────────────┐
↓                              ↓
HtmlToMarkdownConverter    显示AI优化按钮
↓                              ↓
Insert to editor          AIOptimizeService
                               ↓
                            API Call
                               ↓
                            Insert result
```

## 目录结构

```
src/
├── components/
│   ├── MenuBar.vue          # 增加 AI优化按钮、设置入口
│   ├── EditorPanel.vue      # 拦截粘贴、处理逻辑
│   └── AISettingsDialog.vue # AI 配置弹窗（新增）
├── stores/
│   └── editor.ts            # 扩展，增加 AI 配置状态
├── utils/
│   ├── clipboard.ts         # 剪贴板工具（新增）
│   ├── htmlToMarkdown.ts    # HTML转Markdown（新增）
│   └── aiOptimize.ts         # AI调用服务（新增）
└── types/
    └── ai.ts                # AI相关类型定义（新增）
```

## 依赖

```bash
# 需要安装
npm install turndown   # HTML → Markdown 转换
```

AI 调用使用原生 fetch，无需额外依赖。

## 错误处理

| 场景              | 处理方式               |
| ----------------- | ---------------------- |
| AI API Key 未配置 | 弹出设置弹窗提示配置   |
| AI 调用失败       | 显示错误消息，保留原文 |
| AI 超时（30s）    | 显示超时提示，可重试   |
| 剪贴板读取失败    | 使用默认粘贴行为       |
| HTML 转换失败     | 回退到纯文本粘贴       |

## 实现顺序

1. **阶段一：基础结构**
   - 安装 turndown
   - 创建 `htmlToMarkdown.ts` 工具
   - 修改 EditorPanel 拦截粘贴

2. **阶段二：AI 服务**
   - 创建 `aiOptimize.ts` 服务
   - 创建 AISettingsDialog 组件
   - 实现 AI 配置存储

3. **阶段三：UI 集成**
   - MenuBar 增加 AI优化按钮和设置入口
   - 实现按钮状态管理
   - 端到端测试

## 配置存储

```typescript
// electron-store schema
interface StoreSchema {
  ai: {
    apiUrl: string
    apiKey: string
    model: string
  }
}
```
