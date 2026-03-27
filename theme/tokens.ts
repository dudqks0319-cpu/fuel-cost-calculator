export const theme = {
  colors: {
    background: "#F2F2F7",
    card: "#FFFFFF",
    primary: "#007AFF",
    success: "#34C759",
    danger: "#FF3B30",
    purple: "#5856D6",
    text: "#1C1C1E",
    body: "#3C3C43",
    muted: "#8E8E93",
    border: "#E5E5EA",
    input: "#F2F2F7",
    overlay: "rgba(28, 28, 30, 0.2)"
  },
  spacing: {
    xs: 6,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24
  },
  radius: {
    sm: 12,
    md: 16,
    lg: 20,
    pill: 999
  },
  shadow: {
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6
    },
    elevation: 4
  },
  typography: {
    title: {
      fontSize: 28,
      fontWeight: "700"
    },
    subtitle: {
      fontSize: 17,
      fontWeight: "600"
    },
    body: {
      fontSize: 15,
      color: "#3C3C43"
    },
    caption: {
      fontSize: 13,
      color: "#8E8E93"
    },
    amount: {
      fontSize: 34,
      fontWeight: "800"
    }
  }
} as const;
