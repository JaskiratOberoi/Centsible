import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // relative base so the built dist/ works from any folder on static hosting
  base: './',
  plugins: [react()],
})
