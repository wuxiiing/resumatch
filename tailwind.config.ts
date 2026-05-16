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
        line: "#E2E8F0"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(15, 23, 42, 0.06)"
      }
    }
  },
  plugins: [forms]
};

export default config;
