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

/**
 * Setup menu event handlers with proper error handling
 */
function setupMenuHandlers(): void {
  window.electronAPI.onMenuNew(() => {
    store.newFile()
  })

  window.electronAPI.onFileOpened((file) => {
    store.setFile({ path: file.path, content: file.content })
  })

  window.electronAPI.onMenuOpen(async () => {
    store.setLoading(true)
    try {
      const result = await window.electronAPI.openFile()
      if (result.success && result.filePath && result.content !== undefined) {
        store.setFile({ path: result.filePath, content: result.content })
      } else if (result.error) {
        store.setError(result.error)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to open file'
      store.setError(message)
    } finally {
      store.setLoading(false)
    }
  })

  window.electronAPI.onMenuSave(async () => {
    store.setLoading(true)
    try {
      const result = await window.electronAPI.saveFile(store.filePath, store.content)
      if (result.success && result.filePath) {
        store.markSaved(result.filePath)
      } else if (result.error) {
        store.setError(result.error)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save file'
      store.setError(message)
    } finally {
      store.setLoading(false)
    }
  })

  window.electronAPI.onMenuSaveAs(async () => {
    store.setLoading(true)
    try {
      const result = await window.electronAPI.saveFile(null, store.content)
      if (result.success && result.filePath) {
        store.markSaved(result.filePath)
      } else if (result.error) {
        store.setError(result.error)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save file'
      store.setError(message)
    } finally {
      store.setLoading(false)
    }
  })
}

onMounted(() => {
  setupMenuHandlers()
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