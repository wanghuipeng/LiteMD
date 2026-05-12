<template>
  <div class="editor-panel" :class="{ 'is-focused': isFocused }">
    <!-- Search bar -->
    <SearchBar
      ref="searchBarRef"
      @close="handleSearchClose"
      @navigate="handleSearchNavigate"
    />

    <!-- Line gutter -->
    <div class="line-gutter" ref="gutterRef" aria-hidden="true">
      <div
        v-for="n in lineNumbers"
        :key="n"
        class="line-number"
        :class="{ 'is-current': n === currentLine }"
      >{{ n }}</div>
    </div>

    <!-- Textarea -->
    <textarea
      ref="textareaRef"
      v-model="localContent"
      class="editor-textarea"
      placeholder="在此输入 Markdown 内容..."
      spellcheck="false"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      @input="handleInput"
      @scroll="syncScroll"
      @focus="isFocused = true"
      @blur="isFocused = false"
      @keydown="handleKeydown"
      @click="updateCurrentLine"
      @keyup="updateCurrentLine"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useEditorStore } from '@/stores/editor'
import SearchBar from './SearchBar.vue'

const store = useEditorStore()

const localContent = ref(store.content)
const isFocused = ref(false)
const currentLine = ref(1)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const gutterRef = ref<HTMLDivElement | null>(null)
const searchBarRef = ref<InstanceType<typeof SearchBar> | null>(null)

const searchMatches = ref<{ start: number; end: number }[]>([])
const currentSearchIndex = ref(0)

// Keep localContent in sync with store (e.g. open file)
watch(() => store.content, (newContent) => {
  if (newContent !== localContent.value) {
    localContent.value = newContent
    nextTick(updateCurrentLine)
  }
  // Clear search when content changes externally
  if (searchMatches.value.length > 0) {
    clearHighlights()
    searchBarRef.value?.hide()
  }
})

const lineNumbers = computed(() => {
  const count = (localContent.value.match(/\n/g) || []).length + 1
  return Array.from({ length: Math.max(count, 1) }, (_, i) => i + 1)
})

function handleInput() {
  store.setContent(localContent.value)
  updateCurrentLine()
}

function syncScroll() {
  if (textareaRef.value && gutterRef.value) {
    gutterRef.value.scrollTop = textareaRef.value.scrollTop
  }
}

function updateCurrentLine() {
  if (!textareaRef.value) return
  const text = textareaRef.value.value
  const pos = textareaRef.value.selectionStart
  currentLine.value = (text.slice(0, pos).match(/\n/g) || []).length + 1
}

// Tab key: insert 2 spaces instead of focus-jumping
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Tab') {
    e.preventDefault()
    const ta = textareaRef.value!
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const spaces = '  '
    localContent.value =
      localContent.value.slice(0, start) + spaces + localContent.value.slice(end)
    store.setContent(localContent.value)
    nextTick(() => {
      ta.selectionStart = ta.selectionEnd = start + spaces.length
    })
  } else if (e.ctrlKey && e.key === 'f') {
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

  const text = localContent.value
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

  highlightAndScrollToMatch(currentSearchIndex.value)
  searchBarRef.value?.updateMatchInfo(matches.length, currentSearchIndex.value)
}

function highlightAndScrollToMatch(index: number) {
  const matches = searchMatches.value
  if (!matches.length || index < 0 || index >= matches.length) return

  const ta = textareaRef.value
  if (!ta) return

  const match = matches[index]
  ta.focus()
  ta.setSelectionRange(match.start, match.end)
}

function clearHighlights() {
  searchMatches.value = []
  currentSearchIndex.value = 0
}
</script>

<style scoped lang="scss">
@use '../styles/common.scss' as *;

.editor-panel {
  display: flex;
  width: 100%;
  height: 100%;
  background: $color-bg-editor;
  overflow: hidden;
  position: relative;
  transition: box-shadow $transition-base;

  // Focus ring on left edge
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
  }
}

// ── Line gutter ─────────────────────────────────────────────
.line-gutter {
  flex-shrink: 0;
  width: 52px;
  height: 100%;
  overflow: hidden;
  background: #f5f6f8;
  border-right: 1px solid $color-border-light;
  padding: 20px 0;
  // Gutter is scrolled programmatically — no scrollbar
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.line-number {
  display: block;
  height: 27px;           // line-height × font-size = 1.8 × 15px
  line-height: 27px;
  text-align: right;
  padding-right: 10px;
  font-size: 11.5px;
  font-family: $font-mono;
  color: $color-text-placeholder;
  transition: color $transition-fast;
  user-select: none;

  &.is-current {
    color: $color-primary;
    font-weight: 600;
  }
}

// ── Textarea ─────────────────────────────────────────────────
.editor-textarea {
  flex: 1;
  height: 100%;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  padding: 20px 28px 20px 16px;

  font-family: $font-mono;
  font-size: 14.5px;
  line-height: 27px;    // keep in sync with .line-number height
  color: $color-text-primary;
  caret-color: $color-primary;

  // Smooth scrollbar
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: $color-border transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: $color-border-dark;
    border-radius: $radius-full;
  }

  &::placeholder {
    color: $color-text-placeholder;
    font-style: italic;
  }

  // Selection
  &::selection {
    background: $color-primary-alpha;
  }
}
</style>
