# LiteMD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个 Electron 桌面应用，支持打开、编辑、保存本地 Markdown 文件。

**Architecture:** 使用 electron-vite 构建工具，主进程负责窗口管理和文件系统操作，渲染进程使用 Vue3 管理 UI 状态，通过 IPC 通信桥接文件操作 API。

**Tech Stack:** electron-vite + Vue3 + TypeScript + Element Plus + SCSS + marked + highlight.js

---

## 文件结构

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

---

## Task 1: 初始化项目

**Files:**

- Create: `package.json`
- Create: `electron.vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `tsconfig.web.json`
- Create: `index.html`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "LiteMD",
  "version": "1.0.0",
  "description": "A simple LiteMD built with Electron",
  "main": "./out/main/index.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview"
  },
  "dependencies": {
    "vue": "^3.4.0",
    "pinia": "^2.1.0",
    "element-plus": "^2.5.0",
    "marked": "^12.0.0",
    "highlight.js": "^11.9.0"
  },
  "devDependencies": {
    "electron-vite": "^2.0.0",
    "vite": "^5.0.0",
    "typescript": "^5.3.0",
    "vue-tsc": "^1.8.0",
    "@vitejs/plugin-vue": "^5.0.0",
    "sass": "^1.70.0"
  }
}
```

- [ ] **Step 2: 创建 electron.vite.config.ts**

```typescript
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src')
      }
    },
    plugins: [vue()]
  }
})
```

- [ ] **Step 3: 创建 tsconfig.json**

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.web.json" }
  ]
}
```

- [ ] **Step 4: 创建 tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "strict": true,
    "outDir": "out"
  },
  "include": ["electron.vite.config.ts"]
}
```

- [ ] **Step 5: 创建 tsconfig.web.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "target": "ESNext",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 6: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>LiteMD</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 7: 运行 npm install**

Run: `cd D:/workspaceAI/LiteMD && npm install`

---

## Task 2: 创建主进程入口

**Files:**

- Create: `electron/main.ts`
- Create: `electron/ipc.ts`

- [ ] **Step 1: 创建 electron/main.ts**

```typescript
import { app, BrowserWindow, Menu } from 'electron'
import { join } from 'path'
import { setupIpcHandlers } from './ipc'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // 创建应用菜单
  const menuTemplate: Electron.MenuItemConstructorOptions[] = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('menu:new')
        },
        {
          label: '打开',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow?.webContents.send('menu:open')
        },
        {
          label: '保存',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow?.webContents.send('menu:save')
        },
        {
          label: '另存为',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => mainWindow?.webContents.send('menu:save-as')
        },
        { type: 'separator' },
        { label: '退出', role: 'quit' }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)

  // 加载页面
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  setupIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
```

- [ ] **Step 2: 创建 electron/ipc.ts**

```typescript
import { ipcMain, dialog } from 'electron'
import { readFile, writeFile } from 'fs/promises'

export function setupIpcHandlers(): void {
  // 打开文件
  ipcMain.handle('file:open', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }]
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true }
    }

    const filePath = result.filePaths[0]
    const content = await readFile(filePath, 'utf-8')
    return { success: true, filePath, content }
  })

  // 保存文件
  ipcMain.handle('file:save', async (_, { filePath, content }) => {
    if (!filePath) {
      // 另存为
      const result = await dialog.showSaveDialog({
        filters: [{ name: 'Markdown', extensions: ['md'] }]
      })
      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true }
      }
      filePath = result.filePath
    }

    await writeFile(filePath, content, 'utf-8')
    return { success: true, filePath }
  })
}
```

---

## Task 3: 创建预加载脚本

**Files:**

- Create: `electron/preload.ts`

- [ ] **Step 1: 创建 electron/preload.ts**

```typescript
import { contextBridge, ipcRenderer } from 'electron'

export interface ElectronAPI {
  openFile: () => Promise<{
    success: boolean
    canceled?: boolean
    filePath?: string
    content?: string
  }>
  saveFile: (
    filePath: string | null,
    content: string
  ) => Promise<{ success: boolean; canceled?: boolean; filePath?: string }>
  onMenuNew: (callback: () => void) => void
  onMenuOpen: (callback: () => void) => void
  onMenuSave: (callback: () => void) => void
  onMenuSaveAs: (callback: () => void) => void
}

const electronAPI: ElectronAPI = {
  openFile: () => ipcRenderer.invoke('file:open'),
  saveFile: (filePath, content) =>
    ipcRenderer.invoke('file:save', { filePath, content }),
  onMenuNew: (callback) => ipcRenderer.on('menu:new', callback),
  onMenuOpen: (callback) => ipcRenderer.on('menu:open', callback),
  onMenuSave: (callback) => ipcRenderer.on('menu:save', callback),
  onMenuSaveAs: (callback) => ipcRenderer.on('menu:save-as', callback)
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
```

---

## Task 4: 创建 Vue 入口和根组件

**Files:**

- Create: `src/main.ts`
- Create: `src/App.vue`

- [ ] **Step 1: 创建 src/main.ts**

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'

const app = createApp(App)
app.use(createPinia())
app.use(ElementPlus)
app.mount('#app')
```

- [ ] **Step 2: 创建 src/App.vue**

```vue
<template>
  <div id="app">
    <EditorView />
  </div>
</template>

<script setup lang="ts">
import EditorView from './views/EditorView.vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
```

---

## Task 5: 创建编辑器状态管理

**Files:**

- Create: `src/stores/editor.ts`

- [ ] **Step 1: 创建 src/stores/editor.ts**

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useEditorStore = defineStore('editor', () => {
  const content = ref('')
  const filePath = ref<string | null>(null)
  const isDirty = ref(false)
  const activeTab = ref<'edit' | 'preview'>('edit')

  function setContent(newContent: string) {
    content.value = newContent
    isDirty.value = true
  }

  function setFile(file: { path: string | null; content: string }) {
    filePath.value = file.path
    content.value = file.content
    isDirty.value = false
  }

  function markSaved(path: string | null) {
    filePath.value = path
    isDirty.value = false
  }

  function newFile() {
    content.value = ''
    filePath.value = null
    isDirty.value = false
    activeTab.value = 'edit'
  }

  function setActiveTab(tab: 'edit' | 'preview') {
    activeTab.value = tab
  }

  return {
    content,
    filePath,
    isDirty,
    activeTab,
    setContent,
    setFile,
    markSaved,
    newFile,
    setActiveTab
  }
})
```

---

## Task 6: 创建 Markdown 解析工具

**Files:**

- Create: `src/utils/markdown.ts`

- [ ] **Step 1: 创建 src/utils/markdown.ts**

```typescript
import { marked } from 'marked'
import hljs from 'highlight.js'

marked.setOptions({
  highlight: (code: string, lang: string) => {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value
    }
    return code
  }
})

export function parseMarkdown(content: string): string {
  return marked(content) as string
}
```

---

## Task 7: 创建编辑器面板组件

**Files:**

- Create: `src/components/EditorPanel.vue`

- [ ] **Step 1: 创建 src/components/EditorPanel.vue**

```vue
<template>
  <div class="editor-panel">
    <el-input
      v-model="localContent"
      type="textarea"
      placeholder="在此输入 Markdown 内容..."
      @input="handleInput"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useEditorStore } from '@/stores/editor'

const store = useEditorStore()
const localContent = ref(store.content)

watch(
  () => store.content,
  (newContent) => {
    localContent.value = newContent
  }
)

function handleInput() {
  store.setContent(localContent.value)
}
</script>

<style scoped lang="scss">
.editor-panel {
  width: 100%;
  height: 100%;

  :deep(.el-textarea__inner) {
    width: 100%;
    height: 100%;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 14px;
    line-height: 1.6;
    resize: none;
    border: none;
    padding: 16px;
  }
}
</style>
```

---

## Task 8: 创建预览面板组件

**Files:**

- Create: `src/components/PreviewPanel.vue`

- [ ] **Step 1: 创建 src/components/PreviewPanel.vue**

```vue
<template>
  <div class="preview-panel">
    <div class="markdown-body" v-html="renderedContent"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { parseMarkdown } from '@/utils/markdown'

const store = useEditorStore()

const renderedContent = computed(() => {
  return parseMarkdown(store.content)
})
</script>

<style scoped lang="scss">
.preview-panel {
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: 16px;
  background: #fff;

  .markdown-body {
    max-width: 800px;
    margin: 0 auto;

    :deep(h1) {
      font-size: 2em;
      border-bottom: 1px solid #eaecef;
      padding-bottom: 0.3em;
      margin-bottom: 16px;
    }

    :deep(h2) {
      font-size: 1.5em;
      border-bottom: 1px solid #eaecef;
      padding-bottom: 0.3em;
      margin-top: 24px;
      margin-bottom: 16px;
    }

    :deep(pre) {
      background: #f6f8fa;
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;

      code {
        background: none;
        padding: 0;
      }
    }

    :deep(code) {
      background: #f6f8fa;
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-family: 'Consolas', 'Monaco', monospace;
    }

    :deep(blockquote) {
      border-left: 4px solid #dfe2e5;
      padding-left: 16px;
      color: #6a737d;
      margin: 0;
    }

    :deep(ul),
    :deep(ol) {
      padding-left: 2em;
    }

    :deep(a) {
      color: #0366d6;
    }

    :deep(table) {
      border-collapse: collapse;
      width: 100%;

      th,
      td {
        border: 1px solid #dfe2e5;
        padding: 8px;
      }

      th {
        background: #f6f8fa;
      }
    }
  }
}
</style>
```

---

## Task 9: 创建标签切换栏组件

**Files:**

- Create: `src/components/TabBar.vue`

- [ ] **Step 1: 创建 src/components/TabBar.vue**

```vue
<template>
  <div class="tab-bar">
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="编辑" name="edit" />
      <el-tab-pane label="预览" name="preview" />
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '@/stores/editor'

const store = useEditorStore()

const activeTab = computed({
  get: () => store.activeTab,
  set: (val) => store.setActiveTab(val as 'edit' | 'preview')
})

function handleTabChange(tab: string) {
  store.setActiveTab(tab as 'edit' | 'preview')
}
</script>

<style scoped lang="scss">
.tab-bar {
  border-bottom: 1px solid #e0e0e0;

  :deep(.el-tabs__header) {
    margin-bottom: 0;
  }

  :deep(.el-tabs__nav-wrap::after) {
    display: none;
  }
}
</style>
```

---

## Task 10: 创建菜单栏组件

**Files:**

- Create: `src/components/MenuBar.vue`

- [ ] **Step 1: 创建 src/components/MenuBar.vue**

```vue
<template>
  <div class="menu-bar">
    <el-menu mode="horizontal" :ellipsis="false">
      <el-sub-menu index="file">
        <template #title>文件</template>
        <el-menu-item index="new" @click="handleNew">新建</el-menu-item>
        <el-menu-item index="open" @click="handleOpen">打开</el-menu-item>
        <el-menu-item index="save" @click="handleSave">保存</el-menu-item>
        <el-menu-item index="save-as" @click="handleSaveAs"
          >另存为</el-menu-item
        >
      </el-sub-menu>
    </el-menu>
    <div class="status">
      <span v-if="store.isDirty" class="dirty-indicator">*</span>
      <span class="file-name">{{ fileName }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { ElMessage } from 'element-plus'

declare global {
  interface Window {
    electronAPI: {
      openFile: () => Promise<{
        success: boolean
        canceled?: boolean
        filePath?: string
        content?: string
      }>
      saveFile: (
        filePath: string | null,
        content: string
      ) => Promise<{ success: boolean; canceled?: boolean; filePath?: string }>
      onMenuNew: (callback: () => void) => void
      onMenuOpen: (callback: () => void) => void
      onMenuSave: (callback: () => void) => void
      onMenuSaveAs: (callback: () => void) => void
    }
  }
}

const store = useEditorStore()

const fileName = computed(() => {
  if (store.filePath) {
    const parts = store.filePath.split(/[\\/]/)
    return parts[parts.length - 1]
  }
  return '未命名.md'
})

async function handleNew() {
  store.newFile()
  ElMessage.success('已新建文件')
}

async function handleOpen() {
  const result = await window.electronAPI.openFile()
  if (result.success && result.filePath && result.content !== undefined) {
    store.setFile({ path: result.filePath, content: result.content })
    ElMessage.success('文件已打开')
  }
}

async function handleSave() {
  const result = await window.electronAPI.saveFile(
    store.filePath,
    store.content
  )
  if (result.success && result.filePath) {
    store.markSaved(result.filePath)
    ElMessage.success('文件已保存')
  }
}

async function handleSaveAs() {
  const result = await window.electronAPI.saveFile(null, store.content)
  if (result.success && result.filePath) {
    store.markSaved(result.filePath)
    ElMessage.success('文件已保存')
  }
}
</script>

<style scoped lang="scss">
.menu-bar {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;

  .el-menu {
    border-bottom: none;
  }

  .status {
    margin-left: auto;
    padding: 0 16px;
    display: flex;
    align-items: center;

    .dirty-indicator {
      color: #f56c6c;
      font-weight: bold;
      margin-right: 4px;
    }

    .file-name {
      font-size: 14px;
      color: #666;
    }
  }
}
</style>
```

---

## Task 11: 创建编辑器主页面

**Files:**

- Create: `src/views/EditorView.vue`

- [ ] **Step 1: 创建 src/views/EditorView.vue**

```vue
<template>
  <div class="editor-view">
    <MenuBar />
    <TabBar />
    <div class="content">
      <EditorPanel v-show="store.activeTab === 'edit'" />
      <PreviewPanel v-show="store.activeTab === 'preview'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useEditorStore } from '@/stores/editor'
import MenuBar from '@/components/MenuBar.vue'
import TabBar from '@/components/TabBar.vue'
import EditorPanel from '@/components/EditorPanel.vue'
import PreviewPanel from '@/components/PreviewPanel.vue'

const store = useEditorStore()

onMounted(() => {
  // 注册菜单快捷键事件
  window.electronAPI.onMenuNew(() => store.newFile())
  window.electronAPI.onMenuOpen(async () => {
    const result = await window.electronAPI.openFile()
    if (result.success && result.filePath && result.content !== undefined) {
      store.setFile({ path: result.filePath, content: result.content })
    }
  })
  window.electronAPI.onMenuSave(async () => {
    const result = await window.electronAPI.saveFile(
      store.filePath,
      store.content
    )
    if (result.success && result.filePath) {
      store.markSaved(result.filePath)
    }
  })
  window.electronAPI.onMenuSaveAs(async () => {
    const result = await window.electronAPI.saveFile(null, store.content)
    if (result.success && result.filePath) {
      store.markSaved(result.filePath)
    }
  })
})
</script>

<style scoped lang="scss">
.editor-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  .content {
    flex: 1;
    overflow: hidden;

    > * {
      width: 100%;
      height: 100%;
    }
  }
}
</style>
```

---

## Task 12: 创建样式文件

**Files:**

- Create: `src/styles/common.scss`

- [ ] **Step 1: 创建 src/styles/common.scss**

```scss
// 全局样式变量
$primary-color: #409eff;
$border-color: #e0e0e0;
$bg-color: #fff;
```

---

## Task 13: 添加 TypeScript 类型声明

**Files:**

- Create: `src/env.d.ts`

- [ ] **Step 1: 创建 src/env.d.ts**

```typescript
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
```

---

## Task 14: 验证构建

- [ ] **Step 1: 运行开发模式**

Run: `cd D:/workspaceAI/LiteMD && npm run dev`

Expected: 应用窗口打开，无报错

- [ ] **Step 2: 运行生产构建**

Run: `cd D:/workspaceAI/LiteMD && npm run build`

Expected: 构建成功，生成 out 目录

---

## 实施检查清单

- [ ] Task 1: 初始化项目
- [ ] Task 2: 创建主进程入口
- [ ] Task 3: 创建预加载脚本
- [ ] Task 4: 创建 Vue 入口和根组件
- [ ] Task 5: 创建编辑器状态管理
- [ ] Task 6: 创建 Markdown 解析工具
- [ ] Task 7: 创建编辑器面板组件
- [ ] Task 8: 创建预览面板组件
- [ ] Task 9: 创建标签切换栏组件
- [ ] Task 10: 创建菜单栏组件
- [ ] Task 11: 创建编辑器主页面
- [ ] Task 12: 创建样式文件
- [ ] Task 13: 添加 TypeScript 类型声明
- [ ] Task 14: 验证构建
