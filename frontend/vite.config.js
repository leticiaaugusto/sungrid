import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Em desenvolvimento, as chamadas para /api vão para a API do SunGrid
    // (backend rodando em http://localhost:3000). Assim o front e a API
    // parecem estar no mesmo endereço e não há problema de CORS.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
