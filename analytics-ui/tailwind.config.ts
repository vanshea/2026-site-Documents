import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "#f5f7f4",
        panel: "#ffffff",
        ink: "#1d2c2f",
        inkSoft: "#516069",
        accent: "#1f6f5f",
        accentSoft: "#d6f0ea",
        border: "#d6dfd8",
        warn: "#9f3a31"
      },
      boxShadow: {
        card: "0 8px 30px rgba(18, 42, 48, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
