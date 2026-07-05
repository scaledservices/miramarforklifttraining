const colors = {
  // Primary brand color — yellow/gold, used on buttons, CTAs, highlights
  // across miramarforklift.com and training.miramarforklift.com.
  primary: {
    hex: "#FFC326",
    rgb: "255, 195, 38",
    hsl: "43 100% 57%",
  },
  // Accent mirrors primary: the live sites use the same yellow for CTAs.
  accent: {
    hex: "#FFC326",
    rgb: "255, 195, 38",
    hsl: "43 100% 57%",
  },
  // Text on yellow elements is black; on dark backgrounds white.
  onPrimary: {
    hex: "#000000",
    hsl: "0 0% 5%",
  },
  // Dark brown used for dark background sections (footers, hero bands, CTA
  // bands) — the warm dark from the live training site, NOT navy.
  dark: {
    hex: "#4f3b3b",
    rgb: "79, 59, 59",
    hsl: "10 22% 26%",
  },
  // Charcoal alternative dark (cards, sidebars on dark surfaces).
  charcoal: {
    hex: "#32373c",
    hsl: "204 11% 22%",
  },
  // Near-black used for the header/nav background.
  nearBlack: {
    hex: "#232323",
    hsl: "0 0% 14%",
  },
  // Secondary green (training site accents).
  green: {
    hex: "#019E7C",
    hsl: "167 99% 31%",
  },
  // Tertiary orange (sparing highlights on the training site).
  orange: {
    hex: "#FF7F00",
    hsl: "30 100% 50%",
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
      "primary-foreground": colors.onPrimary.hsl,
      "accent": colors.accent.hsl,
      "accent-foreground": colors.onPrimary.hsl,
      "ring": colors.primary.hsl,
      "sidebar-primary": colors.primary.hsl,
      "sidebar-primary-foreground": colors.onPrimary.hsl,
      "sidebar-ring": colors.primary.hsl,
      "brand-dark": colors.dark.hsl,
      "brand-green": colors.green.hsl,
      "brand-orange": colors.orange.hsl,
    },
    dark: {
      "primary": colors.primary.hsl,
      "primary-foreground": colors.onPrimary.hsl,
      "accent": colors.accent.hsl,
      "accent-foreground": colors.onPrimary.hsl,
      "ring": colors.primary.hsl,
      "sidebar-primary": colors.primary.hsl,
      "sidebar-primary-foreground": colors.onPrimary.hsl,
      "sidebar-ring": colors.primary.hsl,
      "brand-dark": colors.dark.hsl,
      "brand-green": colors.green.hsl,
      "brand-orange": colors.orange.hsl,
    },
  },

  email: {
    headerBg: colors.dark.hex,
    headerText: "#ffffff",
    footerBg: colors.background.light,
    footerBorder: colors.primary.hex,
    footerText: colors.text.muted,
    footerSmall: colors.text.faint,
    linkColor: colors.orange.hex,
    bodyFont: "Roboto, Arial, sans-serif",
    headingFont: "'Roboto Slab', Georgia, serif",
    headingColor: colors.dark.hex,
    buttonBg: colors.primary.hex,
    buttonText: "#000000",
    successBg: "#f0faf7",
    successBorder: colors.green.hex,
    successText: colors.green.hex,
  },

  pdf: {
    borderPrimary: colors.dark.hex,
    borderAccent: colors.primary.hex,
    titleColor: colors.dark.hex,
    fallbackBrandColor: colors.primary.hex,
    tableHeaderBg: colors.dark.hex,
    tableHeaderText: "#ffffff",
    totalLineColor: colors.dark.hex,
    footerText: colors.text.light,
  },
} as const;

export type Theme = typeof theme;
