import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Tailwind is loaded via the CDN script in index.html, and this project
  // lives inside a parent repo that has its own PostCSS config for a
  // separate app — disable Vite's upward PostCSS config search so it
  // doesn't pick that one up.
  css: {
    postcss: {
      plugins: [],
    },
  },
});
