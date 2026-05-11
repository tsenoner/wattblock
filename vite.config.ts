/// <reference types="vitest" />
import { defineConfig } from "vite";

export default defineConfig({
  build: { target: "es2020" },
  test: {
    environment: "node",
    environmentMatchGlobs: [["src/storage.test.ts", "jsdom"]],
    setupFiles: ["./src/test-setup.jsdom.ts"],
  },
});
