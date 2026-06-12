/// <reference types="vite/client" />

import type { MelonApi } from '@shared/ipc'

declare global {
  interface Window {
    Melon?: MelonApi
  }
}

export {}
