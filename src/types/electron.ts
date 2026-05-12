// Electron API types for IPC communication

export interface FileOpenResult {
  success: boolean
  canceled?: boolean
  filePath?: string
  content?: string
  error?: string
}

export interface FileSaveResult {
  success: boolean
  canceled?: boolean
  filePath?: string
  error?: string
}

export interface ElectronAPI {
  openFile: () => Promise<FileOpenResult>
  saveFile: (filePath: string | null, content: string, defaultFileName?: string) => Promise<FileSaveResult>
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

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
