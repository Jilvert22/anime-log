import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        // 混合フォント（英数字: Poppins、日本語: M PLUS Rounded）
        mixed: ['var(--font-poppins)', 'var(--font-rounded)', 'sans-serif'],
        // 個別に使いたい場合
        poppins: ['var(--font-poppins)', 'sans-serif'],
        rounded: ['var(--font-rounded)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;



