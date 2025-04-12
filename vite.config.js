// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // Changed from plugin-react-swc

export default defineConfig({
  plugins: [react()],
})
