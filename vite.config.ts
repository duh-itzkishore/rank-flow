import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    optimizeDeps: {
      exclude: ["playwright"],
    },
    build: {
      rollupOptions: {
        external: ["playwright"],
      },
    },
    ssr: {
      external: ["playwright"],
      noExternal: [],
    },
  },
});

