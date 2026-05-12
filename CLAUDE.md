# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

LiteMD 是一个基于 Electron + Vue3 的桌面应用，支持打开、编辑、保存本地 Markdown 文件。

## 开发命令

```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev

# 生产构建
npm run build

# 预览构建结果
npm run preview
```

## 技术栈

- **构建工具**: electron-vite
- **前端框架**: Vue3 + TypeScript
- **UI 组件库**: Element Plus
- **样式**: SCSS
- **状态管理**: Pinia
- **Markdown 解析**: marked + highlight.js

## 架构

```
LiteMD/
├── electron/           # Electron 主进程
│   ├── main.ts        # 入口，窗口管理和应用菜单
│   ├── preload.ts     # 预加载脚本，暴露文件 API 到渲染进程
│   └── ipc.ts        # IPC 通信处理（文件打开/保存）
├── src/               # Vue 渲染进程
│   ├── views/         # 页面组件
│   ├── components/    # UI 组件（MenuBar, TabBar, EditorPanel, PreviewPanel）
│   ├── stores/        # Pinia 状态管理
│   └── utils/         # 工具函数（Markdown 解析）
└── out/               # 构建产物目录
```

## 主进程与渲染进程通信

通过 IPC 通道通信：

| 通道        | 方向            | 用途          |
| ----------- | --------------- | ------------- |
| `file:open` | renderer → main | 打开 .md 文件 |
| `file:save` | renderer → main | 保存文件      |

渲染进程通过 `window.electronAPI` 访问这些 API。

## 键盘快捷键

| 快捷键           | 功能     |
| ---------------- | -------- |
| Ctrl + O         | 打开文件 |
| Ctrl + S         | 保存文件 |
| Ctrl + Shift + S | 另存为   |
| Ctrl + N         | 新建文件 |
