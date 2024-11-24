import path from "node:path";
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { defineConfig } from "vite";
import ReactPlugin from "@vitejs/plugin-react-swc";
import TopLevelAwaitPlugin from "vite-plugin-top-level-await";
import WasmPlugin from "vite-plugin-wasm";
import { ConfigPlugin } from "@dxos/config/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    ConfigPlugin(),
    TopLevelAwaitPlugin(),
    WasmPlugin(),
    ReactPlugin(),
  ],
  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "./index.html"),
        shell: path.resolve(__dirname, "./shell.html"),
      },
    },
  },
  worker: {
    format: "es",
    plugins: () => [TopLevelAwaitPlugin(), WasmPlugin()],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
