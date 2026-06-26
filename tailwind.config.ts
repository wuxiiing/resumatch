import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#00B4CC",
          dark: "#0891B2"
        },
        ink: "#0F172A",
        muted: "#64748B",
        line: "#E2E8F0",
        // 国风（求职军师 2.0 结果页）调色板
        gf: {
          paper: "#f2e8d3",
          surface: "#f7f0e0",
          ink: "#23271f",
          soft: "#5e5641",
          faint: "#8a7e64",
          green: "#52724b",
          greend: "#3a5436",
          greentint: "#e6ecd9",
          seal: "#9c3b30",
          amber: "#8a6a1a",
          rule: "#e1d5ba"
        }
      },
      fontFamily: {
        serifcn: [
          "Songti SC",
          "STSong",
          "Source Han Serif SC",
          "Noto Serif SC",
          "SimSun",
          "serif"
        ]
      },
      boxShadow: {
        soft: "0 18px 45px rgba(15, 23, 42, 0.06)"
      }
    }
  },
  plugins: [forms]
};

export default config;
