import type { MelonAPI } from '../../../main/preload'

declare global {
  interface Window {
    Melon: MelonAPI
  }
}

export {}
