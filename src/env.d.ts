/// <reference types="vite/client" />

import type { ElectronAPI } from './types/electron'

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const component: DefineComponent<object, object, any>
  export default component
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
