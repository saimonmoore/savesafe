import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true,
    fs: {
      strict: false,
    },
  },
  plugins: [react()],
  worker: {
    format: 'es', // Ensure ES module format
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  assetsInclude: ["src/db/migrations/**/*.sql"],
})
