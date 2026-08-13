export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        surface: "#111111",
        surface2: "#1b1b1f",
        muted: "#c4b5fd",
        brand: "#ef4444",
        brandDark: "#7c2d12",
        brandLight: "#fca5a5",
        accent: "#8b5cf6",
        accentSoft: "#c4b5fd"
      },
      boxShadow: {
        soft: "0 25px 60px rgba(239, 68, 68, 0.18)",
        glow: "0 18px 40px rgba(139, 92, 246, 0.35)"
      },
      backgroundImage: {
        "hero-glow": "radial-gradient(circle at top, rgba(139,92,246,0.28), transparent 35%), radial-gradient(circle at bottom right, rgba(239,68,68,0.22), transparent 28%)"
      }
    }
  },
  plugins: []
};
