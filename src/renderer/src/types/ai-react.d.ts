declare module 'ai/react' {
  export type ChatMessage = {
    id: string
    role: 'user' | 'assistant'
    content: unknown
  }

  export type UseChatOptions = {
    api: string
    streamMode?: 'text'
    body?: Record<string, unknown>
  }

  export function useChat(opts: UseChatOptions): {
    messages: ChatMessage[]
    input: string
    handleInputChange: (e: any) => void
    handleSubmit: (e: any) => void
    isLoading: boolean
    stop: () => void
    setInput: (v: string) => void
    setMessages: (msgs: ChatMessage[]) => void
  }
}

