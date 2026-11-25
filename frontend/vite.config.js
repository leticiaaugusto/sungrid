import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Esta configuração ativa React e encaminha chamadas da API.
export default defineConfig({
  plugins: [react()],
  server: {

    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
