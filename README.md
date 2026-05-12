# LiteMD

一款基于 Electron + Vue3 构建的轻量级 Markdown 编辑器。

## 功能特性

- 打开、编辑、保存本地 Markdown 文件
- 实时预览，支持语法高亮
- 多文件标签页编辑
- 搜索替换功能
- Element Plus 现代 UI
- 常用操作键盘快捷键

## 技术栈

- **框架**: Electron + Vue3 + TypeScript
- **构建工具**: electron-vite
- **UI 组件库**: Element Plus
- **Markdown 解析**: marked + highlight.js
- **状态管理**: Pinia

## 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl + O | 打开文件 |
| Ctrl + S | 保存文件 |
| Ctrl + Shift + S | 另存为 |
| Ctrl + N | 新建文件 |

## 快速开始

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

## 构建

```bash
# 构建 Windows 安装包
npm run dist:win
```

## 许可证

MIT

---

# LiteMD

A simple Markdown editor built with Electron + Vue3.

## Features

- Open, edit and save local Markdown files
- Real-time preview with syntax highlighting
- Tab-based multi-file editing
- Search and replace functionality
- Element Plus modern UI
- Keyboard shortcuts for common operations

## Tech Stack

- **Framework**: Electron + Vue3 + TypeScript
- **Build Tool**: electron-vite
- **UI Library**: Element Plus
- **Markdown Parser**: marked + highlight.js
- **State Management**: Pinia

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl + O | Open file |
| Ctrl + S | Save file |
| Ctrl + Shift + S | Save as |
| Ctrl + N | New file |

## Getting Started

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Preview build result
npm run preview
```

## Build

```bash
# Build for Windows
npm run dist:win
```

## License

MIT
