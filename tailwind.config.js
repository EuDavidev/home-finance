/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#131315",
        card: "#1F1B19",
        "card-elevated": "#2A2420",
        primary: "#FF6B1A",
        "primary-soft": "#FFB59A",
        muted: "#6B5C52",
        "muted-fg": "#9B8B82",
        border: "rgba(255,255,255,0.08)",
        success: "#4CAF50",
        warning: "#FF9800",
        danger: "#F44336",
      },
      fontFamily: {
        sans: ["Sora_400Regular", "System"],
        medium: ["Sora_500Medium", "System"],
        semibold: ["Sora_600SemiBold", "System"],
        bold: ["Sora_700Bold", "System"],
        extrabold: ["Sora_800ExtraBold", "System"],
      },
    },
  },
  plugins: [],
};
