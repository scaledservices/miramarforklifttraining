import { pool } from "../server/db";
import { storage } from "../server/storage";
import { getAllSeoPages } from "./seo-content";
import { getAllSpanishSeoPages } from "./seo-content-es";

async function seedSeoPages() {
  console.log("[SEO Seed] Starting...");

  const enPages = getAllSeoPages();
  const esPages = getAllSpanishSeoPages();
  const allPages = [...enPages, ...esPages];
  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const page of allPages) {
    try {
      const locale = page.locale || "en";
      await storage.upsertSeoPage(page.slug, locale, page);
      const existing = await storage.getSeoPageBySlug(page.slug, locale);
      if (existing) {
        updated++;
      } else {
        created++;
      }
    } catch (error: any) {
      console.error(`[SEO Seed] Error seeding ${page.slug} (${page.locale || "en"}):`, error.message);
      errors++;
    }
  }

  console.log(`[SEO Seed] Complete: ${allPages.length} pages processed (EN: ${enPages.length}, ES: ${esPages.length}) (${updated} upserted, ${errors} errors)`);
  await pool.end();
}

seedSeoPages().catch((err) => {
  console.error("[SEO Seed] Fatal error:", err);
  process.exit(1);
});
