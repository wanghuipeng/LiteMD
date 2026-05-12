import {
  app,
  BrowserWindow,
  Menu,
  MenuItemConstructorOptions,
  dialog,
  ipcMain
} from 'electron'
import { join } from 'path'
import { readFile } from 'fs/promises'
import { setupIpcHandlers } from './ipc'
import { autoUpdater } from 'electron-updater'

const UPDATE_CONFIG_URL =
  'https://XXXXXXXXXXXXXXX/LiteMD/release/updateConfig.json'
const UPDATE_BASE_URL =
  'https://XXXXXXXXXXXXXXX/LiteMD/release/'

let mainWindow: BrowserWindow | null = null

/**
 * Handle file opened from command line or file association
 */
async function handleFileOpen(filePath: string) {
  if (!filePath || mainWindow === null) return

  try {
    const content = await readFile(filePath, 'utf-8')
    // Ensure renderer process is ready before sending
    if (mainWindow.webContents.isLoading()) {
      mainWindow.webContents.once('did-finish-load', () => {
        mainWindow?.webContents.send('file:opened', { path: filePath, content })
      })
    } else {
      mainWindow.webContents.send('file:opened', { path: filePath, content })
    }
  } catch (error) {
    console.error('Failed to read file:', error)
  }
}

/**
 * Configure auto updater
 */
// Store the update note from config
let pendingUpdateNote = ''

function setupAutoUpdater() {
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true
  // Force enable update check in development mode
  autoUpdater.forceDevUpdateConfig = true

  autoUpdater.on('checking-for-update', () => {
    console.info('Checking for updates...')
  })

  autoUpdater.on('update-available', (info) => {
    console.info('Update available:', info.version)
    mainWindow?.webContents.send('update-available', info.version)
    // Show dialog with update note
    dialog
      .showMessageBox({
        type: 'info',
        title: `发现新版本 v${info.version}`,
        message: pendingUpdateNote || '有新的版本可用，是否立即下载？',
        buttons: ['下载', '稍后']
      })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.downloadUpdate()
        }
      })
  })

  autoUpdater.on('update-not-available', () => {
    console.info('No updates available')
    mainWindow?.webContents.send('update-not-available')
  })

  autoUpdater.on('download-progress', (progress) => {
    console.info(`Download progress: ${progress.percent.toFixed(1)}%`)
    mainWindow?.webContents.send('update-progress', progress.percent)
  })

  autoUpdater.on('update-downloaded', (info) => {
    console.info('Update downloaded:', info.version)
    mainWindow?.webContents.send('update-downloaded', info.version)
    dialog
      .showMessageBox({
        type: 'info',
        title: '下载完成',
        message: '更新已下载完成，将在退出时自动安装',
        buttons: ['立即重启', '稍后']
      })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.quitAndInstall()
        }
      })
  })

  autoUpdater.on('error', (err) => {
    console.error('Auto updater error:', err)
  })

  // IPC handler for manual update check
  ipcMain.on('check-for-updates', () => {
    checkForUpdates()
  })

  // IPC handler to start download with version and note
  ipcMain.on(
    'update:start-download',
    (_, { version, note }: { version: string; note: string }) => {
      autoUpdater.setFeedURL({
        provider: 'generic',
        url: UPDATE_BASE_URL
      })
      dialog
        .showMessageBox({
          type: 'info',
          title: `发现新版本 v${version}`,
          message: note || '有新的版本可用，是否立即下载？',
          buttons: ['下载', '稍后']
        })
        .then(async ({ response }) => {
          if (response === 0) {
            // Must check for updates first before downloading
            try {
              await autoUpdater.checkForUpdates()
              autoUpdater.downloadUpdate()
            } catch (error) {
              console.error(
                'Failed to check for updates before download:',
                error
              )
            }
          }
        })
    }
  )
}

/**
 * Check for updates from remote config
 */
async function checkForUpdates() {
  try {
    const response = await fetch(UPDATE_CONFIG_URL)
    if (!response.ok) {
      console.info('Cannot fetch update config, skipping update check')
      return
    }
    const config = await response.json()
    const latestVersion = config.version
    pendingUpdateNote = config.note || ''

    if (latestVersion && latestVersion > app.getVersion()) {
      autoUpdater.setFeedURL({
        provider: 'generic',
        url: UPDATE_BASE_URL
      })
      await autoUpdater.checkForUpdates()
    } else {
      mainWindow?.webContents.send('update-not-available')
    }
  } catch (error) {
    console.error('Failed to check for updates:', error)
  }
}

/**
 * Creates the main application window with error handling
 */
function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Hide application menu since we have custom toolbar buttons
  Menu.setApplicationMenu(null)

  // Load the page
  if (process.env.ELECTRON_RENDERER_URL) {
    window.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Open DevTools with F12 in development mode
  if (process.env.ELECTRON_RENDERER_URL) {
    window.webContents.on('did-finish-load', () => {
      window.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F12') {
          event.preventDefault()
          if (window.webContents.isDevToolsOpened()) {
            window.webContents.closeDevTools()
          } else {
            window.webContents.openDevTools()
          }
        }
      })
    })
  }

  // Handle window errors
  window.webContents.on('render-process-gone', (_, details) => {
    console.error('Renderer process gone:', details.reason)
  })

  window.webContents.on('unresponsive', () => {
    console.warn('Window became unresponsive')
  })

  window.webContents.on('responsive', () => {
    console.info('Window became responsive again')
  })

  return window
}

/**
 * Global exception handler for uncaught exceptions
 */
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error)
  app.exit(1)
})

/**
 * Global handler for unhandled promise rejections
 */
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason)
})

// Handle file association - Windows
app.on('second-instance', (_, commandLine) => {
  // Someone tried to run a second instance, focus the window and handle the file
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()

    // Check if a file path was passed
    const filePath = commandLine.find(
      (arg) => arg.endsWith('.md') || arg.endsWith('.markdown')
    )
    if (filePath) {
      handleFileOpen(filePath)
    }
  }
})

app.whenReady().then(() => {
  try {
    setupIpcHandlers()
    setupAutoUpdater()
    mainWindow = createWindow()

    // Check for updates after startup (skip in dev mode for stability)
    if (!process.env.ELECTRON_RENDERER_URL) {
      setTimeout(() => {
        checkForUpdates()
      }, 3000)
    }

    // Handle file passed via command line
    const filePath = process.argv.find(
      (arg) => arg.endsWith('.md') || arg.endsWith('.markdown')
    )
    if (filePath) {
      setTimeout(() => handleFileOpen(filePath), 500)
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createWindow()
      }
    })
  } catch (error) {
    console.error('Failed to initialize application:', error)
    app.exit(1)
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
