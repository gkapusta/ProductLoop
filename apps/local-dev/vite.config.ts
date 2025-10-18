import {defineConfig} from "vite";
import mkcert from "vite-plugin-mkcert";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [mkcert()],
  server: {
    port: 12345,
    host: true,
    hmr: {
      host: "localhost",
    },
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        ws: true,
      },
      "/dashboard": {
        target: "http://localhost:3001",
        changeOrigin: true,
        ws: true,
      },
      "/demo": {
        target: "http://localhost:3002",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
