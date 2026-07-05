import { brand } from "@shared/config/brand";

interface LogoProps {
  variant?: "full" | "mark" | "navbar";
  theme?: "light" | "dark";
  className?: string;
  loading?: "eager" | "lazy";
}

export default function Logo({ variant = "navbar", theme = "light", className = "", loading = "eager" }: LogoProps) {
  if (variant === "navbar") {
    // Dark asset is 591x170; light navbar asset is 192x192. Rendered at h-10 (40px).
    const isDark = theme === "dark";
    return (
      <img
        src={isDark ? brand.logo.fullDark : brand.logo.navbar}
        alt={brand.name}
        width={isDark ? 139 : 40}
        height={40}
        loading={loading}
        decoding="async"
        className={`h-10 w-auto ${className}`}
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
      // Intrinsic dimensions (dark: 591x170, light: 600x269) to reserve aspect ratio; CSS controls rendered size.
      width={isDark ? 591 : 600}
      height={isDark ? 170 : 269}
      loading={loading}
      decoding="async"
      className={`h-16 w-auto ${className}`}
      data-testid="logo-full"
    />
  );
}
