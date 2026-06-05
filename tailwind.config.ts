import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Brand palette — friendly, child-appropriate
      colors: {
        brand: {
          50:  "#fef3e2",
          100: "#fde7b8",
          200: "#fbd08a",
          300: "#f9b95c",
          400: "#f7a133",
          500: "#f5880a", // primary orange — energetic, warm
          600: "#d4700a",
          700: "#a85808",
          800: "#7c4006",
          900: "#502804",
        },
        jade: {
          50:  "#e6f7f1",
          100: "#c0ecde",
          200: "#8fd9c0",
          300: "#56c6a0",
          400: "#28b385",
          500: "#0a9e6d", // secondary green — calm, learning
          600: "#088659",
          700: "#066a47",
          800: "#044f34",
          900: "#023322",
        },
        sky: {
          50:  "#e8f4fd",
          100: "#c8e6fb",
          200: "#94ccf7",
          300: "#5ab0f0",
          400: "#2d95e8",
          500: "#1077d4",
          600: "#0d5fac",
          700: "#0a4a86",
          800: "#07365f",
          900: "#04213a",
        },
      },
      fontFamily: {
        // Nunito for Latin, system CJK fonts for Chinese characters
        sans: [
          "var(--font-nunito)",
          "PingFang SC",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      fontSize: {
        // Larger base sizes for children
        base: ["1.0625rem", { lineHeight: "1.6" }],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;
