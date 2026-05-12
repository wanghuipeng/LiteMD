<template>
  <div id="app" @dragover.prevent @drop.prevent="handleDrop">
    <EditorView />
  </div>
</template>

<script setup lang="ts">
import { useEditorStore } from '@/stores/editor'
import EditorView from './views/EditorView.vue'

const store = useEditorStore()

function handleDrop(e: DragEvent) {
  const files = e.dataTransfer?.files
  if (!files || files.length === 0) return

  const file = files[0]
  if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown')) {
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    store.setFile({
      path: (file as any).path || null,
      content: reader.result as string
    })
  }
  reader.readAsText(file)
}
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
