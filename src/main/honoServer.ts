import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import type { Server } from 'http'
import { LlmSettings } from '../shared/types'
import Store from 'electron-store'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText } from 'ai'

export class HonoServer {
  private server: Server | null = null
  private readonly port: number
  private readonly store: Store

  constructor(port: number = 3399) {
    this.port = port
    this.store = new Store({ name: 'site-configs' })
  }

  public start(): void {
    if (this.server) return
    const app = new Hono()

    // Basic CORS
    app.use('*', async (c, next) => {
      c.header('Access-Control-Allow-Origin', '*')
      c.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
      c.header('Access-Control-Allow-Headers', 'Content-Type,Authorization')
      if (c.req.method === 'OPTIONS') return c.text('', 204)
      await next()
    })

    app.get('/health', c => c.json({ ok: true }))

    app.post('/chat', async c => {
      try {
        const body = await c.req.json()
        const messages = Array.isArray(body?.messages) ? body.messages : []
        const modelId = typeof body?.model === 'string' ? body.model : undefined

        const llm = (this.store.get('llm') as LlmSettings) || {
          provider: 'openrouter'
        }
        const apiKey = llm.openrouter?.apiKey || ''
        const baseURL = llm.openrouter?.baseUrl || 'https://openrouter.ai/api/v1'
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

        const result = await generateText({
          model: openrouter(modelId || 'openai/gpt-4o-mini'),
          messages
        } as any)

        return c.json({ ok: true, text: result.text })
      } catch (e: any) {
        return c.json(
          { ok: false, error: 'SERVER_ERROR', detail: String(e?.message || e) },
          500
        )
      }
    })

    this.server = serve({ fetch: app.fetch, port: this.port })
  }

  public getBaseURL(): string {
    return `http://127.0.0.1:${this.port}`
  }
}

