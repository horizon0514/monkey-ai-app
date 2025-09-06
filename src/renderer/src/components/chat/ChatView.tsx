'use client'
import { Fragment } from 'react'
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
import { useEffect, useState } from 'react'
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
import { DefaultChatTransport } from 'ai'
// use Web Crypto

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
  const [conversationId, setConversationId] = useState<string>(() =>
    crypto.randomUUID()
  )
  const [conversations, setConversations] = useState<Array<{
    id: string
    title?: string | null
    model?: string | null
  }>>([])
  const [historyMessages, setHistoryMessages] = useState<Array<{
    id: string
    conversationId: string
    role: 'user' | 'assistant'
    content: string
  }>>([])
  const { messages, sendMessage, status, regenerate } = useChat({
    transport: new DefaultChatTransport({
      api: 'http://127.0.0.1:3399/chat/stream'
    })
  })

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const base = await window.electron.getLocalApiBase()
        const res = await fetch(`${base}/conversations`)
        const json = await res.json()
        if (json?.ok && Array.isArray(json.conversations)) {
          setConversations(json.conversations)
        }
      } catch (e) {
        console.error('Failed to load conversations', e)
      }
    }
    loadConversations()
  }, [])

  const loadHistory = async (id: string) => {
    try {
      const base = await window.electron.getLocalApiBase()
      const res = await fetch(`${base}/conversations/${id}/messages`)
      const json = await res.json()
      if (json?.ok && Array.isArray(json.messages)) {
        setHistoryMessages(json.messages)
      }
    } catch (e) {
      console.error('Failed to load messages', e)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      sendMessage(
        { text: input },
        {
          body: {
            model: model,
            webSearch: webSearch,
            conversationId
          }
        }
      )
      setInput('')
    }
  }

  return (
    <div className='relative mx-auto size-full h-[calc(100vh-48px)] max-w-6xl p-6'>
      <div className='flex h-full gap-4'>
        <aside className='w-64 shrink-0 overflow-hidden rounded-lg border'>
          <div className='flex items-center justify-between border-b px-3 py-2'>
            <span className='text-sm font-medium text-muted-foreground'>对话记录</span>
            <button
              className='rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:opacity-90'
              onClick={() => {
                const id = crypto.randomUUID()
                setConversationId(id)
                setHistoryMessages([])
              }}
            >
              新建
            </button>
          </div>
          <div className='h-[calc(100%-40px)] overflow-y-auto p-2'>
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => {
                  setConversationId(conv.id)
                  loadHistory(conv.id)
                }}
                className={`mb-1 w-full rounded px-3 py-2 text-left text-sm hover:bg-muted/60 ${
                  conv.id === conversationId ? 'bg-primary/10 text-primary' : ''
                }`}
                title={conv.title || 'Untitled'}
              >
                <div className='truncate'>{conv.title || 'Untitled'}</div>
                <div className='truncate text-xs text-muted-foreground'>
                  {conv.model || ''}
                </div>
              </button>
            ))}
          </div>
        </aside>
        <div className='flex h-full flex-1 flex-col'>
        <Conversation className='h-full'>
          <ConversationContent>
            {historyMessages.map(m => (
              <div key={`hist-${m.id}`}>
                <Message from={m.role}>
                  <MessageContent>
                    <Response>{m.content}</Response>
                  </MessageContent>
                </Message>
              </div>
            ))}
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
                            i === messages.length - 1 && (
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
          className='mt-4'
        >
          <PromptInputTextarea
            onChange={e => setInput(e.target.value)}
            value={input}
            className='bg-background'
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
            />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
    </div>
  )
}
