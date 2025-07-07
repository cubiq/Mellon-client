import { defineConfig, mergeConfig, UserConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const baseConfig: UserConfig = {
  plugins: [react()],
  build: {
    emptyOutDir: true,
    modulePreload: false,
    target: 'esnext',
    chunkSizeWarningLimit: 2000,
    commonjsOptions: {
      strictRequires: 'auto',
    },
    rollupOptions: {
      output: {
        chunkFileNames: (chunkInfo) => {
          const customFieldPath = path.resolve(__dirname, 'src/custom-fields');
          if (chunkInfo.facadeModuleId?.startsWith(customFieldPath)) {
            return 'user/[name].js';
          }

          return 'assets/[name].js';
        },
        entryFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
  resolve: {
    alias: {
      '@custom-fields': path.resolve(__dirname, 'src/custom-fields'),
    },
  },
}

// Load local config if it exists
const loadLocalConfig = async () => {
  const localConfigPath = path.resolve(__dirname, 'vite.config.local.ts')

  if (fs.existsSync(localConfigPath)) {
    return (await import('./vite.config.local.ts')).default
  }
  return {}
}
const localConfig = await loadLocalConfig()

export default defineConfig(mergeConfig(baseConfig, localConfig))