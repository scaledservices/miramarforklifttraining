import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, AlertTriangle, Info, Lightbulb } from "lucide-react";
import { brand } from "@shared/config/brand";

export interface BodySection {
  type: string;
  heading?: string;
  content?: string;
  items?: string[];
  columns?: { label: string; ours?: string; others?: string }[];
  steps?: { title: string; description: string }[];
  imageUrl?: string;
  imageAlt?: string;
  variant?: string;
  links?: { label: string; href: string }[];
  quote?: string;
  author?: string;
}

interface SeoBodySectionsProps {
  sections: BodySection[];
}

function headingToId(heading: string): string {
  return heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function SeoBodySections({ sections }: SeoBodySectionsProps) {
  if (!sections || sections.length === 0) return null;
  return (
    <div className="space-y-10" data-testid="seo-body-sections">
      {sections.map((section, i) => {
        const id = section.heading ? headingToId(section.heading) : undefined;
        return (
          <div key={i} id={id} data-testid={`seo-section-${i}`}>
            {renderSection(section)}
          </div>
        );
      })}
    </div>
  );
}

function renderSection(section: BodySection) {
  switch (section.type) {
    case "rich_text": return <RichText section={section} />;
    case "icon_list": return <IconList section={section} />;
    case "comparison_table": return <ComparisonTable section={section} />;
    case "callout": return <Callout section={section} />;
    case "step_list": return <StepList section={section} />;
    case "image_text": return <ImageText section={section} />;
    case "document_links": return <DocumentLinks section={section} />;
    case "testimonial": return <Testimonial section={section} />;
    default: return <RichText section={section} />;
  }
}

function RichText({ section }: { section: BodySection }) {
  return (
    <div>
      {section.heading && <h2 className="text-2xl font-bold mb-3">{section.heading}</h2>}
      {section.content && <div className="prose prose-gray dark:prose-invert max-w-none text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: section.content }} />}
    </div>
  );
}

function IconList({ section }: { section: BodySection }) {
  return (
    <div>
      {section.heading && <h2 className="text-2xl font-bold mb-4">{section.heading}</h2>}
      <ul className="space-y-3">
        {section.items?.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <span className="text-muted-foreground">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ComparisonTable({ section }: { section: BodySection }) {
  return (
    <div>
      {section.heading && <h2 className="text-2xl font-bold mb-4">{section.heading}</h2>}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-semibold">Feature</th>
              <th className="text-center py-3 px-4 font-semibold text-accent">{brand.name}</th>
              <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Others</th>
            </tr>
          </thead>
          <tbody>
            {section.columns?.map((col, i) => (
              <tr key={i} className="border-b">
                <td className="py-3 px-4">{col.label}</td>
                <td className="py-3 px-4 text-center font-medium">{col.ours || "✓"}</td>
                <td className="py-3 px-4 text-center text-muted-foreground">{col.others || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Callout({ section }: { section: BodySection }) {
  const variant = section.variant || "info";
  const icons = { info: Info, warning: AlertTriangle, tip: Lightbulb };
  const colors = { info: "border-blue-500 bg-blue-50 dark:bg-blue-950/20", warning: "border-amber-500 bg-amber-50 dark:bg-amber-950/20", tip: "border-green-500 bg-green-50 dark:bg-green-950/20" };
  const Icon = icons[variant as keyof typeof icons] || Info;
  const color = colors[variant as keyof typeof colors] || colors.info;

  return (
    <div className={`border-l-4 rounded-r-lg p-4 ${color}`}>
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 shrink-0 mt-0.5" />
        <div>
          {section.heading && <p className="font-semibold mb-1">{section.heading}</p>}
          {section.content && <p className="text-sm text-muted-foreground">{section.content}</p>}
        </div>
      </div>
    </div>
  );
}

function StepList({ section }: { section: BodySection }) {
  return (
    <div>
      {section.heading && <h2 className="text-2xl font-bold mb-4">{section.heading}</h2>}
      <div className="space-y-4">
        {section.steps?.map((step, i) => (
          <div key={i} className="flex items-start gap-4">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-accent text-accent-foreground text-sm font-bold shrink-0">{i + 1}</div>
            <div>
              <p className="font-semibold">{step.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImageText({ section }: { section: BodySection }) {
  return (
    <div className="grid md:grid-cols-2 gap-8 items-center">
      {section.imageUrl && (
        <div>
          <img src={section.imageUrl} alt={section.imageAlt || ""} className="rounded-lg w-full" loading="lazy" />
        </div>
      )}
      <div>
        {section.heading && <h2 className="text-2xl font-bold mb-3">{section.heading}</h2>}
        {section.content && <p className="text-muted-foreground leading-relaxed">{section.content}</p>}
      </div>
    </div>
  );
}

function DocumentLinks({ section }: { section: BodySection }) {
  return (
    <div>
      {section.heading && <h2 className="text-2xl font-bold mb-4">{section.heading}</h2>}
      <div className="space-y-2">
        {section.links?.map((link, i) => (
          <a key={i} href={link.href} className="flex items-center gap-2 text-accent hover:underline text-sm" target="_blank" rel="noopener noreferrer">
            <CheckCircle className="h-4 w-4" /> {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}

function Testimonial({ section }: { section: BodySection }) {
  return (
    <Card>
      <CardContent className="py-6">
        {section.quote && <blockquote className="text-lg italic text-muted-foreground mb-3">"{section.quote}"</blockquote>}
        {section.author && <p className="text-sm font-semibold">— {section.author}</p>}
      </CardContent>
    </Card>
  );
}
