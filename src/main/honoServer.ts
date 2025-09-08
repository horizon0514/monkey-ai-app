import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { LlmSettings } from '../shared/types'
import Store from 'electron-store'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText, streamText, convertToCoreMessages } from 'ai'
import {
  listConversations,
  createConversation,
  deleteConversation,
  getConversationMessages,
  upsertMessages,
  ensureConversation
} from './db'

export class HonoServer {
  private server: unknown | null = null
  private readonly port: number
  private readonly store: Store

  constructor(port: number = 3399) {
    this.port = port
    this.store = new Store({ name: 'site-configs' })
  }

  public start(): void {
    if (this.server) return
    const app = new Hono()

    // CORS via official Hono middleware
    app.use(
      '*',
      cors({
        origin: '*',
        allowMethods: ['GET', 'POST', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization']
      })
    )

    app.get('/health', c => c.json({ ok: true }))

    // Conversations APIs
    app.get('/conversations', c => {
      try {
        const rows = listConversations()
        return c.json({ ok: true, data: rows })
      } catch (e: any) {
        return c.json({ ok: false, error: String(e?.message || e) }, 500)
      }
    })

    app.post('/conversations', async c => {
      try {
        const body = (await c.req.json().catch(() => ({}))) as {
          title?: string
        }
        const row = createConversation(body?.title)
        return c.json({ ok: true, data: row })
      } catch (e: any) {
        return c.json({ ok: false, error: String(e?.message || e) }, 500)
      }
    })

    app.delete('/conversations/:id', c => {
      try {
        const id = c.req.param('id')
        deleteConversation(id)
        return c.json({ ok: true })
      } catch (e: any) {
        return c.json({ ok: false, error: String(e?.message || e) }, 500)
      }
    })

    app.get('/conversations/:id/messages', c => {
      try {
        const id = c.req.param('id')
        const conv = ensureConversation(id)
        const messages = getConversationMessages(conv.id)
        return c.json({ ok: true, data: messages })
      } catch (e: any) {
        return c.json({ ok: false, error: String(e?.message || e) }, 500)
      }
    })

    app.put('/conversations/:id/messages', async c => {
      try {
        const id = c.req.param('id')
        const body = (await c.req.json().catch(() => ({}))) as {
          messages?: Array<{ id: string; role: string; text: string }>
        }
        upsertMessages(
          id,
          Array.isArray(body.messages) ? (body.messages as any) : []
        )
        return c.json({ ok: true })
      } catch (e: any) {
        return c.json({ ok: false, error: String(e?.message || e) }, 500)
      }
    })

    app.post('/chat', async c => {
      try {
        const body = await c.req.json()
        const uiMessages = Array.isArray(body?.messages) ? body.messages : []
        const coreMessages = convertToCoreMessages(uiMessages as any)
        const modelId = typeof body?.model === 'string' ? body.model : undefined

        const llm = (this.store.get('llm') as LlmSettings) || {
          provider: 'openrouter'
        }
        const apiKey = llm.openrouter?.apiKey || ''
        const baseURL =
          llm.openrouter?.baseUrl || 'https://openrouter.ai/api/v1'
        if (!apiKey) {
          return c.json({ ok: false, error: 'MISSING_API_KEY' }, 400)
        }

        const openrouter = createOpenRouter({
          apiKey,
          baseURL,
          headers: {
            'HTTP-Referer': 'chat-monkey',
            'X-Title': 'chat-monkey'
          }
        })

        try {
          const result = await generateText({
            model: openrouter(modelId || 'openai/gpt-4o-mini'),
            messages: coreMessages
          })
          return c.json({ ok: true, text: result.text })
        } catch (err: any) {
          console.error(err)
          // Fallback: direct fetch if provider schema validation fails for some upstreams
          try {
            // convert to OpenAI compatible messages
            const openAiMessages = (coreMessages as any[]).map((m: any) => ({
              role: m.role,
              content: Array.isArray(m.content)
                ? m.content
                    .map((p: any) => (p?.type === 'text' ? p.text : ''))
                    .join('')
                : ''
            }))
            const resp = await fetch(
              `${baseURL.replace(/\/$/, '')}/chat/completions`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${apiKey}`,
                  'HTTP-Referer': 'chat-monkey',
                  'X-Title': 'chat-monkey'
                },
                body: JSON.stringify({
                  model: modelId || 'openai/gpt-4o-mini',
                  messages: openAiMessages
                })
              }
            )
            if (!resp.ok) {
              const t = await resp.text()
              return c.json(
                { ok: false, error: `HTTP_${resp.status}`, detail: t },
                { status: resp.status as any }
              )
            }
            const json = (await resp.json()) as any
            const content =
              json?.choices?.[0]?.message?.content ||
              json?.choices?.[0]?.text ||
              ''
            return c.json({ ok: true, text: String(content) })
          } catch (e2: any) {
            return c.json(
              {
                ok: false,
                error: 'FALLBACK_FAILED',
                detail: String(e2?.message || e2)
              },
              500
            )
          }
        }
      } catch (e: any) {
        return c.json(
          { ok: false, error: 'SERVER_ERROR', detail: String(e?.message || e) },
          500
        )
      }
    })

    app.post('/chat/stream', async c => {
      try {
        const body = await c.req.json()
        console.log('Received body:', JSON.stringify(body, null, 2))

        const uiMessages = Array.isArray(body?.messages) ? body.messages : []
        console.log('UI Messages:', JSON.stringify(uiMessages, null, 2))

        const coreMessages = convertToCoreMessages(uiMessages as any)
        console.log('Core Messages:', JSON.stringify(coreMessages, null, 2))

        const modelId = typeof body?.model === 'string' ? body.model : undefined
        console.log('Model ID:', modelId)

        const llm = (this.store.get('llm') as LlmSettings) || {
          provider: 'openrouter'
        }
        const apiKey = llm.openrouter?.apiKey || ''
        const baseURL =
          llm.openrouter?.baseUrl || 'https://openrouter.ai/api/v1'
        if (!apiKey) {
          return c.json({ ok: false, error: 'MISSING_API_KEY' }, 400)
        }

        const openrouter = createOpenRouter({
          apiKey,
          baseURL,
          headers: {
            'HTTP-Referer': 'chat-monkey',
            'X-Title': 'chat-monkey'
          }
        })

        try {
          console.log(
            'About to call streamText with model:',
            modelId || 'openai/gpt-4o-mini'
          )

          const result = await streamText({
            model: openrouter(modelId || 'openai/gpt-4o-mini'),
            messages: coreMessages,
            system:
              'You are a helpful assistant that can answer questions and help with tasks'
          })

          console.log('streamText result:', result)
          console.log(
            'streamText call => model:',
            modelId,
            'messages:',
            coreMessages
          )

          // Return AI SDK UI message stream response for @ai-sdk/react useChat
          const response = result.toUIMessageStreamResponse({
            sendSources: true,
            sendReasoning: true
          })
          return response
        } catch (err: any) {
          console.error('Error in streamText:', err)
          console.error('Error stack:', err.stack)
          // Fallback: non-stream with generateText
          const result = await generateText({
            model: openrouter(modelId || 'openai/gpt-4o-mini'),
            messages: coreMessages
          })
          return new Response(result.text, {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'X-Fallback': 'generateText'
            }
          })
        }
      } catch (e: any) {
        return c.json(
          { ok: false, error: 'SERVER_ERROR', detail: String(e?.message || e) },
          500
        )
      }
    })
    this.server = serve({ fetch: app.fetch, port: this.port })
    // 增加调试日志
    console.log(' HonoServer started on port ', this.port)
  }

  public getBaseURL(): string {
    return `http://127.0.0.1:${this.port}`
  }
}
