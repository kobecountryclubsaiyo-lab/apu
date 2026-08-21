import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        night: "#1E2340",
        amber: "#E8A33D",
        paper: "#F6F0E4",
        teal: "#3E7C74",
        clay: "#C97B63",
        ink: "#20202A",
        stone: "#8A8578",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-stamp)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
