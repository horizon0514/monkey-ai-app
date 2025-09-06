import { resolve } from 'node:path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { visualizer } from 'rollup-plugin-visualizer'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      sourcemap: false,
      minify: 'esbuild'
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      sourcemap: false,
      minify: 'esbuild'
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()],
    build: {
      sourcemap: false,
      target: 'es2020',
      cssCodeSplit: true,
      reportCompressedSize: true,
      rollupOptions: {
        plugins: process.env.ANALYZE
          ? [
              visualizer({
                filename: 'stats-renderer.html',
                template: 'treemap',
                gzipSize: true,
                brotliSize: true
              })
            ]
          : [],
        input: {
          index: resolve('src/renderer/index.html'),
          settings: resolve('src/renderer/settings.html')
        },
        output: {
          manualChunks(id: string): string | undefined {
            if (id.includes('node_modules')) {
              if (
                id.includes('react') ||
                id.includes('@radix-ui') ||
                id.includes('zustand') ||
                id.includes('lucide-react')
              ) {
                return 'vendor-ui'
              }
              if (
                id.includes('/node_modules/ai/') ||
                id.includes('@ai-sdk') ||
                id.includes('@openrouter/ai-sdk-provider')
              ) {
                return 'vendor-ai'
              }
              if (
                id.includes('react-syntax-highlighter') ||
                id.includes('prismjs') ||
                id.includes('highlight.js')
              ) {
                return 'vendor-code'
              }
              if (
                id.includes('katex') ||
                id.includes('rehype-katex') ||
                id.includes('streamdown')
              ) {
                return 'vendor-math'
              }
              return 'vendor'
            }

            if (
              id.includes('/src/renderer/src/components/') ||
              id.includes('/src/renderer/src/lib/') ||
              id.includes('/src/renderer/src/theme/') ||
              id.includes('/src/renderer/src/types/')
            ) {
              return 'app-common'
            }
            return undefined
          }
        }
      }
    }
  }
})
