import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        academy: {
          50: "#f4f7fb",
          100: "#e7eef8",
          500: "#2563eb",
          700: "#1d4ed8",
          900: "#0f172a",
        },
      },
      boxShadow: {
        soft: "0 10px 30px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
} satisfies Config;
