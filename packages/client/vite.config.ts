import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    fs: {
      strict: false,
    },
  },
  optimizeDeps: {
    exclude: ["@latticexyz/network", "@latticexyz/noise"],
  },
  build: {
    // outDir: "../dist",
    rollupOptions: {
      external: ["chalk"], // fix for chalk, necessary for successful build but dist fails on runtime
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          phaser: ["phaser"],
          mud: [
            "@latticexyz/common",
            "@latticexyz/dev-tools",
            "@latticexyz/react",
            "@latticexyz/recs",
            "@latticexyz/schema-type",
            "@latticexyz/store-sync",
            "@latticexyz/utils",
            "@latticexyz/world",
          ],
        },
      },
    },
    target: "es2022",
    minify: true,
    sourcemap: true,
  },
});
