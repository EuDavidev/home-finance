export const theme = {
  colors: {
    background:    "#131315",
    card:          "#1F1B19",
    cardElevated:  "#2A2420",
    primary:       "#FF6B1A",
    primarySoft:   "#FFB59A",
    secondary:     "#2A2420",
    muted:         "#6B5C52",
    mutedFg:       "#9B8B82",
    border:        "rgba(255,255,255,0.08)",
    success:       "#4CAF50",
    warning:       "#FF9800",
    danger:        "#F44336",
    foreground:    "#F5F0EC",
  },
  spacing: {
    xs: 4, sm: 8, md: 16, lg: 24, xl: 32, "2xl": 48,
  },
  radius: {
    sm: 8, md: 12, lg: 16, xl: 20, "2xl": 24, "3xl": 32, full: 9999,
  },
  shadow: {
    card: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 8,
    },
    glow: {
      shadowColor: "#FF6B1A",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.5,
      shadowRadius: 40,
      elevation: 12,
    },
  },
} as const;
