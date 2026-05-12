# LiteMD 科技感 UI 优化实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 LiteMD 添加科技感/AI 感的 UI 动效和交互彩蛋，纯 CSS 动画 + 少量 JS，不引入新依赖。

**Architecture:** 动效变量集中在 common.scss，彩蛋逻辑封装在 easter-eggs.ts，组件样式各自分离在对应 .vue 文件中。

**Tech Stack:** CSS @keyframes / transitions / animation, Vue3 Composition API, TypeScript, SCSS

---

## 文件结构

```
src/
├── styles/
│   ├── common.scss          # 动效变量和 keyframes（修改）
│   └── easter-eggs.scss     # 彩蛋样式（新建）
├── utils/
│   └── easter-eggs.ts       # 彩蛋触发逻辑（新建）
└── components/
    ├── MenuBar.vue          # Logo脉冲、按钮光晕、扫描线（修改）
    ├── EditorPanel.vue       # 光标发光、粒子效果、点阵背景（修改）
    ├── TabBar.vue            # 滑块弹性动画、数字翻转（修改）
    └── PreviewPanel.vue      # TOC高亮、链接动画、标题滑入、代码块打字机（修改）
App.vue                       # 整体过渡动画、彩蛋集成（修改）
```

---

## Task 1: 动效变量和 Keyframes

**Files:**

- Modify: `src/styles/common.scss`

- [ ] **Step 1: 在 common.scss 末尾追加动画变量和 keyframes**

在 `$shadow-inset` 之后添加：

```scss
// ── Glow animations ────────────────────────────────────────────
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

@keyframes scan-line {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

@keyframes version-gradient {
  0% {
    background-position: 0% center;
  }
  100% {
    background-position: 200% center;
  }
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

@keyframes line-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes heading-enter {
  to {
    opacity: 1;
    transform: translateX(0);
  }
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

@keyframes success-glow {
  0%,
  100% {
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
  }
  50% {
    box-shadow: 0 0 30px rgba(16, 185, 129, 0.4);
  }
}

@keyframes particle-rise {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-30px) scale(0.5);
  }
}
```

---

## Task 2: MenuBar 动效

**Files:**

- Modify: `src/components/MenuBar.vue:155-168` (brand-logo 样式区)
- Modify: `src/components/MenuBar.vue:222-254` (action-btn 样式区)
- Modify: `src/components/MenuBar.vue:148-169` (menu-bar::after 扫描线)

- [ ] **Step 1: 修改 brand-logo 样式，添加呼吸脉冲**

找到 `.brand-logo` 样式块，替换为：

```scss
.brand-logo {
  font-size: 17px;
  color: $color-primary-light;
  line-height: 1;
  animation: logo-pulse 3s ease-in-out infinite;
  filter: drop-shadow(0 0 5px rgba(129, 140, 248, 0.55));

  &:hover {
    animation-duration: 1s;
  }
}
```

- [ ] **Step 2: 添加扫描线动画**

在 `.menu-bar` 样式块的 `&::before` 之后添加：

```scss
&::after {
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
  pointer-events: none;
}
```

- [ ] **Step 3: 修改 .action-btn hover 效果，添加霓虹光晕**

替换现有 `.action-btn` 的 hover 部分：

```scss
&:hover {
  background: rgba(99, 102, 241, 0.15);
  box-shadow:
    0 0 12px rgba(99, 102, 241, 0.4),
    0 0 24px rgba(129, 140, 248, 0.2);
  color: $color-text-inverse;
}

&:active {
  background: rgba(255, 255, 255, 0.06);
  transform: scale(0.92);
}
```

- [ ] **Step 4: 修改 .action-btn--save.is-active 添加脉冲动画**

替换 `.action-btn--save.is-active` 块：

```scss
&--save.is-active {
  color: $color-warning;
  animation: dirty-pulse 1.5s ease-in-out infinite;

  &:hover {
    background: rgba(245, 158, 11, 0.18);
  }
}
```

- [ ] **Step 5: 修改 .version-text 添加渐变文字动画**

替换 `.version-text` 块：

```scss
.version-text {
  font-size: 11px;
  font-family: $font-mono;
  background: linear-gradient(90deg, #818cf8, #22d3ee, #818cf8);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: version-gradient 4s linear infinite;
}
```

---

## Task 3: EditorPanel 动效

**Files:**

- Modify: `src/components/EditorPanel.vue:95-203` (style 部分)

- [ ] **Step 1: 添加点阵背景和聚焦霓虹边框**

替换 `.editor-panel` 块：

```scss
.editor-panel {
  display: flex;
  width: 100%;
  height: 100%;
  background-color: $color-bg-editor;
  background-image: radial-gradient(
    circle,
    rgba(99, 102, 241, 0.06) 1px,
    transparent 1px
  );
  background-size: 24px 24px;
  overflow: hidden;
  position: relative;
  transition: box-shadow $transition-base;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: transparent;
    transition: background $transition-base;
    z-index: 2;
  }

  &.is-focused::before {
    background: $color-primary;
    box-shadow: 0 0 12px rgba(99, 102, 241, 0.6);
  }
}
```

- [ ] **Step 2: 修改 .editor-textarea 的光标样式**

替换 `.editor-textarea` 块中的 caret 和 selection 部分：

```scss
caret-color: #818cf8;
animation: cursor-glow 2s ease-in-out infinite alternate;

// Selection
&::selection {
  background: linear-gradient(
    90deg,
    rgba(129, 140, 248, 0.4) 0%,
    rgba(34, 211, 238, 0.4) 50%,
    rgba(16, 185, 129, 0.4) 100%
  );
}
```

- [ ] **Step 3: 修改 .line-number.is-current 高亮脉冲**

替换 `.line-number.is-current` 块：

```scss
&.is-current {
  color: $color-primary;
  font-weight: 700;
  animation: line-pulse 1.5s ease-in-out infinite;
  transform: scale(1.05);
}
```

- [ ] **Step 4: 在 script 中添加粒子效果逻辑**

在 `<script setup>` 的 `handleInput` 函数内添加粒子生成调用：

```typescript
function handleInput() {
  store.setContent(localContent.value)
  updateCurrentLine()

  // Spawn particles at cursor position
  if (textareaRef.value) {
    const rect = textareaRef.value.getBoundingClientRect()
    const cursorPos = textareaRef.value.selectionStart
    const charIndex =
      localContent.value.slice(0, cursorPos).split('\n').length - 1
    const y = 20 + charIndex * 27 // approximate line height
    spawnParticles(textareaRef.value.parentElement!, rect.left + 100, y)
  }
}

function spawnParticles(container: HTMLElement, x: number, y: number) {
  const count = 3 + Math.floor(Math.random() * 3)
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div')
    particle.className = 'particle'
    particle.style.cssText = `
      position: fixed;
      left: ${x + (Math.random() - 0.5) * 20}px;
      top: ${y}px;
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: #818cf8;
      pointer-events: none;
      z-index: 1000;
      animation: particle-rise 0.6s ease-out forwards;
      box-shadow: 0 0 6px rgba(129, 140, 248, 0.8);
    `
    document.body.appendChild(particle)
    setTimeout(() => particle.remove(), 600)
  }
}
```

- [ ] **Step 5: 添加粒子样式**

在 `</style>` 之前添加：

```scss
// ── Particle effect ───────────────────────────────────────────
:global(.particle) {
  position: fixed;
  pointer-events: none;
}
```

---

## Task 4: TabBar 动效

**Files:**

- Modify: `src/components/TabBar.vue:54-140` (style 部分)

- [ ] **Step 1: 修改 .tab-bar\_\_inner 添加滑块动画**

替换 `.tab-bar__inner` 块：

```scss
&__inner {
  display: flex;
  align-items: center;
  gap: 2px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: $radius-lg;
  padding: 3px;
  position: relative;

  // Active slider
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
  }

  &[data-active='edit']::before {
    transform: translateX(0);
  }
  &[data-active='preview']::before {
    transform: translateX(100%);
  }
}
```

- [ ] **Step 2: 添加 digit-flip 动画变量到 common.scss**

在 `common.scss` 的 keyframes 区添加：

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
```

- [ ] **Step 3: 修改 .tab-item.is-active 文字发光**

替换 `.tab-item.is-active` 块：

```scss
&.is-active {
  background: transparent;
  color: $color-primary;
  text-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
  font-weight: 600;
  box-shadow: none;

  .tab-icon {
    color: $color-primary;
  }
}
```

- [ ] **Step 4: 修改 template 绑定 data-active 属性**

在 `.tab-bar__inner` div 上添加动态属性：

```html
<div class="tab-bar__inner" :data-active="store.activeTab"></div>
```

- [ ] **Step 5: 修改字数行数显示，添加翻转动画**

在 `TabBar.vue` 的 `word-count` 和 `line-count` 的 `<span>` 上添加 class：

```html
<span class="word-count">
  <span class="stat-value" :key="wordCount">{{ wordCount }}</span> 字
</span>
<span class="line-count">
  <span class="stat-value" :key="lineCount">{{ lineCount }}</span> 行
</span>
```

在 style 中添加：

```scss
.stat-value {
  display: inline-block;
  animation: digit-flip 0.3s ease;
}
```

---

## Task 5: PreviewPanel 动效

**Files:**

- Modify: `src/components/PreviewPanel.vue:114-459` (style 部分)
- Modify: `src/components/PreviewPanel.vue:38-112` (script 部分)

- [ ] **Step 1: 修改 .toc-link.is-active 高亮样式**

替换 `.toc-link.is-active` 块：

```scss
&.is-active {
  background: rgba(99, 102, 241, 0.12);
  color: $color-primary;
  font-weight: 600;
  border-left: 2px solid $color-primary;
  padding-left: 6px;
}
```

- [ ] **Step 2: 修改链接霓虹填充效果**

替换 `.markdown-body :deep(a)` 块：

```scss
:deep(a) {
  position: relative;
  color: $color-primary;
  text-decoration: none;
  border-bottom: none;
  transition: color $transition-fast;

  &::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 0;
    height: 1px;
    background: linear-gradient(90deg, #6366f1, #22d3ee);
    transition: width 0.3s ease;
  }

  &:hover {
    color: $color-primary-dark;
    border-bottom: none;

    &::after {
      width: 100%;
    }
  }
}
```

- [ ] **Step 3: 添加标题滑入动画**

在 `.markdown-body` 样式后添加：

```scss
:deep(h1),
:deep(h2),
:deep(h3) {
  opacity: 0;
  transform: translateX(-10px);
  animation: heading-enter 0.4s ease forwards;
}

:deep(h1) {
  animation-delay: 0.05s;
}
:deep(h2) {
  animation-delay: 0.1s;
}
:deep(h3) {
  animation-delay: 0.15s;
}
```

- [ ] **Step 4: 添加代码块打字机效果**

在 script 中添加 typewriter 函数：

```typescript
function typewriterCodeBlocks() {
  nextTick(() => {
    if (!markdownRef.value) return
    const codeBlocks = markdownRef.value.querySelectorAll('pre code')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (
            entry.isIntersecting &&
            !entry.target.classList.contains('typed')
          ) {
            entry.target.classList.add('typed')
            typewriterEffect(entry.target as HTMLElement)
          }
        })
      },
      { threshold: 0.5 }
    )

    codeBlocks.forEach((block) => observer.observe(block))
  })
}

function typewriterEffect(el: HTMLElement) {
  const code = el.textContent || ''
  el.textContent = ''
  el.style.visibility = 'visible'
  let i = 0
  const interval = setInterval(() => {
    el.textContent += code[i]
    i++
    if (i >= code.length) clearInterval(interval)
  }, 8)
}

// Call typewriterCodeBlocks in watch
watch(
  renderedContent,
  () => {
    nextTick(() => {
      if (!markdownRef.value) return
      const allHeadings = markdownRef.value.querySelectorAll('h1,h2,h3,h4')
      const seen = new Map<string, number>()
      allHeadings.forEach((el) => {
        const text = el.textContent?.trim() || ''
        const baseId = text
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w\u4e00-\u9fff-]/g, '')
        const count = seen.get(baseId) || 0
        seen.set(baseId, count + 1)
        const id = count === 0 ? baseId : `${baseId}-${count}`
        ;(el as HTMLElement).dataset.headingId = id
      })
      // Trigger typewriter after headings processed
      typewriterCodeBlocks()
    })
  },
  { immediate: true }
)
```

- [ ] **Step 5: 添加 .typed 样式防止重复打字**

在 style 末尾添加：

```scss
:deep(pre code.typed) {
  // prevent re-animation
}
```

---

## Task 6: 彩蛋样式文件

**Files:**

- Create: `src/styles/easter-eggs.scss`

- [ ] **Step 1: 创建 easter-eggs.scss**

```scss
// Matrix Rain
#matrix-rain {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  pointer-events: none;
  background: rgba(0, 0, 0, 0.85);
}

// AI Pulse Ripple
.ai-pulse-ripple {
  position: fixed;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: transparent;
  border: 2px solid rgba(34, 211, 238, 0.8);
  transform: translate(-50%, -50%);
  animation: pulse-ripple 1s ease-out forwards;
  pointer-events: none;
  z-index: 9999;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid rgba(99, 102, 241, 0.6);
    transform: translate(-50%, -50%);
    animation: pulse-ripple 1s ease-out 0.2s forwards;
  }
}

@keyframes pulse-ripple {
  0% {
    width: 10px;
    height: 10px;
    opacity: 1;
  }
  100% {
    width: 100vmax;
    height: 100vmax;
    opacity: 0;
  }
}

// Rainbow Flash
.rainbow-flash {
  animation: rainbow-flash 0.6s ease;
}

@keyframes rainbow-flash {
  0%,
  100% {
    background-color: transparent;
  }
  16% {
    background-color: rgba(239, 68, 68, 0.5);
    color: #ef4444;
  }
  33% {
    background-color: rgba(245, 158, 11, 0.5);
    color: #f59e0b;
  }
  50% {
    background-color: rgba(16, 185, 129, 0.5);
    color: #10b981;
  }
  66% {
    background-color: rgba(34, 211, 238, 0.5);
    color: #22d3ee;
  }
  83% {
    background-color: rgba(139, 92, 246, 0.5);
    color: #8b5cf6;
  }
}

// Dev Mode Matrix Background
.dev-mode-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9998;
  pointer-events: none;
  background: rgba(0, 0, 0, 0.9);
  overflow: hidden;
}
```

---

## Task 7: 彩蛋逻辑

**Files:**

- Create: `src/utils/easter-eggs.ts`
- Modify: `src/App.vue`

- [ ] **Step 1: 创建 easter-eggs.ts**

```typescript
// Easter egg utilities

let logoClickCount = 0
let logoClickTimer: ReturnType<typeof setTimeout> | null = null
let devModeStartTime = 0
let devModeKeys: string[] = []

export function setupEasterEggs() {
  setupMatrixRainEasterEgg()
  setupAIPulseEasterEgg()
  setupRainbowHack()
  setupDevMode()
}

// ── Matrix Rain ───────────────────────────────────────────────
// Triggered by 5 rapid clicks on the logo
export function handleLogoClick() {
  logoClickCount++
  if (logoClickTimer) clearTimeout(logoClickTimer)
  logoClickTimer = setTimeout(() => {
    logoClickCount = 0
  }, 500)

  if (logoClickCount >= 5) {
    logoClickCount = 0
    triggerMatrixRain()
  }
}

function triggerMatrixRain() {
  const canvas = document.createElement('canvas')
  canvas.id = 'matrix-rain'
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')!
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*(){}[]|\\/<>?'.split('')
  const columns = Math.floor(canvas.width / 16)
  const drops: number[] = Array(columns).fill(1)

  function drawMatrix() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#10b981'
    ctx.font = '14px monospace'

    for (let i = 0; i < drops.length; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)]
      ctx.fillText(char, i * 16, drops[i] * 16)
      if (drops[i] * 16 > canvas.height && Math.random() > 0.975) {
        drops[i] = 0
      }
      drops[i]++
    }
  }

  const interval = setInterval(drawMatrix, 50)
  setTimeout(() => {
    clearInterval(interval)
    canvas.remove()
  }, 5000)
}

// ── AI Pulse ───────────────────────────────────────────────────
// Triggered by typing "@ai " in the editor
export function handleEditorInput(content: string) {
  if (/@ai\s+$/.test(content)) {
    triggerAIPulse()
  }
}

function triggerAIPulse() {
  const ripple = document.createElement('div')
  ripple.className = 'ai-pulse-ripple'
  document.body.appendChild(ripple)
  setTimeout(() => ripple.remove(), 1000)
}

// ── Rainbow Hack ───────────────────────────────────────────────
// Triggered by double-clicking a selection
export function handleSelectionDoubleClick(selection: Selection) {
  if (selection && !selection.isCollapsed) {
    triggerRainbowHack(selection)
  }
}

function triggerRainbowHack(selection: Selection) {
  const range = selection.getRangeAt(0)
  const span = document.createElement('span')
  span.className = 'rainbow-flash'
  span.appendChild(range.extractContents())
  range.insertNode(span)
  setTimeout(() => span.remove(), 600)
}

// ── Dev Mode ──────────────────────────────────────────────────
// Triggered by Ctrl+Shift+D within 5 seconds
export function handleKeyDown(e: KeyboardEvent) {
  const key = `${e.ctrlKey ? 'Ctrl+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.key}`

  if (devModeKeys.length === 0) {
    devModeStartTime = Date.now()
  } else if (Date.now() - devModeStartTime > 5000) {
    devModeKeys = []
    devModeStartTime = Date.now()
  }

  devModeKeys.push(key)
  devModeKeys = devModeKeys.slice(-3)

  if (devModeKeys.join('+').includes('Ctrl+Shift+D')) {
    devModeKeys = []
    triggerDevMode()
  }
}

function triggerDevMode() {
  const bg = document.createElement('div')
  bg.className = 'dev-mode-bg'
  document.body.appendChild(bg)

  const chars = '01'.split('')
  const width = window.innerWidth / 10
  const height = window.innerHeight / 20
  const drops: number[] = Array(Math.floor(width)).fill(1)

  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:absolute;top:0;left:0;'
  bg.appendChild(canvas)
  const ctx = canvas.getContext('2d')!
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  function draw() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#818cf8'
    ctx.font = '14px monospace'

    for (let i = 0; i < drops.length; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)]
      ctx.fillText(char, i * 10, drops[i] * 20)
      if (drops[i] * 20 > canvas.height && Math.random() > 0.975) {
        drops[i] = 0
      }
      drops[i]++
    }
  }

  const interval = setInterval(draw, 50)
  setTimeout(() => {
    clearInterval(interval)
    bg.remove()
  }, 3000)
}
```

- [ ] **Step 2: 在 App.vue 中集成彩蛋**

在 `<script setup>` 中添加：

```typescript
import { onMounted, onUnmounted } from 'vue'
import { setupEasterEggs, handleKeyDown } from '@/utils/easter-eggs'

onMounted(() => {
  setupEasterEggs()
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
```

- [ ] **Step 3: 在 App.vue 的 style 中引入彩蛋样式**

在 `<style>` 或 `<style scoped>` 之后添加（使用 `:global`）：

```scss
<style>
@import '@/styles/easter-eggs.scss';
</style>
```

- [ ] **Step 4: 在 App.vue 中处理编辑器的双击选中**

修改 `handleDrop` 附近添加：

```typescript
function setupSelectionHack() {
  document.addEventListener('dblclick', (e) => {
    const selection = window.getSelection()
    if (selection && !selection.isCollapsed) {
      const { handleSelectionDoubleClick } = require('@/utils/easter-eggs')
      handleSelectionDoubleClick(selection)
    }
  })
}
```

注意：由于 ESM 限制，建议在 `setupEasterEggs()` 中直接通过 `document.addEventListener('dblclick', ...)` 绑定双击事件。

- [ ] **Step 5: 修改 setupEasterEggs 内部添加双击监听**

在 `easter-eggs.ts` 的 `setupEasterEggs` 函数末尾添加：

```typescript
export function setupEasterEggs() {
  setupMatrixRainEasterEgg()
  setupAIPulseEasterEgg()
  setupRainbowHack()
  setupDevMode()

  // Global dblclick for rainbow hack
  document.addEventListener('dblclick', () => {
    const selection = window.getSelection()
    if (selection && !selection.isCollapsed) {
      triggerRainbowHack(selection)
    }
  })
}
```

---

## Task 8: App.vue 整体过渡

**Files:**

- Modify: `src/App.vue:1-47` (template 和 script)
- Modify: `src/App.vue` (style)

- [ ] **Step 1: 修改 template 中的 EditorView 包裹 transition**

替换现有 `<EditorView />` 为：

```html
<template>
  <div id="app" @dragover.prevent @drop.prevent="handleDrop">
    <transition name="panel-switch" mode="out-in">
      <EditorView :key="store.filePath || 'new'" />
    </transition>
  </div>
</template>
```

- [ ] **Step 2: 添加 transition 样式**

在 `<style>` 区域添加：

```scss
<style>
@import '@/styles/easter-eggs.scss';

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

// Panel switch transition
.panel-switch-enter-active,
.panel-switch-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.panel-switch-enter-from,
.panel-switch-leave-to {
  opacity: 0;
  transform: scale(0.98) translateY(4px);
}
</style>
```

- [ ] **Step 3: 修改 App.vue script 使用动态 key 触发过渡**

App.vue 已有 `store.filePath` 访问权限，`<EditorView :key="store.filePath || 'new'" />` 已可工作。

---

## Task 9: 验证和调试

**Files:**

- Modify: `src/styles/common.scss` — 添加全局粒子和开放文件动画

- [ ] **Step 1: 运行开发服务器验证**

```bash
cd LiteMD && npm run dev
```

检查点：

- [ ] Logo 呼吸脉冲是否可见
- [ ] 扫描线动画是否从左到右循环
- [ ] 编辑区光标是否发彩色光
- [ ] Tab 切换时滑块是否弹性跟随
- [ ] 保存按钮在未保存时是否脉冲

- [ ] **Step 2: 验证彩蛋**

- [ ] 快速点击 Logo 5次 → Matrix 雨效果
- [ ] 在编辑器输入 `@ai ` + 空格 → 蓝色脉冲波纹
- [ ] 选中文字后双击 → 彩虹闪烁
- [ ] 5秒内按 `Ctrl+Shift+D` → 紫色代码流背景

- [ ] **Step 3: 修复发现的问题**

根据实际效果调整 timing、颜色、强度。
