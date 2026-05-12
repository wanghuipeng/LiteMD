<template>
  <div class="tab-bar">
    <div class="tab-bar__inner">
      <button
        class="tab-item"
        :class="{ 'is-active': store.activeTab === 'edit' }"
        @click="store.setActiveTab('edit')"
      >
        <el-icon class="tab-icon"><Edit /></el-icon>
        <span>编辑</span>
      </button>

      <button
        class="tab-item"
        :class="{ 'is-active': store.activeTab === 'preview' }"
        @click="store.setActiveTab('preview')"
      >
        <el-icon class="tab-icon"><View /></el-icon>
        <span>预览</span>
      </button>
    </div>

    <!-- Trailing info: word count -->
    <div class="tab-bar__info">
      <span class="word-count">{{ wordCount }} 字</span>
      <span class="line-count">{{ lineCount }} 行</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { Edit, View } from '@element-plus/icons-vue'

const store = useEditorStore()

const wordCount = computed(() => {
  const text = store.content.trim()
  if (!text) return 0
  // Count CJK characters as 1 word each; split latin words by spaces
  const cjk = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uff00-\uffef]/g) || []).length
  const latin = text.replace(/[\u4e00-\u9fff\u3400-\u4dbf\uff00-\uffef]/g, ' ')
    .split(/\s+/).filter(Boolean).length
  return cjk + latin
})

const lineCount = computed(() => {
  if (!store.content) return 1
  return store.content.split('\n').length
})
</script>

<style scoped lang="scss">
@use '../styles/common.scss' as *;

.tab-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: $tabbar-height;
  background: $color-bg-tabbar;
  border-bottom: 1px solid $color-border;
  padding: 0 $spacing-md;
  flex-shrink: 0;

  &__inner {
    display: flex;
    align-items: center;
    gap: 2px;
    background: rgba(0, 0, 0, 0.05);
    border-radius: $radius-lg;
    padding: 3px;
  }

  &__info {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    font-size: 11px;
    color: $color-text-placeholder;
    font-family: $font-mono;
  }
}

// ── Tab item ────────────────────────────────────────────────
.tab-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 14px;
  border: none;
  background: transparent;
  border-radius: $radius-md;
  cursor: pointer;
  font-size: 12.5px;
  font-weight: 500;
  color: $color-text-secondary;
  font-family: $font-sans;
  transition: background $transition-fast, color $transition-fast, box-shadow $transition-fast;
  white-space: nowrap;

  .tab-icon {
    font-size: 13px;
  }

  &:hover:not(.is-active) {
    background: rgba(0, 0, 0, 0.05);
    color: $color-text-primary;
  }

  &.is-active {
    background: #ffffff;
    color: $color-primary;
    box-shadow: $shadow-sm;

    .tab-icon {
      color: $color-primary;
    }
  }
}

// ── Stat labels ─────────────────────────────────────────────
.word-count,
.line-count {
  display: inline-flex;
  align-items: center;
  gap: 3px;

  &::before {
    content: '';
    display: inline-block;
    width: 5px;
    height: 5px;
    border-radius: $radius-full;
    background: currentColor;
    opacity: 0.4;
  }
}
</style>
