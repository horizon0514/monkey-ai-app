import React, { useEffect, useState } from 'react'
import { cn } from '@renderer/lib/utils'
import { useChat } from 'ai/react'

export const ChatView: React.FC = () => {
  const [models, setModels] = useState<Array<{ id?: string; name?: string }>>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [apiBase, setApiBase] = useState<string>('http://127.0.0.1:3399')
  const api = `${apiBase}/chat/stream`

  const {
    messages: chatMessages,
    input: chatInput,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop
  } = useChat({ api, streamMode: 'text', body: { model: selectedModel } })

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const base = await window.electron.getLocalApiBase()
      setApiBase(base)

      const res = await window.electron.fetchOpenRouterModels()
      if (!mounted) return
      if (res.ok) {
        const list = Array.isArray(res.models)
          ? (res.models as Array<{ id?: string; name?: string }> )
          : []
        setModels(list)
        const first = list?.[0]
        if (first && typeof first.id === 'string') setSelectedModel(first.id)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const handleSend = (e: React.FormEvent<HTMLFormElement>) => {
    if (!selectedModel) return
    setError(null)
    handleSubmit(e)
  }

  return (
    <div className='flex h-full flex-col'>
      <div className='flex items-center justify-between border-b border-border/40 p-2'>
        <div className='flex items-center gap-2'>
          <select
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value)}
            className='h-8 rounded-md border border-input bg-background px-2 text-sm'
          >
            {models.map((m: any) => (
              <option key={m.id} value={m.id}>
                {m.name || m.id}
              </option>
            ))}
          </select>
        </div>
        <div className='flex items-center gap-2'>
          <button
            onClick={() => window.location.reload()}
            className='inline-flex h-8 items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-3 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground'
          >
            清空
          </button>
          {error && <div className='text-xs text-destructive'>错误：{error}</div>}
        </div>
      </div>

      <div className='flex-1 space-y-3 overflow-auto p-3'>
        {chatMessages.map(msg => (
          <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn('max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm shadow-sm', msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
              {typeof msg.content === 'string' ? msg.content : (msg.content as any)}
            </div>
          </div>
        ))}
        {chatMessages.length === 0 && (
          <div className='p-6 text-center text-sm text-muted-foreground'>开始与 AI 对话吧</div>
        )}
      </div>

      <div className='border-t border-border/40 p-2'>
        <div className='flex items-center gap-2'>
          <form onSubmit={handleSend} className='flex flex-1 items-center gap-2'>
            <textarea
              value={chatInput}
              onChange={handleInputChange}
              onKeyDown={e => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault()
                  if (!selectedModel) return
                  setError(null)
                  handleSubmit(e as any)
                }
              }}
              placeholder='输入消息，按 Ctrl/⌘ + Enter 发送'
              rows={2}
              className='max-h-40 min-h-10 flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring'
            />
            <button
              type='submit'
              disabled={isLoading}
              className='inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50'
            >
              发送
            </button>
            {isLoading && (
              <button
                type='button'
                onClick={() => stop()}
                className='inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent'
              >
                停止
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

