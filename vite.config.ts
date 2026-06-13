import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    proxy: {
      '/auth':              { target: 'http://localhost:3000', changeOrigin: true },
      '/patients':          { target: 'http://localhost:3000', changeOrigin: true },
      '/staff':             { target: 'http://localhost:3000', changeOrigin: true },
      '/appointments':      { target: 'http://localhost:3000', changeOrigin: true },
      '/prescriptions':     { target: 'http://localhost:3000', changeOrigin: true },
      '/vitals':            { target: 'http://localhost:3000', changeOrigin: true },
      '/departments':       { target: 'http://localhost:3000', changeOrigin: true },
      '/rooms':             { target: 'http://localhost:3000', changeOrigin: true },
      '/lab-orders':        { target: 'http://localhost:3000', changeOrigin: true },
      '/invoices':          { target: 'http://localhost:3000', changeOrigin: true },
      '/inventory':         { target: 'http://localhost:3000', changeOrigin: true },
      '/nursing-tasks':     { target: 'http://localhost:3000', changeOrigin: true },
      '/consultation-notes':{ target: 'http://localhost:3000', changeOrigin: true },
      '/queue':             { target: 'http://localhost:3000', changeOrigin: true },
      '/notifications':     { target: 'http://localhost:3000', changeOrigin: true },
      '/stats':             { target: 'http://localhost:3000', changeOrigin: true },
      '/roles':             { target: 'http://localhost:3000', changeOrigin: true },
      '/settings':          { target: 'http://localhost:3000', changeOrigin: true },
      '/admissions':        { target: 'http://localhost:3000', changeOrigin: true },
      '/audit-logs':        { target: 'http://localhost:3000', changeOrigin: true },
      '/admin':             { target: 'http://localhost:3000', changeOrigin: true },
      '/health':            { target: 'http://localhost:3000', changeOrigin: true },
      '/sync':              { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
})
