interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  decoding?: "async" | "sync" | "auto";
  width?: number;
  height?: number;
  sizes?: string;
  /** Lowercase on purpose: React 18 passes unknown lowercase attributes straight to the DOM. */
  fetchpriority?: "high" | "low" | "auto";
  "data-testid"?: string;
}

function getWebPSrc(src: string): string | null {
  if (src.endsWith(".jpg") || src.endsWith(".jpeg")) {
    return src.replace(/\.jpe?g$/, ".webp");
  }
  return null;
}

export default function OptimizedImage({
  src,
  alt,
  className,
  loading = "lazy",
  decoding = "async",
  ...rest
}: OptimizedImageProps) {
  const webpSrc = getWebPSrc(src);

  if (webpSrc) {
    return (
      <picture>
        <source srcSet={webpSrc} type="image/webp" />
        <img src={src} alt={alt} className={className} loading={loading} decoding={decoding} {...rest} />
      </picture>
    );
  }

  return <img src={src} alt={alt} className={className} loading={loading} decoding={decoding} {...rest} />;
}
