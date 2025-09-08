import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI & {
      listConversations: () => Promise<
        | {
            ok: true
            data: Array<{
              id: string
              title: string
              createdAt: number
              updatedAt: number
            }>
          }
        | { ok: false; error: string }
      >
      createConversation: (
        title?: string
      ) => Promise<
        | {
            ok: true
            data: {
              id: string
              title: string
              createdAt: number
              updatedAt: number
            }
          }
        | { ok: false; error: string }
      >
      deleteConversation: (
        id: string
      ) => Promise<{ ok: true } | { ok: false; error: string }>
      getConversationMessages: (
        id: string
      ) => Promise<
        | {
            ok: true
            data: {
              id: string
              messages: Array<{ id: string; role: string; text: string }>
            }
          }
        | { ok: false; error: string }
      >
      saveConversationMessages: (
        id: string,
        messages: Array<{ id: string; role: string; text: string }>
      ) => Promise<{ ok: true } | { ok: false; error: string }>
    }
    api: unknown
  }
}
