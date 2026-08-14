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
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" }
        },
        "pulse-slow": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.85 }
        }
      },
      animation: {
        "fade-in-up": "fade-in-up 0.5s ease-out forwards",
        "pulse-slow": "pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite"
      }
    }
  },
  plugins: []
};
