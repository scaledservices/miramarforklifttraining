import { Link, type LinkProps } from "wouter";
import { localePath } from "@/lib/locale";

export default function LocaleLink({ href, ...props }: LinkProps & { href: string }) {
  const isExternal = href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:");
  const isApi = href.startsWith("/api");
  const isAnchor = href.startsWith("#");
  const alreadyPrefixed = /^\/(en|es)(\/|$)/.test(href);

  if (isExternal || isApi || isAnchor || alreadyPrefixed) {
    return <Link href={href} {...props} />;
  }

  return <Link href={localePath(href)} {...props} />;
}
