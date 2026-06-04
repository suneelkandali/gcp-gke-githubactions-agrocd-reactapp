import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // Fixed: Changed from { react } to react

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true // Important for Docker exposure if debugging locally
  }
})