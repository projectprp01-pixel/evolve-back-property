import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    // Local dev: run `npm run dev:server` alongside `npm run dev` so requests
    // hit the same proxy path they'll take in production.
    proxy: {
      "/api": { target: "http://localhost:8081", changeOrigin: true },
      "/session": { target: "http://localhost:8081", changeOrigin: true },
    },
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
