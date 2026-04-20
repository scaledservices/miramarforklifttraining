import { Link } from "wouter";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface SeoBreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function SeoBreadcrumb({ items }: SeoBreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground py-4" aria-label="Breadcrumb" data-testid="seo-breadcrumb">
      <Link href="/">
        <span className="hover:text-foreground cursor-pointer inline-flex items-center gap-1">
          <Home className="h-3.5 w-3.5" /> Home
        </span>
      </Link>
      {items.map((item, i) => (
        <span key={i} className="inline-flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5" />
          {item.href ? (
            <Link href={item.href}>
              <span className="hover:text-foreground cursor-pointer">{item.label}</span>
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
