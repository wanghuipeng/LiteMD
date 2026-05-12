import { contextBridge, ipcRenderer } from 'electron'
import { app } from 'electron'

export interface ElectronAPI {
  openFile: () => Promise<{ success: boolean; canceled?: boolean; filePath?: string; content?: string }>
  saveFile: (filePath: string | null, content: string, defaultFileName?: string) => Promise<{ success: boolean; canceled?: boolean; filePath?: string }>
  onMenuNew: (callback: () => void) => void
  onMenuOpen: (callback: () => void) => void
  onMenuSave: (callback: () => void) => void
  onMenuSaveAs: (callback: () => void) => void
  onFileOpened: (callback: (file: { path: string; content: string }) => void) => void
  getVersion: () => Promise<string>
  checkForUpdates: () => void
  onUpdateAvailable: (callback: (version: string) => void) => void
  onUpdateNotAvailable: (callback: () => void) => void
  onUpdateDownloaded: (callback: (version: string) => void) => void
  startDownload: (version: string, note: string) => void
}

const electronAPI: ElectronAPI = {
  openFile: () => ipcRenderer.invoke('file:open'),
  saveFile: (filePath, content, defaultFileName) => ipcRenderer.invoke('file:save', { filePath, content, defaultFileName }),
  onMenuNew: (callback) => ipcRenderer.on('menu:new', callback),
  onMenuOpen: (callback) => ipcRenderer.on('menu:open', callback),
  onMenuSave: (callback) => ipcRenderer.on('menu:save', callback),
  onMenuSaveAs: (callback) => ipcRenderer.on('menu:save-as', callback),
  onFileOpened: (callback) => ipcRenderer.on('file:opened', (_, file) => callback(file)),
  getVersion: () => Promise.resolve(app.getVersion()),
  checkForUpdates: () => ipcRenderer.send('check-for-updates'),
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (_, version) => callback(version)),
  onUpdateNotAvailable: (callback) => ipcRenderer.on('update-not-available', () => callback()),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (_, version) => callback(version)),
  startDownload: (version, note) => ipcRenderer.send('update:start-download', { version, note })
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
