<template>
  <div class="search-bar" :class="{ 'is-visible': isVisible }">
    <div class="search-input-wrapper">
      <input
        ref="inputRef"
        v-model="searchKeyword"
        class="search-input"
        placeholder="搜索..."
        @keydown="handleKeydown"
        @input="handleSearch"
      />
      <span v-if="matchCount > 0" class="match-count">
        {{ currentMatch + 1 }}/{{ matchCount }}
      </span>
      <span v-else-if="searchKeyword" class="match-count no-match">无匹配</span>
    </div>
    <div class="search-actions">
      <button class="search-btn" @click="prevMatch" title="上一个 (Shift+Enter)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      </button>
      <button class="search-btn" @click="nextMatch" title="下一个 (Enter)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      <button class="search-btn close-btn" @click="close" title="关闭 (Esc)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'navigate', keyword: string, matchIndex: number): void
}>()

const isVisible = ref(false)
const searchKeyword = ref('')
const matchCount = ref(0)
const currentMatch = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)

function show() {
  isVisible.value = true
  nextTick(() => {
    inputRef.value?.focus()
    inputRef.value?.select()
  })
}

function hide() {
  isVisible.value = false
  searchKeyword.value = ''
  matchCount.value = 0
  currentMatch.value = 0
}

function close() {
  hide()
  emit('close')
}

function handleSearch() {
  emit('navigate', searchKeyword.value, -1) // -1 means find all matches
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.stopPropagation()
    if (e.shiftKey) {
      prevMatch()
    } else {
      nextMatch()
    }
  } else if (e.key === 'Escape') {
    close()
  }
}

function nextMatch() {
  if (matchCount.value > 0) {
    currentMatch.value = (currentMatch.value + 1) % matchCount.value
    emit('navigate', searchKeyword.value, currentMatch.value)
  }
}

function prevMatch() {
  if (matchCount.value > 0) {
    currentMatch.value = currentMatch.value === 0 ? matchCount.value - 1 : currentMatch.value - 1
    emit('navigate', searchKeyword.value, currentMatch.value)
  }
}

// Update match info from parent
function updateMatchInfo(count: number, current: number) {
  matchCount.value = count
  currentMatch.value = current
}

// Expose method for parent to trigger show
defineExpose({ show, hide, updateMatchInfo })
</script>

<style scoped lang="scss">
.search-bar {
  position: absolute;
  top: 12px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
  z-index: 100;
  opacity: 0;
  transform: translateY(-8px);
  pointer-events: none;
  transition: opacity 0.15s, transform 0.15s;

  &.is-visible {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-input {
  width: 200px;
  height: 28px;
  padding: 0 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s;

  &:focus {
    border-color: #409eff;
  }
}

.match-count {
  font-size: 12px;
  color: #666;
  white-space: nowrap;

  &.no-match {
    color: #f56c6c;
  }
}

.search-actions {
  display: flex;
  gap: 2px;
}

.search-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: #f5f5f5;
    color: #333;
  }

  &.close-btn:hover {
    background: #fef0f0;
    color: #f56c6c;
  }
}
</style>