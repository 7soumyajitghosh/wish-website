import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    tailwindcss(),
    react()
  ],
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Long-lived vendor chunks: react/gsap change far less often than
        // app code, so browsers keep them cached across deploys.
        manualChunks: (id) => {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'vendor';
          }
          if (id.includes('node_modules/gsap')) {
            return 'motion';
          }
          return undefined;
        },
      },
    },
  },
})
