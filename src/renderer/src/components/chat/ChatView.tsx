import React, { useEffect, useState } from 'react'
import { cn } from '@renderer/lib/utils'
// Using local Hono backend instead of client-side provider to avoid environment issues

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export const ChatView: React.FC = () => {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isSending, setIsSending] = useState(false)
  const [models, setModels] = useState<Array<{ id?: string; name?: string }>>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [apiBase, setApiBase] = useState<string>('http://127.0.0.1:3399')
  const abortRef = React.useRef<AbortController | null>(null)

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

  const handleSend = async () => {
    const text = input.trim()
    if (!text || !selectedModel) return
    setError(null)
    setIsSending(true)
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')

    try {
      const conversation = messages
        .concat([{ id: 'temp', role: 'user', content: text }])
        .map(m => ({ role: m.role, content: m.content }))

      const controller = new AbortController()
      abortRef.current = controller
      const res = await fetch(`${apiBase}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/plain' },
        body: JSON.stringify({ model: selectedModel, messages: conversation }),
        signal: controller.signal
      })
      if (!res.ok || !res.body) {
        const textErr = await res.text().catch(() => '')
        throw new Error(textErr || `HTTP_${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      const replyId = crypto.randomUUID()
      setMessages(prev => [...prev, { id: replyId, role: 'assistant', content: '' }])
      let finished = false
      while (!finished) {
        const { value, done } = await reader.read()
        finished = Boolean(done)
        if (finished) break
        const chunk = decoder.decode(value)
        acc += chunk
        setMessages(prev =>
          prev.map(m => (m.id === replyId ? { ...m, content: acc } : m))
        )
      }
    } catch (e: any) {
      // Fallback to non-streaming endpoint
      try {
        const conversation = messages
          .concat([{ id: 'temp', role: 'user', content: text }])
          .map(m => ({ role: m.role, content: m.content }))
        const resp = await fetch(`${apiBase}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ model: selectedModel, messages: conversation })
        })
        const json = await resp.json().catch(() => null as any)
        if (resp.ok && json && json.ok && typeof json.text === 'string') {
          const replyId = crypto.randomUUID()
          setMessages(prev => [...prev, { id: replyId, role: 'assistant', content: json.text as string }])
        } else {
          throw new Error(String(json?.error || `HTTP_${resp.status}`))
        }
      } catch (e2: any) {
        setError(String(e2?.message || e2 || 'Failed to fetch'))
      }
    } finally {
      setIsSending(false)
      abortRef.current = null
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
          {isSending && (
            <button
              onClick={() => abortRef.current?.abort()}
              className='inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent'
            >
              停止
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

