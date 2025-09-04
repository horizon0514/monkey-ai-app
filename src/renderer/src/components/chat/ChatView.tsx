import React, { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@renderer/lib/utils'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText } from 'ai'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export const ChatView: React.FC = () => {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isSending, setIsSending] = useState(false)
  const [models, setModels] = useState<any[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [openrouter, setOpenrouter] = useState<
    ReturnType<typeof createOpenRouter> | null
  >(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      // setup client from settings
      const llm = await window.electron.getLlmSettings()
      const apiKey = llm?.openrouter?.apiKey || ''
      const baseURL = llm?.openrouter?.baseUrl || 'https://openrouter.ai/api/v1'
      // Use OpenRouter community provider
      setOpenrouter(
        createOpenRouter({
          apiKey,
          baseURL,
          headers: {
            'HTTP-Referer': 'chat-monkey',
            'X-Title': 'chat-monkey'
          }
        })
      )

      const res = await window.electron.fetchOpenRouterModels()
      if (!mounted) return
      if (res.ok) {
        setModels(res.models)
        const first = res.models?.[0]
        if (first?.id) setSelectedModel(first.id)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || !selectedModel) return
    setError(null)
    setIsSending(true)
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')

    try {
      if (!openrouter) {
        throw new Error('LLM 尚未初始化')
      }
      const conversation = messages
        .concat([{ id: 'temp', role: 'user', content: text }])
        .map(m => ({ role: m.role, content: m.content }))

      const result = await generateText({
        model: openrouter(selectedModel),
        messages: conversation as any
      })
      const reply: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.text
      }
      setMessages(prev => [...prev, reply])
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setIsSending(false)
    }
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
            onClick={() => setMessages([])}
            className='inline-flex h-8 items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-3 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground'
          >
            清空
          </button>
          {error && <div className='text-xs text-destructive'>错误：{error}</div>}
        </div>
      </div>

      <div className='flex-1 space-y-3 overflow-auto p-3'>
        {messages.map(msg => (
          <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn('max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm shadow-sm', msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}> 
              {msg.content}
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className='p-6 text-center text-sm text-muted-foreground'>开始与 AI 对话吧</div>
        )}
      </div>

      <div className='border-t border-border/40 p-2'>
        <div className='flex items-center gap-2'>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                handleSend()
              }
            }}
            placeholder='输入消息，按 Ctrl/⌘ + Enter 发送'
            rows={2}
            className='max-h-40 min-h-10 flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring'
          />
          <button
            onClick={handleSend}
            disabled={isSending}
            className='inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50'
          >
            发送
          </button>
        </div>
      </div>
    </div>
  )
}

