# LiteMD 科技感 UI 优化设计方案

**日期**：2026-04-14

## 一、概述

对 LiteMD 进行全面科技感/AI 感 UI 优化，以 CSS 动画为主 + 少量 JS，不引入新依赖。

**优化范围**：

- MenuBar 顶部操作栏
- EditorPanel 编辑面板
- TabBar 标签切换栏
- PreviewPanel 预览面板
- 整体过渡动画
- 彩蛋系统

---

## 二、MenuBar 顶部操作栏

### 2.1 Logo 呼吸脉冲

```scss
.brand-logo {
  animation: logo-pulse 3s ease-in-out infinite;
  filter: drop-shadow(0 0 8px rgba(129, 140, 248, 0.6));

  &:hover {
    animation-duration: 1s; // 脉冲加速
  }
}

@keyframes logo-pulse {
  0%,
  100% {
    opacity: 1;
    filter: drop-shadow(0 0 8px rgba(129, 140, 248, 0.6));
  }
  50% {
    opacity: 0.7;
    filter: drop-shadow(0 0 15px rgba(129, 140, 248, 0.9));
  }
}
```

### 2.2 按钮悬停光晕

```scss
.action-btn {
  transition: all 0.2s ease;

  &:hover {
    background: rgba(99, 102, 241, 0.15);
    box-shadow:
      0 0 12px rgba(99, 102, 241, 0.4),
      0 0 24px rgba(129, 140, 248, 0.2);
    color: #f8fafc;
  }

  &:active {
    transform: scale(0.92);
  }
}
```

### 2.3 保存按钮未保存状态

```scss
.action-btn--save.is-active {
  color: #f59e0b;
  animation: dirty-pulse 1.5s ease-in-out infinite;
}

@keyframes dirty-pulse {
  0%,
  100% {
    box-shadow: 0 0 6px rgba(245, 158, 11, 0.5);
  }
  50% {
    box-shadow:
      0 0 14px rgba(245, 158, 11, 0.8),
      0 0 28px rgba(245, 158, 11, 0.3);
  }
}
```

### 2.4 扫描线动画

在 MenuBar 底部添加 1px 扫描线，从左到右循环移动（4s）。

```scss
.menu-bar::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: -100%;
  width: 100%;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(99, 102, 241, 0.6) 50%,
    transparent 100%
  );
  animation: scan-line 4s linear infinite;
}

@keyframes scan-line {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}
```

### 2.5 版本号渐变文字

```scss
.version-text {
  background: linear-gradient(90deg, #818cf8, #22d3ee, #818cf8);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: version-gradient 4s linear infinite;
}
```

---

## 三、EditorPanel 编辑面板

### 3.1 光标发光

```scss
.editor-textarea {
  caret-color: #818cf8;
  text-shadow: 0 0 8px rgba(129, 140, 248, 0.8);
  animation: cursor-glow 2s ease-in-out infinite alternate;
}

@keyframes cursor-glow {
  0% {
    caret-color: #818cf8;
    text-shadow: 0 0 8px rgba(129, 140, 248, 0.6);
  }
  100% {
    caret-color: #22d3ee;
    text-shadow: 0 0 12px rgba(34, 211, 238, 0.8);
  }
}
```

### 3.2 选中文本渐变高亮

```scss
.editor-textarea::selection {
  background: linear-gradient(
    90deg,
    rgba(129, 140, 248, 0.4) 0%,
    rgba(34, 211, 238, 0.4) 50%,
    rgba(16, 185, 129, 0.4) 100%
  );
}
```

### 3.3 当前行号高亮脉冲

```scss
.line-number.is-current {
  color: #6366f1;
  font-weight: 700;
  animation: line-pulse 1.5s ease-in-out infinite;
  transform: scale(1.05);
}

@keyframes line-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
```

### 3.4 聚焦边框霓虹效果

```scss
.editor-panel.is-focused {
  box-shadow:
    inset 3px 0 0 0 #6366f1,
    0 0 20px rgba(99, 102, 241, 0.1);
}
```

### 3.5 字符输入粒子效果

在 `EditorPanel.vue` 中通过 JS 实现：

- 监听 `input` 事件
- 在光标位置创建 3-5 个小光点粒子
- 粒子随机向上飘动并渐隐（600ms）
- 纯 CSS animation + JS 动态创建 DOM

```typescript
function spawnParticles(container: HTMLElement, x: number, y: number) {
  const count = 3 + Math.floor(Math.random() * 3)
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div')
    particle.className = 'particle'
    particle.style.left = `${x + (Math.random() - 0.5) * 20}px`
    particle.style.top = `${y}px`
    container.appendChild(particle)
    setTimeout(() => particle.remove(), 600)
  }
}
```

### 3.6 背景点阵纹理

```scss
.editor-panel {
  background-image: radial-gradient(
    circle,
    rgba(99, 102, 241, 0.06) 1px,
    transparent 1px
  );
  background-size: 24px 24px;
}
```

---

## 四、TabBar 标签切换栏

### 4.1 滑块弹性跟随

Tab 切换时，背景滑块使用 spring 动画跟随：

```scss
.tab-bar__inner {
  position: relative;

  &::before {
    content: '';
    position: absolute;
    width: calc(50% - 4px);
    height: calc(100% - 6px);
    background: #ffffff;
    border-radius: $radius-md;
    box-shadow: $shadow-sm;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    z-index: 0;

    &[data-active='edit'] {
      transform: translateX(0);
    }
    &[data-active='preview'] {
      transform: translateX(100%);
    }
  }
}
```

### 4.2 激活 Tab 文字发光

```scss
.tab-item.is-active {
  color: #6366f1;
  text-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
  font-weight: 600;
}
```

### 4.3 数字翻转动画

当字数/行数变化时，数字执行翻转动画：

```scss
@keyframes digit-flip {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  50% {
    transform: translateY(-8px);
    opacity: 0;
  }
  51% {
    transform: translateY(8px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

.stat-value {
  display: inline-block;
  animation: digit-flip 0.3s ease;
}
```

---

## 五、PreviewPanel 预览面板

### 5.1 TOC 滚动高亮

```scss
.toc-link.is-active {
  background: rgba(99, 102, 241, 0.12);
  color: #6366f1;
  border-left: 2px solid #6366f1;
  padding-left: 6px;
  transition: all 0.2s ease;
}
```

### 5.2 链接霓虹填充效果

```scss
.markdown-body :deep(a) {
  position: relative;
  text-decoration: none;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 1px;
    background: linear-gradient(90deg, #6366f1, #22d3ee);
    transition: width 0.3s ease;
  }

  &:hover::after {
    width: 100%;
  }
}
```

### 5.3 代码块打字机效果

代码块进入视口时，逐字显示内容：

```typescript
function typewriterEffect(el: HTMLElement) {
  const code = el.textContent
  el.textContent = ''
  el.style.visibility = 'visible'
  let i = 0
  const interval = setInterval(() => {
    el.textContent += code?.[i]
    i++
    if (i >= (code?.length || 0)) clearInterval(interval)
  }, 8)
}
```

### 5.4 标题滑入效果

```scss
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3) {
  opacity: 0;
  transform: translateX(-10px);
  animation: heading-enter 0.4s ease forwards;
}

@keyframes heading-enter {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

---

## 六、整体过渡动画

### 6.1 编辑/预览切换

```scss
.content > * {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;

  &.fade-enter-from,
  &.fade-leave-to {
    opacity: 0;
    transform: scale(0.98) translateY(4px);
  }
}
```

### 6.2 保存成功消息

```scss
.el-message--success {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.3);
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
  animation: success-glow 1.5s ease;
}

@keyframes success-glow {
  0%,
  100% {
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
  }
  50% {
    box-shadow: 0 0 30px rgba(16, 185, 129, 0.4);
  }
}
```

### 6.3 文件打开缩放动画

```scss
.preview-content,
.editor-panel {
  animation: open-file 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes open-file {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

---

## 七、彩蛋系统

### 7.1 Matrix 雨 — 点击 Logo 5次

**触发**：连续点击 Logo 5 次（500ms 内）  
**效果**：屏幕降下绿色字符雨效果（5s 后自动消失）

```typescript
function triggerMatrixRain() {
  const canvas = document.createElement('canvas')
  canvas.id = 'matrix-rain'
  canvas.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    z-index: 9999; pointer-events: none;
  `
  document.body.appendChild(canvas)

  // Matrix rain implementation using canvas 2d
  // Green characters falling from top
  // 5s timeout then remove canvas

  setTimeout(() => canvas.remove(), 5000)
}
```

### 7.2 AI 脉冲波 — 输入 @ai

**触发**：在编辑区输入 `@ai` 然后空格  
**效果**：屏幕从编辑区中心扩散出一圈蓝色脉冲波纹

```typescript
function triggerAIPulse() {
  const ripple = document.createElement('div')
  ripple.className = 'ai-pulse-ripple'
  document.body.appendChild(ripple)
  setTimeout(() => ripple.remove(), 1000)
}
```

### 7.3 彩虹 hack — 双击选中文字

**触发**：选中文本后双击选中区域  
**效果**：选中文本闪烁彩虹色 3 次

```typescript
function triggerRainbowHack(selection: Selection) {
  const range = selection.getRangeAt(0)
  const span = document.createElement('span')
  span.className = 'rainbow-flash'
  span.appendChild(range.extractContents())
  range.insertNode(span)
  setTimeout(() => span.remove(), 600)
}
```

### 7.4 开发者模式 — Ctrl+Shift+D

**触发**：5 秒内按下 `Ctrl+Shift+D` 组合键  
**效果**：屏幕出现矩阵式代码流背景（持续 3s）

---

## 八、实现文件清单

| 文件                              | 改动内容                                       |
| --------------------------------- | ---------------------------------------------- |
| `src/styles/common.scss`          | 新增动效变量（glow, pulse, scan 等 keyframes） |
| `src/components/MenuBar.vue`      | Logo 脉冲、按钮光晕、扫描线动画                |
| `src/components/EditorPanel.vue`  | 光标发光、粒子效果、点阵背景、选中渐变         |
| `src/components/TabBar.vue`       | 滑块动画、数字翻转、Tab 发光                   |
| `src/components/PreviewPanel.vue` | TOC 高亮、链接动画、标题滑入、代码块打字机     |
| `src/App.vue`                     | 整体过渡动画、彩蛋系统集成                     |
| `src/styles/easter-eggs.scss`     | 彩蛋样式（Matrix 雨、AI 脉冲、彩虹 flash）     |
| `src/utils/easter-eggs.ts`        | 彩蛋触发逻辑                                   |

---

## 九、技术约束

- **不引入新依赖**：全部使用 CSS @keyframes + 少量 JS
- **性能优先**：粒子效果使用 `requestAnimationFrame`，彩蛋使用 `setTimeout` 限制时长
- **可维护性**：动画变量统一在 `common.scss` 中管理
- **兼容性**：使用标准 CSS 属性，避免实验性前缀
