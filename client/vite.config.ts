import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  base: "/",
  // Development
  // server: {
  //   proxy: {
  //     "/api": {
  //       target: {
  //         target: "http://localhost:3000",
  //         changeOrigin: true,
  //       },
  //     },
  //   },
  // },
  // below was added as a temp solution to the slow loading of tabler icons.
  resolve: {
    alias: {
      // /esm/icons/index.mjs only exports the icons statically, so no separate chunks are created
      "@tabler/icons-react": "@tabler/icons-react/dist/esm/icons/index.mjs",
    },
  },
});
