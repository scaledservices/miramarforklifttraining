import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertTriangle, FileText, Globe, Link, ArrowRightLeft, Search } from "lucide-react";
import AdminLayout from "@/pages/admin/AdminLayout";
import SEOHead from "@/components/seo/SEOHead";

interface SeoHealth {
  total: number;
  published: number;
  unpublished: number;
  missingTitle: number;
  missingMeta: number;
  missingH1: number;
  missingCanonical: number;
  selfCanonical: number;
  duplicateCanonicals: number;
  duplicateTitles: Array<{ title: string; slugs: string[] }>;
  duplicateMetas: number;
  thinContent: number;
  thinContentSlugs: string[];
  sitemapNonIndexable: string[];
  templateCounts: Record<string, number>;
  redirectCount: number;
}

export default function AdminSeoHealth() {
  const { data, isLoading } = useQuery<SeoHealth>({
    queryKey: ["/api/admin/seo-health"],
  });

  return (
    <>
      <SEOHead title="SEO Health Dashboard" noindex />
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-seo-health-title">SEO Health Dashboard</h1>
            <p className="text-muted-foreground">Monitor the health and completeness of your SEO pages</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : data ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Globe} label="Total Pages" value={data.total} />
                <StatCard icon={CheckCircle} label="Published" value={data.published} variant="success" />
                <StatCard icon={ArrowRightLeft} label="301 Redirects" value={data.redirectCount} />
                <StatCard icon={AlertTriangle} label="Issues Found" value={data.missingTitle + data.missingMeta + data.missingH1 + data.duplicateCanonicals + data.thinContent + data.duplicateMetas + (data.duplicateTitles?.length || 0)} variant={data.missingTitle + data.missingMeta + data.missingH1 + data.thinContent > 0 ? "danger" : "success"} />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Content Quality</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <QualityRow label="Missing or short titles" count={data.missingTitle} total={data.total} />
                    <QualityRow label="Missing or short meta descriptions" count={data.missingMeta} total={data.total} />
                    <QualityRow label="Missing H1" count={data.missingH1} total={data.total} />
                    <QualityRow label="Thin content (< 500 chars)" count={data.thinContent} total={data.total} />
                    <QualityRow label="Duplicate canonical URLs" count={data.duplicateCanonicals} total={data.total} />
                    <QualityRow label="Duplicate meta descriptions" count={data.duplicateMetas} total={data.total} />
                    <QualityRow label="Duplicate titles" count={data.duplicateTitles?.length || 0} total={data.total} />
                    <QualityRow label="Self-referential canonicals" count={data.selfCanonical} total={data.total} isGood />
                    <QualityRow label="Missing canonical" count={data.missingCanonical} total={data.total} />
                  </div>
                </CardContent>
              </Card>

              {data.thinContentSlugs && data.thinContentSlugs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Thin Content Pages (Sample)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {data.thinContentSlugs.map(slug => (
                        <div key={slug} className="text-sm font-mono text-muted-foreground" data-testid={`thin-content-${slug}`}>
                          /{slug}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {data.sitemapNonIndexable && data.sitemapNonIndexable.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      Sitemap / Noindex Conflicts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">These URLs are in the sitemap but should not be indexed:</p>
                    <div className="space-y-1">
                      {data.sitemapNonIndexable.map(slug => (
                        <div key={slug} className="text-sm font-mono text-amber-700" data-testid={`sitemap-conflict-${slug}`}>
                          /{slug}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {data.duplicateTitles && data.duplicateTitles.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Link className="h-4 w-4" />
                      Duplicate Titles
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data.duplicateTitles.map((dt, i) => (
                        <div key={i} className="border rounded-lg p-3">
                          <p className="text-sm font-medium mb-1">{dt.title}...</p>
                          <div className="flex flex-wrap gap-1">
                            {dt.slugs.map(s => (
                              <Badge key={s} variant="secondary" className="text-xs font-mono">{s}</Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Published Pages by Template</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(data.templateCounts).sort((a, b) => b[1] - a[1]).map(([template, count]) => (
                      <div key={template} className="flex items-center justify-between border rounded-lg p-3" data-testid={`template-count-${template}`}>
                        <span className="text-sm">{template.replace("TEMPLATE_", "").replace(/_/g, " ")}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </AdminLayout>
    </>
  );
}

function StatCard({ icon: Icon, label, value, variant = "default" }: { icon: typeof Globe; label: string; value: number; variant?: string }) {
  const colors: Record<string, string> = {
    default: "text-foreground",
    success: "text-green-600",
    warning: "text-amber-600",
    danger: "text-red-600",
  };
  return (
    <Card>
      <CardContent className="py-4 flex items-center gap-3">
        <Icon className={`h-5 w-5 ${colors[variant] || colors.default}`} />
        <div>
          <p className={`text-2xl font-bold ${colors[variant] || colors.default}`}>{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function QualityRow({ label, count, total, isGood }: { label: string; count: number; total: number; isGood?: boolean }) {
  const pct = total > 0 ? Math.round(((total - count) / total) * 100) : 100;
  const isHealthy = isGood ? count > 0 : count === 0;
  return (
    <div className="flex items-center gap-3">
      {isHealthy ? (
        <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
      )}
      <span className="flex-1 text-sm">{label}</span>
      <span className="text-sm font-mono">
        {isGood ? `${count} pages` : count === 0 ? "All clear" : `${count} pages`}
      </span>
      {!isGood && (
        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${pct === 100 ? "bg-green-600" : "bg-amber-500"}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}
