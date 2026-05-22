import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendUrl = env.VITE_BACKEND_URL || "http://localhost:8080";
  const useRealApi = env.VITE_USE_REAL_API === "true";

  return {
    plugins: [react()],
    server: useRealApi
      ? {
          proxy: {
            "/api": {
              target: backendUrl,
              changeOrigin: true,
            },
          },
        }
      : undefined,
  };
});
