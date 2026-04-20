import { useTranslation } from "react-i18next";
import type { BlogArticle } from "@/data/blog";
import { blogEs } from "@/data/blog-es";

export function useTranslatedBlog(article: BlogArticle | null | undefined): BlogArticle | undefined {
  const { i18n } = useTranslation();

  if (!article) return article as undefined;
  if (!i18n.language.startsWith("es")) return article;

  const es = blogEs[article.slug];
  if (!es) return article;

  return {
    ...article,
    title: es.title,
    excerpt: es.excerpt,
    category: es.category,
    readTime: es.readTime,
  };
}

export function useTranslatedBlogs(articles: BlogArticle[]): BlogArticle[] {
  const { i18n } = useTranslation();

  if (!i18n.language.startsWith("es")) return articles;

  return articles.map((article) => {
    const es = blogEs[article.slug];
    if (!es) return article;
    return {
      ...article,
      title: es.title,
      excerpt: es.excerpt,
      category: es.category,
      readTime: es.readTime,
    };
  });
}
