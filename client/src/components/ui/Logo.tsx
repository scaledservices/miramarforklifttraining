import { brand } from "@shared/config/brand";

interface LogoProps {
  variant?: "full" | "mark" | "navbar";
  theme?: "light" | "dark";
  className?: string;
  loading?: "eager" | "lazy";
}

export default function Logo({ variant = "navbar", theme = "light", className = "", loading = "eager" }: LogoProps) {
  if (variant === "navbar") {
    // Assets are 1479x933 (both themes). Rendered at h-[4.5rem] (72px).
    const isDark = theme === "dark";
    return (
      <img
        src={isDark ? brand.logo.fullDark : brand.logo.navbar}
        alt={brand.name}
        width={114}
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
      // Intrinsic dimensions 1479x933 (both themes) to reserve aspect ratio; CSS controls rendered size.
      width={1479}
      height={933}
      loading={loading}
      decoding="async"
      className={`h-16 w-auto ${className}`}
      data-testid="logo-full"
    />
  );
}
