import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { LlmSettings } from '../shared/types'
import Store from 'electron-store'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText } from 'ai'

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

    // Basic CORS
    app.use('*', async (c, next) => {
      c.header('Access-Control-Allow-Origin', '*')
      c.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
      c.header('Access-Control-Allow-Headers', 'Content-Type,Authorization')
      if (c.req.method === 'OPTIONS') {
        c.status(204)
        return c.body(null)
      }
      return next()
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

        try {
          const result = await generateText({
            model: openrouter(modelId || 'openai/gpt-4o-mini'),
            messages
          } as any)
          return c.json({ ok: true, text: result.text })
        } catch (err: any) {
          // Fallback: direct fetch if provider schema validation fails for some upstreams
          try {
            const resp = await fetch(`${baseURL.replace(/\/$/, '')}/chat/completions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
                'HTTP-Referer': 'chat-monkey',
                'X-Title': 'chat-monkey'
              },
              body: JSON.stringify({
                model: modelId || 'openai/gpt-4o-mini',
                messages
              })
            })
            if (!resp.ok) {
              const t = await resp.text()
              return c.json(
                { ok: false, error: `HTTP_${resp.status}`, detail: t },
                { status: resp.status as any }
              )
            }
            const json = (await resp.json()) as any
            const content = json?.choices?.[0]?.message?.content || json?.choices?.[0]?.text || ''
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

    this.server = serve({ fetch: app.fetch, port: this.port })
  }

  public getBaseURL(): string {
    return `http://127.0.0.1:${this.port}`
  }
}

