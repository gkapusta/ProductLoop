import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import {TanStackRouterVite} from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import componentDebugger from "@product-loop/tagger";

export default defineConfig({
  plugins: [TanStackRouterVite(),
    componentDebugger({ // ⚠️ IMPORTANT: Must be BEFORE react()
      enabled: process.env.NODE_ENV === "development", // When to run
      attributePrefix: "data-dev", // Custom prefix
      extensions: [".jsx", ".tsx"], // File types
    }),
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
