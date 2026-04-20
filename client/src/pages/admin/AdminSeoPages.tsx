import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/pages/admin/AdminLayout";
import SEOHead from "@/components/seo/SEOHead";
import type { SeoPage } from "@shared/schema";

export default function AdminSeoPages() {
  const [search, setSearch] = useState("");
  const [templateFilter, setTemplateFilter] = useState("");

  const { data, isLoading } = useQuery<{ pages: SeoPage[] }>({
    queryKey: ["/api/admin/seo-pages"],
  });

  const pages = data?.pages || [];
  const templates = [...new Set(pages.map(p => p.templateKey))].sort();

  const filtered = pages.filter(p => {
    const matchesSearch = !search ||
      p.slug.toLowerCase().includes(search.toLowerCase()) ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.city && p.city.toLowerCase().includes(search.toLowerCase())) ||
      (p.state && p.state.toLowerCase().includes(search.toLowerCase()));
    const matchesTemplate = !templateFilter || p.templateKey === templateFilter;
    return matchesSearch && matchesTemplate;
  });

  return (
    <>
      <SEOHead title="SEO Pages Management" noindex />
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-admin-seo-title">SEO Pages</h1>
              <p className="text-muted-foreground">Manage programmatic SEO landing pages</p>
            </div>
            <Badge variant="secondary" data-testid="badge-total-pages">{pages.length} total pages</Badge>
          </div>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by slug, title, city, or state..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-seo-search"
              />
            </div>
            <select
              className="border rounded-md px-3 py-2 text-sm bg-background"
              value={templateFilter}
              onChange={(e) => setTemplateFilter(e.target.value)}
              data-testid="select-template-filter"
            >
              <option value="">All Templates</option>
              {templates.map(t => (
                <option key={t} value={t}>{t.replace("TEMPLATE_", "").replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Showing {filtered.length} of {pages.length} pages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-2 px-3 font-medium">Slug</th>
                        <th className="py-2 px-3 font-medium">Template</th>
                        <th className="py-2 px-3 font-medium">Title</th>
                        <th className="py-2 px-3 font-medium">Status</th>
                        <th className="py-2 px-3 font-medium">Location</th>
                        <th className="py-2 px-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.slice(0, 100).map((page) => (
                        <tr key={page.id} className="border-b hover:bg-muted/50" data-testid={`row-seo-page-${page.id}`}>
                          <td className="py-2 px-3 font-mono text-xs max-w-[200px] truncate">{page.slug}</td>
                          <td className="py-2 px-3">
                            <Badge variant="outline" className="text-xs">
                              {page.templateKey.replace("TEMPLATE_", "").replace(/_/g, " ")}
                            </Badge>
                          </td>
                          <td className="py-2 px-3 max-w-[300px] truncate">{page.title}</td>
                          <td className="py-2 px-3">
                            <Badge variant={page.published ? "default" : "secondary"}>
                              {page.published ? "Published" : "Draft"}
                            </Badge>
                          </td>
                          <td className="py-2 px-3 text-xs text-muted-foreground">
                            {page.city && page.state ? `${page.city}, ${page.state}` : page.state || page.industry || page.equipmentType || "—"}
                          </td>
                          <td className="py-2 px-3">
                            <a href={`/${page.locale === "es" ? "es" : "en"}/${page.slug}`} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm" className="gap-1" data-testid={`link-preview-${page.id}`}>
                                <ExternalLink className="h-3 w-3" /> Preview
                              </Button>
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filtered.length > 100 && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Showing first 100 of {filtered.length} results. Use search to narrow down.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </AdminLayout>
    </>
  );
}
