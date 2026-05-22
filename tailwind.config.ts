import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Midnight Sterling tokens
        navy: "#001F3F",
        "navy-deep": "#0D1B3E",
        silver: "#C0C9D4",
        steel: "#71797E",
        "ink": "#1A1A2E",

        primary: "#000613",
        "on-primary": "#ffffff",
        "primary-container": "#001f3f",
        "on-primary-container": "#6f88ad",
        "primary-fixed": "#d4e3ff",
        "primary-fixed-dim": "#afc8f0",

        secondary: "#5d5e5f",
        "on-secondary": "#ffffff",
        "secondary-container": "#e0dfdf",
        "on-secondary-container": "#626363",
        "secondary-fixed": "#e3e2e2",
        "secondary-fixed-dim": "#c6c6c6",

        tertiary: "#02070a",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#182024",

        error: "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",

        surface: "#f8f9fa",
        "surface-dim": "#d9dadb",
        "surface-bright": "#f8f9fa",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f3f4f5",
        "surface-container": "#edeeef",
        "surface-container-high": "#e7e8e9",
        "surface-container-highest": "#e1e3e4",
        "on-surface": "#191c1d",
        "on-surface-variant": "#43474e",
        "surface-variant": "#e1e3e4",
        background: "#f8f9fa",
        "on-background": "#191c1d",
        outline: "#74777f",
        "outline-variant": "#c4c6cf"
      },
      fontFamily: {
        display: ["var(--font-display)", "Bodoni Moda", "serif"],
        body: ["var(--font-body)", "DM Sans", "sans-serif"]
      },
      fontSize: {
        "display-lg": ["64px", { lineHeight: "72px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-lg": ["40px", { lineHeight: "48px", fontWeight: "600" }],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "500" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "label-md": ["14px", { lineHeight: "20px", letterSpacing: "0.05em", fontWeight: "500" }],
        "label-sm": ["12px", { lineHeight: "16px", letterSpacing: "0.1em", fontWeight: "700" }]
      },
      spacing: {
        "container-max": "1280px",
        gutter: "24px",
        "margin-desktop": "64px",
        "margin-mobile": "20px",
        "stack-sm": "12px",
        "stack-md": "24px",
        "stack-lg": "48px",
        "section-gap": "96px"
      },
      borderRadius: {
        DEFAULT: "0px",
        sm: "0px",
        lg: "0px"
      },
      maxWidth: {
        container: "1280px"
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" }
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        marquee: "marquee 40s linear infinite",
        "fade-up": "fade-up 0.7s ease-out both"
      }
    }
  },
  plugins: []
};

export default config;
