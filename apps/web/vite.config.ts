import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Allows npm (StackBlitz) to resolve workspace package without Bun
      '@tour-tracker/shared': path.resolve(__dirname, './src/shared.ts'),
    },
  },
  server: {
    host: true,
    proxy: { '/api': 'http://localhost:3000' },
  },
})
