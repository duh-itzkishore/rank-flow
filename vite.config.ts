import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    optimizeDeps: {
      exclude: ["playwright", "playwright-core", "@sparticuz/chromium"],
    },
    build: {
      rollupOptions: {
        external: ["playwright", "playwright-core", "@sparticuz/chromium"],
      },
    },
    ssr: {
      external: ["playwright", "playwright-core", "@sparticuz/chromium"],
      noExternal: [],
    },
  },
});

