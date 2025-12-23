import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
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
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log']
        }
      },
      rollupOptions: {
        input: {
          index: resolve('src/renderer/index.html'),
          settings: resolve('src/renderer/settings.html')
        },
        output: {
          manualChunks(id) {
            // Simplified chunking to avoid loading order issues
            if (id.includes('node_modules')) {
              // Put React in a separate chunk but ensure it loads first
              if (
                id.includes('react') ||
                id.includes('react-dom') ||
                id.includes('@ai-sdk') ||
                id.includes('ai')
              ) {
                return 'react-core'
              }
              // Everything else in vendor
              return 'vendor'
            }
            return undefined
          }
        }
      }
    }
  }
})
