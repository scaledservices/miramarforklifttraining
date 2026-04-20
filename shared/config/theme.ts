const colors = {
  primary: {
    hex: "#0A3D66",
    rgb: "10, 61, 102",
    hsl: "207 82% 22%",
  },
  accent: {
    hex: "#F97316",
    rgb: "249, 115, 22",
    hsl: "25 95% 53%",
  },
  text: {
    dark: "#333333",
    medium: "#666666",
    light: "#999999",
    muted: "#718096",
    faint: "#a0aec0",
    extraFaint: "#aaaaaa",
  },
  background: {
    white: "#ffffff",
    light: "#f7fafc",
    row: "#f7f7f7",
  },
  border: {
    light: "#cccccc",
  },
} as const;

export const theme = {
  colors,

  cssVars: {
    light: {
      "primary": colors.primary.hsl,
      "accent": colors.accent.hsl,
      "ring": colors.primary.hsl,
      "sidebar-primary": colors.primary.hsl,
      "sidebar-ring": colors.primary.hsl,
    },
    dark: {
      "primary": "207 78% 50%",
      "accent": "25 92% 58%",
      "ring": "207 78% 50%",
      "sidebar-primary": "207 78% 50%",
      "sidebar-ring": "207 78% 50%",
    },
  },

  email: {
    headerBg: colors.primary.hex,
    headerText: "#ffffff",
    footerBg: colors.background.light,
    footerBorder: colors.accent.hex,
    footerText: colors.text.muted,
    footerSmall: colors.text.faint,
    linkColor: colors.accent.hex,
    bodyFont: "'Segoe UI', Arial, sans-serif",
  },

  pdf: {
    borderPrimary: colors.primary.hex,
    borderAccent: colors.accent.hex,
    titleColor: colors.primary.hex,
    fallbackBrandColor: colors.accent.hex,
    tableHeaderBg: colors.primary.hex,
    tableHeaderText: "#ffffff",
    totalLineColor: colors.primary.hex,
    footerText: colors.text.light,
  },
} as const;

export type Theme = typeof theme;
