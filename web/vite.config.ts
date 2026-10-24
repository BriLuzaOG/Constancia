import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    // En desarrollo, la API Nest corre en 3000. En producción Nest sirve
    // este mismo build, así que no hay proxy ni CORS.
    proxy: {
      "/api": "http://localhost:3000",
      "/events": "http://localhost:3000",
    },
  },
  fmt: {},
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
      // Un ciclo entre módulos es un bug de arquitectura.
      "import/no-cycle": "error",
    },
    options: { typeAware: true, typeCheck: true },
  },
});
