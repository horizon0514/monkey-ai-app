import { resolve } from 'node:path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
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
        input: {
          index: resolve('src/renderer/index.html'),
          settings: resolve('src/renderer/settings.html')
        },
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (
                id.includes('react') ||
                id.includes('@radix-ui') ||
                id.includes('zustand') ||
                id.includes('lucide-react') ||
                id.includes('embla-carousel') ||
                id.includes('react-syntax-highlighter')
              ) {
                return 'vendor-ui'
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
          }
        }
      }
    }
  }
})
