import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type TabType = 'edit' | 'preview'

export interface FileInfo {
  path: string | null
  content: string
}

export const useEditorStore = defineStore('editor', () => {
  // State
  const content = ref('')
  const filePath = ref<string | null>(null)
  const isDirty = ref(false)
  const activeTab = ref<TabType>('edit')
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const fileName = computed(() => {
    if (filePath.value) {
      const parts = filePath.value.split(/[\\/]/)
      return parts[parts.length - 1]
    }
    return '未命名.md'
  })

  // Actions
  function setContent(newContent: string): void {
    content.value = newContent
    isDirty.value = true
    error.value = null
  }

  function setFile(file: FileInfo): void {
    filePath.value = file.path
    content.value = file.content
    isDirty.value = false
    error.value = null
  }

  function markSaved(path: string | null): void {
    filePath.value = path
    isDirty.value = false
    error.value = null
  }

  function newFile(): void {
    content.value = ''
    filePath.value = null
    isDirty.value = false
    activeTab.value = 'edit'
    error.value = null
  }

  function setActiveTab(tab: TabType): void {
    activeTab.value = tab
  }

  function setLoading(loading: boolean): void {
    isLoading.value = loading
  }

  function setError(message: string | null): void {
    error.value = message
  }

  return {
    // State
    content,
    filePath,
    isDirty,
    activeTab,
    isLoading,
    error,
    // Getters
    fileName,
    // Actions
    setContent,
    setFile,
    markSaved,
    newFile,
    setActiveTab,
    setLoading,
    setError
  }
})
