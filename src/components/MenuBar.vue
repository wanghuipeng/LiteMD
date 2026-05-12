<template>
  <div class="menu-bar">
    <!-- Brand -->
    <div class="menu-bar__brand">
      <span class="brand-logo">✦</span>
      <span class="brand-name">MarkEdit</span>
    </div>

    <!-- File info (center) -->
    <div class="menu-bar__file" :class="{ 'is-dirty': store.isDirty }">
      <el-icon class="file-icon"><Document /></el-icon>
      <span class="file-name">{{ store.fileName }}</span>
      <span v-if="store.isDirty" class="dirty-badge" title="未保存的更改" />
    </div>

    <!-- Actions (right) -->
    <div class="menu-bar__actions">
      <el-tooltip
        content="新建文件 (Ctrl+N)"
        placement="bottom"
        :show-after="500"
      >
        <button class="action-btn" @click="handleNew" aria-label="新建">
          <el-icon><Plus /></el-icon>
        </button>
      </el-tooltip>

      <el-tooltip
        content="打开文件 (Ctrl+O)"
        placement="bottom"
        :show-after="500"
      >
        <button class="action-btn" @click="handleOpen" aria-label="打开">
          <el-icon><Document /></el-icon>
        </button>
      </el-tooltip>

      <div class="divider" />

      <el-tooltip
        content="保存文件 (Ctrl+S)"
        placement="bottom"
        :show-after="500"
      >
        <button
          class="action-btn action-btn--save"
          :class="{ 'is-active': store.isDirty }"
          @click="handleSave"
          aria-label="保存"
        >
          <el-icon><Folder /></el-icon>
        </button>
      </el-tooltip>

      <el-tooltip
        content="另存为 (Ctrl+Shift+S)"
        placement="bottom"
        :show-after="500"
      >
        <button class="action-btn" @click="handleSaveAs" aria-label="另存为">
          <el-icon><CopyDocument /></el-icon>
        </button>
      </el-tooltip>

      <div class="divider" />

      <!-- Version indicator -->
      <el-tooltip
        :content="
          updateAvailable ? '发现新版本，点击更新' : `当前版本 v${version}`
        "
        placement="bottom"
      >
        <button
          class="version-btn"
          :class="{ 'has-update': updateAvailable }"
          @click="handleUpdate"
        >
          <span class="version-text">v{{ version }}</span>
          <span v-if="updateAvailable" class="update-dot" />
        </button>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { Plus, Document, Folder, CopyDocument } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import '@/types/electron'

const store = useEditorStore()
const version = ref('1.0.0')
const updateAvailable = ref(false)
const UPDATE_CONFIG_URL =
  'https://XXXXXXXXXXXXXXX/LiteMD/release/updateConfig.json'

// Compare two semantic versions, returns true if v1 > v2
function isNewerVersion(v1: string, v2: string): boolean {
  const parts1 = v1.split('.').map(Number)
  const parts2 = v2.split('.').map(Number)
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0
    const p2 = parts2[i] || 0
    if (p1 > p2) return true
    if (p1 < p2) return false
  }
  return false
}

// Check for updates from remote
async function checkRemoteVersion() {
  try {
    const response = await fetch(UPDATE_CONFIG_URL)
    if (!response.ok) return
    const config = await response.json()
    const latestVersion = config.version
    if (latestVersion && isNewerVersion(latestVersion, version.value)) {
      version.value = latestVersion
      updateAvailable.value = true
    }
  } catch (e) {
    console.error('Failed to check remote version:', e)
  }
}

onMounted(async () => {
  // Wait for electronAPI to be ready (max 5 seconds)
  const waitForElectronAPI = () => {
    return new Promise<void>((resolve) => {
      let elapsed = 0
      const check = () => {
        if (typeof window.electronAPI !== 'undefined') {
          resolve()
        } else if (elapsed >= 5000) {
          console.warn('electronAPI not ready, using default version')
          resolve()
        } else {
          elapsed += 100
          setTimeout(check, 100)
        }
      }
      check()
    })
  }

  await waitForElectronAPI()

  try {
    // Get current version

    // Check remote version on mount
    await checkRemoteVersion()

    // Listen for update available
    window.electronAPI?.onUpdateAvailable?.((newVersion: string) => {
      updateAvailable.value = true
      console.log('最新远程版本:', newVersion)
    })

    // Listen for no update available
    window.electronAPI?.onUpdateNotAvailable?.(() => {
      updateAvailable.value = false
      ElMessage.info('当前已是最新版本')
    })

    // Listen for update downloaded
    window.electronAPI?.onUpdateDownloaded?.((newVersion: string) => {
      version.value = newVersion
      updateAvailable.value = false
      ElMessage.success(`已更新到 v${newVersion}，请重启应用`)
    })

    // Listen for file opened from command line
    window.electronAPI?.onFileOpened?.(
      (file: { path: string; content: string }) => {
        store.setFile({ path: file.path, content: file.content })
      }
    )
  } catch (e) {
    console.error('Failed to initialize electron API:', e)
  }
})

async function handleUpdate() {
  try {
    const response = await fetch(UPDATE_CONFIG_URL)
    if (!response.ok) {
      ElMessage.error('检查更新失败')
      return
    }
    const config = await response.json()
    const latestVersion = config.version
    const note = config.note || ''

    console.log('最新远程版本:', latestVersion)
    console.log('当前版本:', version.value)
    console.log(
      1111,
      latestVersion && isNewerVersion(latestVersion, version.value)
    )

    if (latestVersion && isNewerVersion(latestVersion, version.value)) {
      window.electronAPI?.startDownload(latestVersion, note)
    } else {
      ElMessage.info('当前已是最新版本')
    }
  } catch (e) {
    console.error('Failed to check for updates:', e)
    ElMessage.error('检查更新失败')
  }
}

function handleNew() {
  store.newFile()
}

async function handleOpen() {
  const result = await window.electronAPI.openFile()
  if (result.success && result.filePath && result.content !== undefined) {
    store.setFile({ path: result.filePath, content: result.content })
  }
}

async function handleSave() {
  const result = await window.electronAPI.saveFile(
    store.filePath,
    store.content
  )
  if (result.success && result.filePath) {
    store.markSaved(result.filePath)
  }
}

async function handleSaveAs() {
  const result = await window.electronAPI.saveFile(
    null,
    store.content,
    store.fileName
  )
  if (result.success && result.filePath) {
    store.markSaved(result.filePath)
  }
}
</script>

<style scoped lang="scss">
@use '../styles/common.scss' as *;

.menu-bar {
  display: flex;
  align-items: center;
  height: $header-height;
  background: $color-bg-header;
  padding: 0 $spacing-md;
  gap: $spacing-md;
  flex-shrink: 0;
  // Electron drag region
  -webkit-app-region: drag;
  user-select: none;

  // Prevent drag on interactive elements
  button,
  .action-btn {
    -webkit-app-region: no-drag;
  }

  // ── Brand ──────────────────────────────────────────────────
  &__brand {
    display: flex;
    align-items: center;
    gap: 7px;
    flex-shrink: 0;

    .brand-logo {
      font-size: 17px;
      color: $color-primary-light;
      line-height: 1;
      filter: drop-shadow(0 0 5px rgba(129, 140, 248, 0.55));
    }

    .brand-name {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.05em;
      color: rgba(200, 204, 220, 0.7);
      font-family: $font-sans;
    }
  }

  // ── File info ──────────────────────────────────────────────
  &__file {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    min-width: 0;

    .file-icon {
      font-size: 13px;
      color: rgba(200, 204, 220, 0.45);
      flex-shrink: 0;
    }

    .file-name {
      font-size: 13px;
      font-weight: 500;
      color: rgba(248, 250, 252, 0.65);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 320px;
      font-family: $font-sans;
      transition: color $transition-fast;
    }

    .dirty-badge {
      width: 6px;
      height: 6px;
      border-radius: $radius-full;
      background: $color-warning;
      flex-shrink: 0;
      box-shadow: 0 0 4px rgba(245, 158, 11, 0.65);
    }

    &.is-dirty .file-name {
      color: rgba(248, 250, 252, 0.9);
    }
  }

  // ── Actions ────────────────────────────────────────────────
  &__actions {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
    -webkit-app-region: no-drag;
  }
}

// ── Action button ───────────────────────────────────────────
.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  border-radius: $radius-md;
  color: rgba(200, 204, 220, 0.55);
  cursor: pointer;
  transition:
    background $transition-fast,
    color $transition-fast;
  font-size: 14px;
  padding: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: $color-text-inverse;
  }

  &:active {
    background: rgba(255, 255, 255, 0.06);
    transform: scale(0.95);
  }

  &--save.is-active {
    color: $color-primary-light;

    &:hover {
      background: rgba(99, 102, 241, 0.18);
    }
  }
}

// ── Divider ─────────────────────────────────────────────────
.divider {
  width: 1px;
  height: 16px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 3px;
}

// ── Version button ──────────────────────────────────────────
.version-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  background: transparent;
  border-radius: $radius-sm;
  cursor: pointer;
  transition: background $transition-fast;
  position: relative;

  .version-text {
    font-size: 11px;
    font-family: $font-mono;
    color: rgba(200, 204, 220, 0.4);
  }

  .update-dot {
    width: 6px;
    height: 6px;
    border-radius: $radius-full;
    background: #ef4444;
    position: absolute;
    top: 3px;
    right: 3px;
    box-shadow: 0 0 4px rgba(239, 68, 68, 0.6);
  }

  &:hover {
    background: rgba(255, 255, 255, 0.08);

    .version-text {
      color: rgba(200, 204, 220, 0.7);
    }
  }

  &.has-update {
    .version-text {
      color: rgba(200, 204, 220, 0.6);
    }

    &:hover {
      background: rgba(239, 68, 68, 0.15);

      .version-text {
        color: #fca5a5;
      }
    }
  }
}
</style>
