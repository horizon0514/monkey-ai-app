'use client'
import { Fragment, useEffect, useState } from 'react'
import { Action } from '@renderer/components/ui/ai-elements/actions'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton
} from '@renderer/components/ui/ai-elements/conversation'
import {
  Message,
  MessageContent
} from '@renderer/components/ui/ai-elements/message'
import {
  PromptInput,
  PromptInputButton,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools
} from '@renderer/components/ui/ai-elements/prompt-input'
import { Actions } from '@renderer/components/ui/ai-elements/actions'
import { useChat } from '@ai-sdk/react'
import { Response } from '@renderer/components/ui/ai-elements/response'
import { GlobeIcon, RefreshCcwIcon, CopyIcon } from 'lucide-react'
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger
} from '@renderer/components/ui/ai-elements/sources'
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger
} from '@renderer/components/ui/ai-elements/reasoning'
import { Loader } from '@renderer/components/ui/ai-elements/loader'
import { DefaultChatTransport, UIMessage } from 'ai'
import { Button } from '@renderer/components/ui/button'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { PlusIcon } from 'lucide-react'
import { useRef } from 'react'

const models = [
  {
    name: 'GPT 4o',
    value: 'openai/gpt-4o'
  },
  {
    name: 'Deepseek R1',
    value: 'deepseek/deepseek-r1'
  }
]

export const ChatView = () => {
  const [input, setInput] = useState('')
  const [model, setModel] = useState<string>(models[0].value)
  const [webSearch, setWebSearch] = useState(false)
  const [conversationId, setConversationId] = useState<string>('')
  const [conversationList, setConversationList] = useState<
    Array<{ id: string; title: string; updatedAt: number }>
  >([])
  const { messages, sendMessage, status, regenerate, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: 'http://127.0.0.1:3399/chat/stream'
    })
  })

  const isRestoring = useRef(false)
  const lastSavedKeyRef = useRef<string>('')
  const prevStatusRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    ;(async () => {
      const API_BASE = 'http://127.0.0.1:3399'
      const res = await fetch(`${API_BASE}/conversations`).then(r => r.json())
      if (res?.ok) {
        setConversationList(
          res.data.map((c: any) => ({
            id: c.id,
            title: c.title,
            updatedAt: c.updatedAt
          }))
        )
        const first = res.data[0]
        if (first) {
          setConversationId(first.id)
          const msgsRes = await fetch(
            `${API_BASE}/conversations/${first.id}/messages`
          ).then(r => r.json())
          if (msgsRes?.ok) {
            const uiMsgs: UIMessage[] = msgsRes.data.map((m: any) => ({
              id: m.id,
              role: m.role as any,
              parts: [{ type: 'text', text: m.text }]
            }))
            isRestoring.current = true
            setMessages(uiMsgs)
            setTimeout(() => {
              isRestoring.current = false
            }, 0)
          }
        } else {
          const created = await fetch(`${API_BASE}/conversations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'New Chat' })
          }).then(r => r.json())
          if (created?.ok) {
            setConversationId(created.data.id)
            setConversationList([
              {
                id: created.data.id,
                title: created.data.title,
                updatedAt: created.data.updatedAt
              }
            ])
          }
        }
      }
    })()
  }, [setMessages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      sendMessage(
        { text: input },
        {
          body: {
            model: model,
            webSearch: webSearch
          }
        }
      )
      setInput('')
    }
  }

  useEffect(() => {
    if (!conversationId) return
    if (isRestoring.current) return
    const prev = prevStatusRef.current
    const finishedNow =
      prev === 'streaming' && status !== 'streaming' && status !== 'submitted'
    const erroredNow = status === 'error' || false
    if (!(finishedNow || erroredNow)) {
      prevStatusRef.current = status
      return
    }
    const toSave = messages
      .filter(m => m.parts.some(p => p.type === 'text'))
      .map(m => ({
        id: m.id,
        role: m.role,
        text: m.parts
          .filter(p => p.type === 'text')
          .map(p => (p as any).text)
          .join('')
      }))
    if (toSave.length === 0) {
      prevStatusRef.current = status
      return
    }
    const key = `${conversationId}|${JSON.stringify(toSave)}`
    if (lastSavedKeyRef.current === key) {
      prevStatusRef.current = status
      return
    }
    const API_BASE = 'http://127.0.0.1:3399'
    fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: toSave })
    })
      .then(() => {
        lastSavedKeyRef.current = key
      })
      .catch(() => {})
      .finally(() => {
        prevStatusRef.current = status
      })
  }, [messages, conversationId, status])

  const handleNewChat = async () => {
    const API_BASE = 'http://127.0.0.1:3399'
    const created = await fetch(`${API_BASE}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Chat' })
    }).then(r => r.json())
    if (created?.ok) {
      setConversationId(created.data.id)
      setConversationList(prev => [
        ...prev,
        {
          id: created.data.id,
          title: created.data.title,
          updatedAt: created.data.updatedAt
        }
      ])
      setMessages([])
    }
  }

  const handleSelectConversation = async (id: string) => {
    setConversationId(id)
    const API_BASE = 'http://127.0.0.1:3399'
    const msgsRes = await fetch(
      `${API_BASE}/conversations/${id}/messages`
    ).then(r => r.json())
    if (msgsRes?.ok) {
      const uiMsgs: UIMessage[] = msgsRes.data.map((m: any) => ({
        id: m.id,
        role: m.role as any,
        parts: [{ type: 'text', text: m.text }]
      }))
      isRestoring.current = true
      setMessages(uiMsgs)
      setTimeout(() => {
        isRestoring.current = false
      }, 0)
    }
  }

  return (
    <div className='relative mx-auto size-full h-[calc(100vh-48px)] bg-white p-0 dark:bg-background'>
      <div className='flex h-full'>
        <div className='hidden w-64 flex-col gap-3 border-r border-border/40 p-3 md:flex'>
          <div className='flex items-center justify-between'>
            <div className='text-sm font-medium text-muted-foreground'>
              会话
            </div>
            <Button
              size='sm'
              variant='outline'
              onClick={handleNewChat}
            >
              <PlusIcon className='mr-1 h-4 w-4' /> 新建
            </Button>
          </div>
          <ScrollArea className='flex-1'>
            <div className='flex flex-col gap-1 pr-2'>
              {conversationList.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleSelectConversation(c.id)}
                  className={`rounded px-2 py-2 text-left text-sm transition-colors hover:bg-muted ${
                    c.id === conversationId ? 'bg-primary/10 text-primary' : ''
                  }`}
                >
                  <div className='truncate'>{c.title}</div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
        <div className='flex flex-1 flex-col p-6'>
          <Conversation className='h-full'>
            <ConversationContent>
              {messages.map(message => (
                <div key={message.id}>
                  {message.role === 'assistant' &&
                    message.parts.filter(part => part.type === 'source-url')
                      .length > 0 && (
                      <Sources>
                        <SourcesTrigger
                          count={
                            message.parts.filter(
                              part => part.type === 'source-url'
                            ).length
                          }
                        />
                        {message.parts
                          .filter(part => part.type === 'source-url')
                          .map((part, i) => (
                            <SourcesContent key={`${message.id}-${i}`}>
                              <Source
                                key={`${message.id}-${i}`}
                                href={part.url}
                                title={part.url}
                              />
                            </SourcesContent>
                          ))}
                      </Sources>
                    )}
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case 'text':
                        return (
                          <Fragment key={`${message.id}-${i}`}>
                            <Message from={message.role}>
                              <MessageContent>
                                <Response>{part.text}</Response>
                              </MessageContent>
                            </Message>
                            {message.role === 'assistant' &&
                              i === message.parts.length - 1 &&
                              message.id === messages.at(-1)?.id && (
                                <Actions className='mt-2'>
                                  <Action
                                    onClick={() => regenerate()}
                                    label='Retry'
                                  >
                                    <RefreshCcwIcon className='size-3' />
                                  </Action>
                                  <Action
                                    onClick={() =>
                                      navigator.clipboard.writeText(part.text)
                                    }
                                    label='Copy'
                                  >
                                    <CopyIcon className='size-3' />
                                  </Action>
                                </Actions>
                              )}
                          </Fragment>
                        )
                      case 'reasoning':
                        return (
                          <Reasoning
                            key={`${message.id}-${i}`}
                            className='w-full'
                            isStreaming={
                              status === 'streaming' &&
                              i === message.parts.length - 1 &&
                              message.id === messages.at(-1)?.id
                            }
                          >
                            <ReasoningTrigger />
                            <ReasoningContent>{part.text}</ReasoningContent>
                          </Reasoning>
                        )
                      default:
                        return null
                    }
                  })}
                </div>
              ))}
              {status === 'submitted' && <Loader />}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <PromptInput
            onSubmit={handleSubmit}
            className='mt-4 bg-muted'
          >
            <PromptInputTextarea
              onChange={e => setInput(e.target.value)}
              value={input}
              placeholder='在这里输入你的问题，按回车键发送'
            />
            <PromptInputToolbar>
              <PromptInputTools>
                <PromptInputButton
                  variant={webSearch ? 'default' : 'ghost'}
                  onClick={() => setWebSearch(!webSearch)}
                >
                  <GlobeIcon size={16} />
                  <span>Search</span>
                </PromptInputButton>
                <PromptInputModelSelect
                  onValueChange={value => {
                    setModel(value)
                  }}
                  value={model}
                >
                  <PromptInputModelSelectTrigger>
                    <PromptInputModelSelectValue />
                  </PromptInputModelSelectTrigger>
                  <PromptInputModelSelectContent>
                    {models.map(model => (
                      <PromptInputModelSelectItem
                        key={model.value}
                        value={model.value}
                      >
                        {model.name}
                      </PromptInputModelSelectItem>
                    ))}
                  </PromptInputModelSelectContent>
                </PromptInputModelSelect>
              </PromptInputTools>
              <PromptInputSubmit
                disabled={!input}
                status={status}
                className='text-muted-foreground'
              />
            </PromptInputToolbar>
          </PromptInput>
        </div>
      </div>
    </div>
  )
}
