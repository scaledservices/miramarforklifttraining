interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  "data-testid"?: string;
}

function getWebPSrc(src: string): string | null {
  if (src.endsWith(".jpg") || src.endsWith(".jpeg")) {
    return src.replace(/\.jpe?g$/, ".webp");
  }
  return null;
}

export default function OptimizedImage({ src, alt, className, loading = "lazy", ...rest }: OptimizedImageProps) {
  const webpSrc = getWebPSrc(src);

  if (webpSrc) {
    return (
      <picture>
        <source srcSet={webpSrc} type="image/webp" />
        <img src={src} alt={alt} className={className} loading={loading} {...rest} />
      </picture>
    );
  }

  return <img src={src} alt={alt} className={className} loading={loading} {...rest} />;
}
