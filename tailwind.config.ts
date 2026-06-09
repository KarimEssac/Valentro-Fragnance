import type {Config} from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        "surface-mid": "var(--color-surface-mid)",
        "surface-hi": "var(--color-surface-hi)",
        gold: "var(--color-gold)",
        "gold-muted": "var(--color-gold-muted)",
        umber: "var(--color-umber)",
        parchment: "var(--color-parchment)",
        "on-surface": "var(--color-on-surface)",
        outline: "var(--color-outline)"
      },
      fontFamily: {
        serif: "var(--font-serif)",
        sans: "var(--font-sans)"
      },
      maxWidth: {
        container: "var(--container-max)"
      },
      spacing: {
        gutter: "var(--gutter)"
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
        none: "0px"
      },
      boxShadow: {
        gold: "0 0 32px rgba(222, 188, 126, 0.2)"
      }
    }
  },
  plugins: []
};

export default config;
