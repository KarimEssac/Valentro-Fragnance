import type {Config} from "tailwindcss";

const config: Config = {
  darkMode: "class",
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
        outline: "var(--color-outline)",

        // Footer design colors
        "surface-container-low": "#f6f3ed",
        "deep-onyx": "#201B11",
        "muted-brass": "#7A6A4F",
        "warm-gold": "#D4AF37",
        "parchment-base": "#F9F6F0",
        "marble-vein": "#EAE4D8",
        "surface-dim": "#dcdad4",
        "surface-variant": "#e5e2dc",
        "surface-container": "#f0eee8",
        "surface-bright": "#fcf9f3",
        "on-surface-variant": "#4b463e",
        "primary": "#000000",
        "on-primary": "#ffffff"
      },
      fontFamily: {
        serif: "var(--font-serif)",
        sans: "var(--font-sans)",
        "label-caps": ["var(--font-sans)"],
        "headline-lg-mobile": ["var(--font-serif)"],
        "display-lg": ["var(--font-serif)"],
        "headline-lg": ["var(--font-serif)"],
        "body-lg": ["var(--font-sans)"],
        "body-md": ["var(--font-sans)"],
        "headline-md": ["var(--font-serif)"]
      },
      fontSize: {
        "label-caps": ["12px", { "lineHeight": "16px", "letterSpacing": "0.15em", "fontWeight": "600" }],
        "headline-lg-mobile": ["32px", { "lineHeight": "40px", "letterSpacing": "0em", "fontWeight": "400" }],
        "display-lg": ["84px", { "lineHeight": "92px", "letterSpacing": "-0.02em", "fontWeight": "400" }],
        "headline-lg": ["48px", { "lineHeight": "56px", "letterSpacing": "0em", "fontWeight": "400" }],
        "body-lg": ["18px", { "lineHeight": "28px", "letterSpacing": "0.01em", "fontWeight": "300" }],
        "body-md": ["16px", { "lineHeight": "24px", "letterSpacing": "0.01em", "fontWeight": "400" }],
        "headline-md": ["32px", { "lineHeight": "40px", "letterSpacing": "0.02em", "fontWeight": "400" }]
      },
      maxWidth: {
        container: "var(--container-max)",
        "container-max": "1440px"
      },
      spacing: {
        gutter: "var(--gutter)",
        "section-gap": "128px",
        "margin-desktop": "64px",
        "margin-mobile": "20px",
        "container-max": "1440px"
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
