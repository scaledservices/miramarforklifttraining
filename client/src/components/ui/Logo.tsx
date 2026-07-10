import { brand } from "@shared/config/brand";

interface LogoProps {
  variant?: "full" | "mark" | "navbar";
  theme?: "light" | "dark";
  className?: string;
  loading?: "eager" | "lazy";
}

export default function Logo({ variant = "navbar", theme = "light", className = "", loading = "eager" }: LogoProps) {
  if (variant === "navbar") {
    // Dark asset is 707x354 (2:1); light navbar asset is 112x56. Rendered at h-[4.5rem] (72px).
    const isDark = theme === "dark";
    return (
      <img
        src={isDark ? brand.logo.fullDark : brand.logo.navbar}
        alt={brand.name}
        width={isDark ? 144 : 144}
        height={72}
        loading={loading}
        decoding="async"
        className={`h-[4.5rem] w-auto ${className}`}
        data-testid="logo-navbar"
      />
    );
  }

  if (variant === "mark") {
    return (
      <img
        src={brand.logo.mark}
        alt={brand.name}
        loading={loading}
        decoding="async"
        className={`h-8 w-auto ${className}`}
        data-testid="logo-mark"
      />
    );
  }

  const isDark = theme === "dark";
  const src = isDark ? brand.logo.fullDark : brand.logo.full;

  return (
    <img
      src={src}
      alt={brand.name}
      // Intrinsic dimensions (dark: 707x354, light: 1881x836) to reserve aspect ratio; CSS controls rendered size.
      width={isDark ? 707 : 1881}
      height={isDark ? 354 : 836}
      loading={loading}
      decoding="async"
      className={`h-16 w-auto ${className}`}
      data-testid="logo-full"
    />
  );
}
