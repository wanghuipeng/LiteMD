# LiteMD 设计文档

**日期**：2026-04-13

## 一、技术栈

- **构建工具**：electron-vite
- **前端框架**：Vue3 + TypeScript
- **UI 组件库**：Element Plus
- **样式**：SCSS
- **Markdown 解析**：marked + highlight.js

## 二、项目结构

```
LiteMD/
├── electron/
│   ├── main.ts        # Electron 主进程
│   ├── preload.ts     # 预加载脚本（桥接文件操作 API）
│   └── ipc.ts         # 主进程通信处理
├── src/
│   ├── main.ts        # Vue 入口
│   ├── App.vue        # 根组件
│   ├── views/
│   │   └── EditorView.vue    # 编辑器主页面
│   ├── components/
│   │   ├── MenuBar.vue       # 顶部菜单栏
│   │   ├── EditorPanel.vue   # 编辑面板
│   │   ├── PreviewPanel.vue  # 预览面板
│   │   └── TabBar.vue        # 标签切换栏
│   ├── stores/
│   │   └── editor.ts         # 编辑器状态（Pinia）
│   └── utils/
│       └── markdown.ts       # Markdown 解析配置
├── electron.vite.config.ts
└── package.json
```

## 三、架构设计

### 主进程与渲染进程通信（IPC）

| 通道名         | 方向            | 用途               |
| -------------- | --------------- | ------------------ |
| `file:open`    | renderer → main | 触发打开文件对话框 |
| `file:save`    | renderer → main | 触发保存文件对话框 |
| `file:content` | main → renderer | 返回文件内容       |
| `file:saved`   | main → renderer | 返回保存结果       |

### 数据流

1. 用户点击"打开"→ `EditorView` 调用 `window.electronAPI.openFile()`
2. 主进程显示系统文件对话框，过滤 `.md` 文件
3. 主进程读取文件 → 通过 `file:content` 返回内容
4. 渲染进程更新 store 中的 `content` 和 `filePath`

## 四、核心数据模型

```typescript
// 编辑器状态
interface EditorState {
  content: string // 当前 Markdown 内容
  filePath: string | null // 当前文件路径（null 表示新文件）
  isDirty: boolean // 是否有未保存的更改
  activeTab: 'edit' | 'preview' // 当前激活的标签
}
```

状态管理使用 Pinia。

## 五、文件操作流程

### 打开文件

1. 用户点击菜单"文件 → 打开"
2. 主进程调用系统对话框，过滤 `.md` 文件
3. 读取选中文件内容
4. 更新 store：`{ content, filePath, isDirty: false }`

### 保存文件

- **已有文件**：直接写入 `filePath`
- **新文件**：弹出"另存为"对话框，用户指定路径

### 新建文件

- 清空 `content`，`filePath` 设为 `null`，`isDirty` 设为 `false`

## 六、预览渲染

使用 `marked` + `highlight.js` 将 Markdown 转为 HTML：

```typescript
import { marked } from 'marked'
import hljs from 'highlight.js'

marked.setOptions({
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value
    }
    return code
  }
})
```

预览面板使用 `v-html` 渲染解析后的 HTML，并引入 GitHub 风格的 CSS 样式。

## 七、键盘快捷键

| 快捷键           | 功能     |
| ---------------- | -------- |
| Ctrl + O         | 打开文件 |
| Ctrl + S         | 保存文件 |
| Ctrl + Shift + S | 另存为   |

## 八、UI 组件

### 布局方案

- **标签页切换模式**：编辑/预览通过 `el-tabs` 切换
- **顶部菜单栏**：使用 `el-menu` 实现"文件"下拉菜单
- **富文本预览**：渲染 Markdown 为带样式的 HTML

### Element Plus 组件使用

- `el-menu` — 顶部菜单栏
- `el-tabs` — 编辑/预览标签切换
- `el-message` — 操作结果提示

## 九、多文档支持

**单文档模式**：一次只能编辑一个文件，打开新文件会替换当前文件。

## 十、开发命令

```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建生产版本
npm run build
```
