import { useTranslation } from "react-i18next";
import type { BlogArticle } from "@/data/blog";
import { blogEs } from "@/data/blog-es";
import { blogEsContent } from "@/data/blog-es-content";

function toSpanish(article: BlogArticle): BlogArticle {
  const es = blogEs[article.slug];
  const esBody = blogEsContent[article.slug];
  if (!es && !esBody) return article;

  return {
    ...article,
    ...(es
      ? {
          title: es.title,
          excerpt: es.excerpt,
          category: es.category,
          readTime: es.readTime,
        }
      : {}),
    ...(esBody
      ? {
          content: esBody.content,
          metaTitle: esBody.metaTitle,
          metaDescription: esBody.metaDescription,
        }
      : {}),
  };
}

export function useTranslatedBlog(article: BlogArticle | null | undefined): BlogArticle | undefined {
  const { i18n } = useTranslation();

  if (!article) return article as undefined;
  if (!i18n.language.startsWith("es")) return article;

  return toSpanish(article);
}

export function useTranslatedBlogs(articles: BlogArticle[]): BlogArticle[] {
  const { i18n } = useTranslation();

  if (!i18n.language.startsWith("es")) return articles;

  return articles.map(toSpanish);
}
