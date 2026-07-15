import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Swap these for your group's brand once we sync a design system.
        brand: {
          DEFAULT: "#c2410c", // warm terracotta — dinner/community feel
          dark: "#9a3412",
          light: "#fed7aa",
        },
        ink: "#1c1917",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
