import Hero from "@/components/sections/Hero";
import CTABand from "@/components/sections/CTABand";
import { useTranslation } from "react-i18next";
import SEOHead from "@/components/seo/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { Link } from "wouter";
import { blogArticles } from "@/data/blog";
import { useTranslatedBlogs } from "@/hooks/useTranslatedBlog";

export default function Blog() {
  const { t, i18n } = useTranslation();
  const articles = useTranslatedBlogs(blogArticles);
  const dateLocale = i18n.language === "es" ? "es-MX" : "en-US";
  return (
    <>
      <SEOHead
        title={t("seo.blog.title")}
        description={t("seo.blog.description")}
        canonical="/blog"
      />
      <Hero
        image="/images/warehouse-facility.jpg"
        title={t("blog.heroTitle")}
        subtitle={t("blog.heroSubtitle")}
      />

      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {articles.map((article) => (
              <Card key={article.slug} className="border-border hover-elevate" data-testid={`blog-card-${article.slug}`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <Badge variant="secondary" className="text-xs">{article.category}</Badge>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(article.publishDate).toLocaleDateString(dateLocale, { month: "long", day: "numeric", year: "numeric" })}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {article.readTime}
                    </span>
                  </div>
                  <Link href={`/blog/${article.slug}`}>
                    <h2 className="text-lg font-bold mb-2 cursor-pointer">{article.title}</h2>
                  </Link>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{article.excerpt}</p>
                  <Link href={`/blog/${article.slug}`}>
                    <Button variant="ghost" size="sm" data-testid={`button-read-${article.slug}`}>
                      {t("blog.readMore")}
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <CTABand
        title={t("blog.readyToGetCertified")}
        subtitle={t("blog.readyToGetCertifiedSub")}
        primaryCta={{ label: t("blog.getCertified"), href: "/online-forklift-certification" }}
        secondaryCta={{ label: t("blog.viewPrograms"), href: "/training-programs" }}
      />
    </>
  );
}
