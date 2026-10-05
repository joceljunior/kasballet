import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

/**
 * Gera um version.json por build e injeta a versão no cliente
 * para detectar deploys novos e evitar cache antigo.
 */
function appVersionPlugin() {
  const version = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  return {
    name: 'kasballet-app-version',
    config() {
      return {
        define: {
          __APP_VERSION__: JSON.stringify(version)
        }
      }
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify(
          { version, builtAt: new Date().toISOString() },
          null,
          2
        )
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), appVersionPlugin()],
  server: {
    port: 5173,
    host: true,
    open: false
  },
  build: {
    sourcemap: true,
    commonjsOptions: {
      include: [/parse/, /node_modules/],
      transformMixedEsModules: true
    }
  },
  css: {
    devSourcemap: true
  },
  resolve: {
    dedupe: ['parse']
  },
  optimizeDeps: {
    include: ['parse'],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  define: {
    // Garantir que o Parse use a versão browser
    global: 'globalThis',
    'process.env': {}
  },
  ssr: {
    noExternal: ['parse']
  }
})

