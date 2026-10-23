export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        "primary-dark": "var(--color-primary-dark)",
        "primary-soft": "var(--color-primary-soft)",
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        text: "var(--color-text)",
        muted: "var(--color-muted)",
        border: "var(--color-border)",
        ink: "rgb(var(--color-ink-rgb) / <alpha-value>)",
        paper: "rgb(var(--color-paper-rgb) / <alpha-value>)",
        clay: "var(--color-clay)",
        "clay-light": "rgb(var(--color-clay-light-rgb) / <alpha-value>)",
        terminal: "rgb(var(--color-terminal-rgb) / <alpha-value>)",
        "terminal-soft": "var(--color-terminal-soft)",
        "terminal-text": "rgb(var(--color-terminal-text-rgb) / <alpha-value>)"
      },
      fontFamily: {
        sans: [
          "Aptos",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif"
        ],
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"]
      },
      boxShadow: {
        quiet: "0 18px 45px rgba(15, 59, 56, 0.08)"
      }
    }
  },
  plugins: []
};
