import { useParams } from "wouter";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { getBlogBySlug, blogArticles } from "@/data/blog";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Calendar, Clock } from "lucide-react";
import CTABand from "@/components/sections/CTABand";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslatedBlog, useTranslatedBlogs } from "@/hooks/useTranslatedBlog";

function renderMarkdown(content: string) {
  const lines = content.split("\n");
  const elements: JSX.Element[] = [];
  let key = 0;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      elements.push(<h2 key={key++} className="text-xl font-bold mt-8 mb-3">{line.slice(3)}</h2>);
    } else if (line.startsWith("**") && line.endsWith("**")) {
      elements.push(<p key={key++} className="font-semibold mt-4 mb-1">{line.slice(2, -2)}</p>);
    } else if (line.startsWith("- ")) {
      elements.push(
        <li key={key++} className="text-muted-foreground ml-4 list-disc text-sm leading-relaxed">{line.slice(2)}</li>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={key++} className="h-2" />);
    } else {
      elements.push(<p key={key++} className="text-muted-foreground leading-relaxed text-sm">{line}</p>);
    }
  }

  return elements;
}

export default function BlogArticle() {
  const { t, i18n } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const rawArticle = getBlogBySlug(slug || "");
  const article = useTranslatedBlog(rawArticle);
  const otherArticlesRaw = blogArticles.filter((a) => a.slug !== (rawArticle?.slug ?? "")).slice(0, 3);
  const otherArticles = useTranslatedBlogs(otherArticlesRaw);

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">{t("blog.articleNotFound")}</h1>
        <p className="text-muted-foreground mb-8">{t("blog.articleNotFoundDesc")}</p>
        <Link href="/blog">
          <Button data-testid="button-back-blog">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("blog.backToBlog")}
          </Button>
        </Link>
      </div>
    );
  }
  const dateLocale = i18n.language === "es" ? "es-MX" : "en-US";

  return (
    <>
      <SEOHead
        title={article.title}
        description={article.excerpt}
        canonical={`/blog/${article.slug}`}
        ogType="article"
      />
      <section className="bg-gradient-to-br from-brand-dark to-[hsl(10,22%,16%)] py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-white/70 mb-4" data-testid="link-back-blog">
            <ArrowLeft className="w-3.5 h-3.5" />
            {t("blog.blogLink")}
          </Link>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <Badge className="bg-white/15 text-white border-white/20">{article.category}</Badge>
            <span className="flex items-center gap-1 text-xs text-white/60">
              <Calendar className="w-3 h-3" />
              {new Date(article.publishDate).toLocaleDateString(dateLocale, { month: "long", day: "numeric", year: "numeric" })}
            </span>
            <span className="flex items-center gap-1 text-xs text-white/60">
              <Clock className="w-3 h-3" />
              {article.readTime}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
            {article.title}
          </h1>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <article className="prose-sm">
            {renderMarkdown(article.content)}
          </article>
        </div>
      </section>

      {otherArticles.length > 0 && (
        <section className="py-12 md:py-16 bg-card">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold mb-6">{t("blog.moreArticles")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {otherArticles.map((a) => (
                <Card key={a.slug} className="border-border hover-elevate" data-testid={`related-article-${a.slug}`}>
                  <CardContent className="p-5">
                    <Badge variant="secondary" className="text-xs mb-2">{a.category}</Badge>
                    <Link href={`/blog/${a.slug}`}>
                      <h3 className="font-bold text-sm mb-2 line-clamp-2 cursor-pointer">{a.title}</h3>
                    </Link>
                    <p className="text-xs text-muted-foreground line-clamp-2">{a.excerpt}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      <CTABand
        title={t("blog.readyToGetCertified")}
        subtitle={t("blog.readyToGetCertifiedSub")}
        primaryCta={{ label: t("blog.getCertified"), href: "/online-forklift-certification" }}
        secondaryCta={{ label: t("blog.viewPrograms"), href: "/training-programs" }}
      />
    </>
  );
}
