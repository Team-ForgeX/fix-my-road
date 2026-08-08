export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        surface: "#111827",
        surface2: "#1f2937",
        muted: "#94a3b8",
        brand: "#0f766e",
        brandLight: "#14b8a6"
      },
      boxShadow: {
        soft: "0 20px 45px rgba(15,23,42,0.12)"
      }
    }
  },
  plugins: []
};
