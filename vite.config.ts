import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { configDefaults } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.VITE_BASE || '/',
  test: {
    environment: 'node',
    globals: true,
    exclude: [...configDefaults.exclude, 'node_modules'],
  },
})
