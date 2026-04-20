import { useTranslation } from "react-i18next";
import type { Product } from "@/data/catalog";
import { catalogEs } from "@/data/catalog-es";

function translateProduct(product: Product, lang: string): Product {
  if (!lang.startsWith("es")) return product;

  const es = catalogEs[product.id];
  if (!es) return product;

  return {
    ...product,
    title: es.title,
    shortDescription: es.shortDescription,
    longDescription: es.longDescription,
    duration: es.duration,
    includes: es.includes,
    ...(es.priceLabel !== undefined ? { priceLabel: es.priceLabel } : {}),
    ...(es.languages !== undefined ? { languages: es.languages } : {}),
    ...(es.equipmentCovered !== undefined ? { equipmentCovered: es.equipmentCovered } : {}),
  };
}

export function useTranslatedProduct(product: Product | null | undefined): Product {
  const { i18n } = useTranslation();

  if (!product) return product as unknown as Product;

  return translateProduct(product, i18n.language);
}

export function useTranslatedProducts(products: Product[]): Product[] {
  const { i18n } = useTranslation();

  if (!i18n.language.startsWith("es")) return products;

  return products.map((product) => translateProduct(product, i18n.language));
}
