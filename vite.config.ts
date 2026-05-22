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
              // 백엔드 CORS가 특정 origin만 허용하므로 (예: 5173만 허용),
              // 브라우저가 보낸 Origin/Referer를 떼고 same-origin처럼 forward한다.
              configure: (proxy) => {
                proxy.on("proxyReq", (proxyReq) => {
                  proxyReq.removeHeader("origin");
                  proxyReq.removeHeader("referer");
                });
              },
            },
          },
        }
      : undefined,
  };
});
