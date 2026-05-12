<template>
  <div class="preview-panel">
    <!-- Search bar -->
    <SearchBar
      ref="searchBarRef"
      @close="handleSearchClose"
      @navigate="handleSearchNavigate"
    />

    <!-- Table of Contents sidebar (only when there are headings) -->
    <aside v-if="headings.length >= 2" class="toc-sidebar">
      <div class="toc-title">
        <el-icon><List /></el-icon>
        <span>目录</span>
      </div>
      <nav class="toc-nav">
        <el-tooltip
          v-for="h in headings"
          :key="h.id"
          :content="h.text"
          placement="left"
        >
          <a
            :href="`#${h.id}`"
            class="toc-link"
            :class="[`toc-level-${h.level}`, { 'is-active': activeHeading === h.id }]"
            @click.prevent="scrollToHeading(h.id)"
          >{{ h.text }}</a>
        </el-tooltip>
      </nav>
    </aside>

    <!-- Main content area -->
    <div class="preview-content" ref="contentRef" tabindex="-1" @scroll="updateActiveHeading" @keydown="handleKeydown">
      <div
        v-if="store.content.trim()"
        class="markdown-body"
        v-html="renderedContent"
        ref="markdownRef"
      />
      <div v-else class="empty-state">
        <div class="empty-icon">📄</div>
        <p class="empty-text">暂无内容</p>
        <p class="empty-hint">切换到「编辑」标签开始写作</p>
        <button class="jump-to-edit" @click="store.setActiveTab('edit')">
          前往编辑
        </button>
      </div>
    </div>

    <!-- Back to top button -->
    <transition name="back-top">
      <button
        v-if="showBackToTop"
        class="back-to-top"
        :class="{ 'is-launching': isLaunching }"
        @click="scrollToTop"
      >
        ↑
      </button>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { parseMarkdown } from '@/utils/markdown'
import { List } from '@element-plus/icons-vue'
import SearchBar from './SearchBar.vue'

const store = useEditorStore()
const contentRef = ref<HTMLDivElement | null>(null)
const markdownRef = ref<HTMLDivElement | null>(null)
const activeHeading = ref('')
const showBackToTop = ref(false)
const isLaunching = ref(false)
const searchBarRef = ref<InstanceType<typeof SearchBar> | null>(null)

const searchMatches = ref<{ start: number; end: number }[]>([])
const currentSearchIndex = ref(0)

const renderedContent = computed(() => parseMarkdown(store.content))

// Extract headings for TOC
interface Heading { id: string; text: string; level: number }
const headings = computed<Heading[]>(() => {
  const matches = [...store.content.matchAll(/^(#{1,4})\s+(.+)$/gm)]
  const seen = new Map<string, number>()
  return matches.map(m => {
    const level = m[1].length
    const text = m[2].trim()
    const baseId = text
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u4e00-\u9fff-]/g, '')
    const count = (seen.get(baseId) || 0)
    seen.set(baseId, count + 1)
    const id = count === 0 ? baseId : `${baseId}-${count}`
    return { id, text, level }
  })
})

// Scroll to heading
function scrollToHeading(id: string) {
  const el = contentRef.value?.querySelector(`[data-heading-id="${id}"]`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    activeHeading.value = id
  }
}

// Update active heading on scroll using IntersectionObserver-lite approach
function updateActiveHeading() {
  if (!contentRef.value) return
  // Show/hide back to top button
  showBackToTop.value = contentRef.value.scrollTop > 300
  const headingEls = contentRef.value.querySelectorAll('[data-heading-id]')
  const scrollTop = contentRef.value.scrollTop + 80
  let active = ''
  headingEls.forEach(el => {
    if ((el as HTMLElement).offsetTop <= scrollTop) {
      active = (el as HTMLElement).dataset.headingId || ''
    }
  })
  activeHeading.value = active
}

// Scroll to top with rocket launch animation
function scrollToTop() {
  if (!contentRef.value || isLaunching.value) return
  isLaunching.value = true
  contentRef.value.scrollTo({ top: 0, behavior: 'smooth' })
  setTimeout(() => {
    isLaunching.value = false
  }, 1000)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.ctrlKey && e.key === 'f') {
    e.preventDefault()
    searchBarRef.value?.show()
  }
}

// Search functionality
function handleSearchClose() {
  clearHighlights()
}

function handleSearchNavigate(keyword: string, matchIndex: number) {
  if (!keyword) {
    clearHighlights()
    searchBarRef.value?.updateMatchInfo(0, 0)
    return
  }

  const text = store.content
  const matches: { start: number; end: number }[] = []
  let pos = 0
  const lowerText = text.toLowerCase()
  const lowerKeyword = keyword.toLowerCase()

  while ((pos = lowerText.indexOf(lowerKeyword, pos)) !== -1) {
    matches.push({ start: pos, end: pos + keyword.length })
    pos += 1
  }

  searchMatches.value = matches

  if (matches.length === 0) {
    searchBarRef.value?.updateMatchInfo(0, 0)
    return
  }

  const targetIndex = matchIndex === -1 ? 0 : matchIndex
  currentSearchIndex.value = Math.min(targetIndex, matches.length - 1)

  scrollToSearchMatch(currentSearchIndex.value)
  searchBarRef.value?.updateMatchInfo(matches.length, currentSearchIndex.value)
}

function scrollToSearchMatch(index: number) {
  const matches = searchMatches.value
  if (!matches.length || index < 0 || index >= matches.length) return
  if (!markdownRef.value || !contentRef.value) return

  const match = matches[index]
  const plainText = store.content
  const beforeMatch = plainText.slice(0, match.start)
  const lineNumber = (beforeMatch.match(/\n/g) || []).length + 1

  // Calculate approximate position based on line number
  // Assuming average line height of 27px (from editor styles)
  const lineHeight = 27
  const topPosition = (lineNumber - 1) * lineHeight

  contentRef.value.scrollTo({
    top: Math.max(0, topPosition - 100),
    behavior: 'smooth'
  })
}

function clearHighlights() {
  searchMatches.value = []
  currentSearchIndex.value = 0
}

// Clear search when content changes externally
watch(() => store.content, () => {
  if (searchMatches.value.length > 0) {
    clearHighlights()
    searchBarRef.value?.hide()
  }
})

// After render, inject data-heading-id attributes on heading elements
watch(renderedContent, () => {
  nextTick(() => {
    if (!markdownRef.value) return
    const allHeadings = markdownRef.value.querySelectorAll('h1,h2,h3,h4')
    const seen = new Map<string, number>()
    allHeadings.forEach(el => {
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
  })
}, { immediate: true })
</script>

<style scoped lang="scss">
@use '../styles/common.scss' as *;

.preview-panel {
  display: flex;
  width: 100%;
  height: 100%;
  background: $color-bg-preview;
  overflow: hidden;
  position: relative;
}

// ── TOC Sidebar ─────────────────────────────────────────────
.toc-sidebar {
  flex-shrink: 0;
  width: 200px;
  height: 100%;
  overflow-y: auto;
  background: $color-bg-sidebar;
  border-right: 1px solid $color-border;
  padding: $spacing-lg $spacing-sm $spacing-lg $spacing-md;

  scrollbar-width: thin;
  scrollbar-color: $color-border transparent;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: $color-border-dark;
    border-radius: $radius-full;
  }
}

.toc-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: $color-text-placeholder;
  margin-bottom: $spacing-md;
  padding-left: 4px;
}

.toc-nav {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.toc-link {
  display: block;
  padding: 4px 8px;
  border-radius: $radius-sm;
  font-size: 12px;
  color: $color-text-secondary;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background $transition-fast, color $transition-fast;

  &:hover {
    background: $color-border-light;
    color: $color-text-primary;
  }

  &.is-active {
    background: $color-primary-alpha;
    color: $color-primary-dark;
    font-weight: 600;
  }

  &.toc-level-1 { font-weight: 600; font-size: 12.5px; }
  &.toc-level-2 { padding-left: 16px; }
  &.toc-level-3 { padding-left: 24px; font-size: 11.5px; }
  &.toc-level-4 { padding-left: 32px; font-size: 11px; }
}

// ── Main content ─────────────────────────────────────────────
.preview-content {
  flex: 1;
  height: 100%;
  overflow-y: auto;
  padding: $spacing-xl $spacing-2xl;
  overscroll-behavior: contain;

  scrollbar-width: thin;
  scrollbar-color: $color-border transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: $color-border-dark;
    border-radius: $radius-full;
  }
}

// ── Empty state ──────────────────────────────────────────────
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60%;
  gap: $spacing-sm;
  color: $color-text-placeholder;

  .empty-icon {
    font-size: 48px;
    opacity: 0.4;
    margin-bottom: $spacing-sm;
  }

  .empty-text {
    font-size: 15px;
    font-weight: 500;
    color: $color-text-secondary;
  }

  .empty-hint {
    font-size: 13px;
  }

  .jump-to-edit {
    margin-top: $spacing-md;
    padding: 6px 16px;
    background: $color-primary;
    color: #fff;
    border: none;
    border-radius: $radius-md;
    font-size: 13px;
    cursor: pointer;
    transition: background $transition-fast;

    &:hover {
      background: $color-primary-dark;
    }
  }
}

// ── Markdown body ────────────────────────────────────────────
.markdown-body {
  max-width: 760px;
  margin: 0 auto;
  font-family: $font-sans;
  font-size: 15px;
  line-height: 1.8;
  color: $color-text-primary;
  word-break: break-word;

  // ── Headings
  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4),
  :deep(h5),
  :deep(h6) {
    font-weight: 700;
    line-height: 1.3;
    margin-top: 2em;
    margin-bottom: 0.6em;
    scroll-margin-top: 80px;
  }

  :deep(h1) {
    font-size: 2em;
    letter-spacing: -0.02em;
    color: $color-text-primary;
    padding-bottom: 0.35em;
    border-bottom: 2px solid $color-border;
    margin-top: 0;
  }

  :deep(h2) {
    font-size: 1.5em;
    letter-spacing: -0.015em;
    padding-bottom: 0.25em;
    border-bottom: 1px solid $color-border;
    margin-top: 2em;
  }

  :deep(h3) { font-size: 1.2em; }
  :deep(h4) { font-size: 1.05em; }

  // ── Paragraphs
  :deep(p) {
    margin: 0 0 1em;
  }

  // ── Emphasis
  :deep(strong) {
    font-weight: 700;
    color: #070e1a;
  }

  :deep(em) {
    font-style: italic;
    color: $color-text-secondary;
  }

  // ── Links
  :deep(a) {
    color: $color-primary;
    text-decoration: none;
    border-bottom: 1px solid rgba(99, 102, 241, 0.3);
    transition: border-color $transition-fast, color $transition-fast;

    &:hover {
      color: $color-primary-dark;
      border-bottom-color: $color-primary;
    }
  }

  // ── Blockquote
  :deep(blockquote) {
    margin: 1.2em 0;
    padding: 0.8em 1.2em;
    border-left: 4px solid $color-primary-light;
    background: rgba(99, 102, 241, 0.04);
    border-radius: 0 $radius-md $radius-md 0;
    color: $color-text-secondary;

    p { margin: 0; }
  }

  // ── Lists
  :deep(ul),
  :deep(ol) {
    padding-left: 1.8em;
    margin: 0 0 1em;

    li {
      margin-bottom: 0.25em;
    }
  }

  :deep(ul li::marker) {
    color: $color-primary-light;
  }

  :deep(ol li::marker) {
    color: $color-primary;
    font-weight: 600;
  }

  // ── Inline code
  :deep(code) {
    font-family: $font-mono;
    font-size: 0.88em;
    background: rgba(99, 102, 241, 0.08);
    color: #c026d3;
    padding: 0.15em 0.45em;
    border-radius: $radius-sm;
    border: 1px solid rgba(99, 102, 241, 0.12);
  }

  // ── Code block
  :deep(pre) {
    margin: 1.2em 0;
    padding: 0;
    border-radius: $radius-lg;
    overflow: hidden;
    box-shadow: $shadow-sm;
    border: 1px solid $color-border;

    // "header" bar using pseudo
    position: relative;

    &::before {
      content: '';
      display: block;
      height: 36px;
      background: #1e1e2e;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    code {
      display: block;
      background: #1e1e2e;
      color: #cdd6f4;
      padding: 0 $spacing-lg $spacing-lg;
      font-size: 13.5px;
      line-height: 1.65;
      overflow-x: auto;
      border: none;

      // scrollbar inside code
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 255, 255, 0.12) transparent;

      &::-webkit-scrollbar { height: 4px; }
      &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.15);
        border-radius: $radius-full;
      }
    }
  }

  // ── Horizontal rule
  :deep(hr) {
    border: none;
    border-top: 2px solid $color-border;
    margin: 2em 0;
  }

  // ── Images
  :deep(img) {
    max-width: 100%;
    border-radius: $radius-md;
    box-shadow: $shadow-md;
    display: block;
    margin: 1em auto;
  }

  // ── Tables
  :deep(table) {
    border-collapse: collapse;
    width: 100%;
    margin: 1.2em 0;
    font-size: 14px;
    border-radius: $radius-md;
    overflow: hidden;
    box-shadow: $shadow-xs;
    border: 1px solid $color-border;

    th,
    td {
      padding: 9px 14px;
      text-align: left;
      border-bottom: 1px solid $color-border;
    }

    th {
      background: $color-bg-tabbar;
      font-weight: 600;
      font-size: 12.5px;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      color: $color-text-secondary;
    }

    tr:last-child td {
      border-bottom: none;
    }

    tr:hover td {
      background: rgba(99, 102, 241, 0.03);
    }
  }

  // ── Task list
  :deep(input[type='checkbox']) {
    accent-color: $color-primary;
    margin-right: 6px;
    cursor: pointer;
  }
}

// ── Back to top button ────────────────────────────────────────
.back-to-top {
  position: absolute;
  right: 24px;
  bottom: 24px;
  width: 48px;
  height: 48px;
  background: $color-primary;
  border: none;
  border-radius: 50%;
  font-size: 24px;
  color: #fff;
  cursor: pointer;
  box-shadow: $shadow-md;
  transition: transform 0.2s, opacity 0.2s;
  z-index: 10;

  &:hover {
    transform: scale(1.1);
  }

  &.is-launching {
    animation: arrow-bounce 0.6s ease-out forwards;
  }
}

@keyframes arrow-bounce {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  30% {
    transform: translateY(-30px);
    opacity: 1;
  }
  50% {
    transform: translateY(-10px);
    opacity: 1;
  }
  70% {
    transform: translateY(-20px);
    opacity: 0.5;
  }
  100% {
    transform: translateY(-60px);
    opacity: 0;
  }
}

// Back to top transition
.back-top-enter-active,
.back-top-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.back-top-enter-from,
.back-top-leave-to {
  opacity: 0;
  transform: scale(0.5) translateY(20px);
}
</style>
