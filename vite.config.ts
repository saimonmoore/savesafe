import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true,
    fs: {
      strict: false,
    },
  },
  plugins: [
    TanStackRouterVite(),
    react(),
  ],
  worker: {
    format: 'es', // Ensure ES module format
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  assetsInclude: ["src/db/migrations/**/*.sql"],
  optimizeDeps: {
    exclude: ['@electric-sql/pglite'],
  },
})
