import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { LlmSettings } from '../shared/types'
import Store from 'electron-store'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText, streamText, convertToCoreMessages } from 'ai'
import { db, schema } from './db'
import { eq } from 'drizzle-orm'
import crypto from 'node:crypto'

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

    // Settings CRUD via Hono so renderer can call without IPC
    app.get('/settings/:key', async c => {
      const key = c.req.param('key')
      const rows = await db
        .select()
        .from(schema.settings)
        .where(eq(schema.settings.key, key))
      if (rows.length === 0) return c.json({ ok: false, error: 'NOT_FOUND' }, 404)
      return c.json({ ok: true, value: rows[0].value })
    })
    app.post('/settings/:key', async c => {
      const key = c.req.param('key')
      const body = (await c.req.json().catch(() => ({}))) as { value?: unknown }
      const value = JSON.stringify(body?.value ?? null)
      // upsert
      try {
        const exist = await db
          .select()
          .from(schema.settings)
          .where(eq(schema.settings.key, key))
          .limit(1)
        if (exist.length > 0) {
          await db
            .update(schema.settings)
            .set({ value, updatedAt: new Date() })
            .where(eq(schema.settings.key, key))
        } else {
          await db.insert(schema.settings).values({
            key,
            value,
            updatedAt: new Date()
          })
        }
        return c.json({ ok: true })
      } catch (e: any) {
        return c.json({ ok: false, error: 'DB_ERROR', detail: String(e?.message || e) }, 500)
      }
    })

    // List conversations
    app.get('/conversations', async c => {
      const rows = await db.select().from(schema.conversations)
      return c.json({ ok: true, conversations: rows })
    })

    // Get messages of conversation
    app.get('/conversations/:id/messages', async c => {
      const id = c.req.param('id')
      const rows = await db
        .select()
        .from(schema.messages)
        .where(eq(schema.messages.conversationId, id))
      return c.json({ ok: true, messages: rows })
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
        const webSearch = Boolean(body?.webSearch)
        const conversationId = (body?.conversationId as string) || crypto.randomUUID()
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

          // ensure conversation exists and insert latest user message for persistence
          try {
            // upsert conversation
            const existing = await db
              .select()
              .from(schema.conversations)
              .where(eq(schema.conversations.id, conversationId))
              .limit(1)
            if (existing.length === 0) {
              await db.insert(schema.conversations).values({
                id: conversationId,
                title: (uiMessages?.[0]?.content?.[0]?.text as string) || 'New Chat',
                model: modelId,
                webSearch,
                createdAt: new Date(),
                updatedAt: new Date()
              })
            } else {
              await db
                .update(schema.conversations)
                .set({ updatedAt: new Date(), model: modelId, webSearch })
                .where(eq(schema.conversations.id, conversationId))
            }
            // persist last user message (if any)
            const lastMsg = uiMessages?.at(-1)
            if (lastMsg && lastMsg.role === 'user') {
              await db.insert(schema.messages).values({
                id: lastMsg.id || crypto.randomUUID(),
                conversationId,
                role: 'user',
                content: (lastMsg.content || [])
                  .map((p: any) => (p?.type === 'text' ? p.text : ''))
                  .join(''),
                raw: JSON.stringify(lastMsg),
                createdAt: new Date()
              })
            }
          } catch (persistErr) {
            console.error('DB persist error (pre-stream):', persistErr)
          }

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
          // Tap into completion for persistence after stream ends
          ;(async () => {
            try {
              const full = await result.text
              await db.insert(schema.messages).values({
                id: crypto.randomUUID(),
                conversationId,
                role: 'assistant',
                content: full,
                raw: JSON.stringify({ text: full }),
                createdAt: new Date()
              })
              await db
                .update(schema.conversations)
                .set({ updatedAt: new Date() })
                .where(eq(schema.conversations.id, conversationId))
            } catch (e) {
              console.error('DB persist error (post-stream):', e)
            }
          })()

          return response
        } catch (err: any) {
          console.error('Error in streamText:', err)
          console.error('Error stack:', err.stack)
          // Fallback: non-stream with generateText
          const result = await generateText({
            model: openrouter(modelId || 'openai/gpt-4o-mini'),
            messages: coreMessages
          })
          const assistantText = result.text
          try {
            await db.insert(schema.messages).values({
              id: crypto.randomUUID(),
              conversationId,
              role: 'assistant',
              content: await assistantText,
              raw: JSON.stringify({ text: assistantText }),
              createdAt: new Date()
            })
          } catch (e) {
            console.error('DB persist error (fallback):', e)
          }
          return new Response(await assistantText, {
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
