import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3002,
    strictPort: true, // si el port està ocupat, dona error en lloc de buscar un altre
  },
});
