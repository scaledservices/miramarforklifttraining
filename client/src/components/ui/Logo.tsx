import { brand } from "@shared/config/brand";

interface LogoProps {
  variant?: "full" | "mark" | "navbar";
  theme?: "light" | "dark";
  className?: string;
}

export default function Logo({ variant = "navbar", theme = "light", className = "" }: LogoProps) {
  if (variant === "navbar") {
    return (
      <img
        src={brand.logo.navbar}
        alt={brand.name}
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
        className={`h-8 w-auto ${className}`}
        data-testid="logo-mark"
      />
    );
  }

  const src = theme === "dark" ? brand.logo.fullDark : brand.logo.full;

  return (
    <img
      src={src}
      alt={brand.name}
      className={`h-16 w-auto ${className}`}
      data-testid="logo-full"
    />
  );
}
