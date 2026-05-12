import { ipcMain, dialog } from 'electron'
import { readFile, writeFile } from 'fs/promises'

export interface FileSaveParams {
  filePath: string | null
  content: string
  defaultFileName?: string
}

export function setupIpcHandlers(): void {
  // Open file handler
  ipcMain.handle('file:open', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }]
      })

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, canceled: true }
      }

      const filePath = result.filePaths[0]
      const content = await readFile(filePath, 'utf-8')
      return { success: true, filePath, content }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Failed to open file:', errorMessage)
      return { success: false, error: errorMessage }
    }
  })

  // Save file handler
  ipcMain.handle('file:save', async (_, { filePath, content, defaultFileName }: FileSaveParams) => {
    try {
      if (!filePath) {
        // Save as - show dialog first
        const result = await dialog.showSaveDialog({
          filters: [{ name: 'Markdown', extensions: ['md'] }],
          defaultPath: defaultFileName || '未命名.md'
        })
        if (result.canceled || !result.filePath) {
          return { success: false, canceled: true }
        }
        filePath = result.filePath
      }

      await writeFile(filePath, content, 'utf-8')
      return { success: true, filePath }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Failed to save file:', errorMessage)
      return { success: false, error: errorMessage }
    }
  })
}
