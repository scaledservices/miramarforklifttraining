// Traffic analytics rules. Run: npx tsx --test scripts/traffic.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isBotUserAgent, isExcludedPath, cityForPath, categorizeReferrerHost,
  resolveTrafficRange, previousRange, deviceForUserAgent, SITE_LAUNCH_DATE,
} from "../shared/traffic";

const CHROME = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36";
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

test("bots and automation are not visitors; real browsers are", () => {
  assert.equal(isBotUserAgent(CHROME), false);
  assert.equal(isBotUserAgent(IPHONE), false);
  for (const ua of [
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Hermes/1.0 Chrome/120 Safari/537.36",
    "curl/8.4.0", "", null, "facebookexternalhit/1.1",
  ]) assert.equal(isBotUserAgent(ua as any), true, String(ua));
});

test("admin and API paths are excluded, public pages are not", () => {
  for (const p of ["/admin", "/admin/analytics", "/es/admin/bookings", "/api/x"]) assert.equal(isExcludedPath(p), true, p);
  for (const p of ["/", "/locations/fresno", "/es/book-training", "/login", "/administrator-training"]) assert.equal(isExcludedPath(p), false, p);
});

test("pages map to their office city", () => {
  assert.equal(cityForPath("/locations/san-diego"), "san-diego");
  assert.equal(cityForPath("/es/locations/las-vegas"), "las-vegas");
  assert.equal(cityForPath("/p/standard-forklift-certification-las-vegas"), "las-vegas");
  assert.equal(cityForPath("/p/forklift-train-the-trainer-fresno"), "fresno");
  assert.equal(cityForPath("/"), null);
  assert.equal(cityForPath("/forklift-certification-little-rock-ar"), null);
});

test("referrer sources", () => {
  assert.equal(categorizeReferrerHost(null), "direct");
  assert.equal(categorizeReferrerHost("https://www.google.com/"), "google");
  assert.equal(categorizeReferrerHost("https://gemini.google.com/app"), "ai_assistant");
  assert.equal(categorizeReferrerHost("https://chatgpt.com/"), "ai_assistant");
  assert.equal(categorizeReferrerHost("https://training.miramarforklift.com/x"), "internal");
  assert.equal(categorizeReferrerHost("https://miramarforklift.com/"), "miramarforklift.com");
  assert.equal(categorizeReferrerHost("https://l.facebook.com/"), "facebook");
});

test("date ranges are Pacific, inclusive, and never before launch", () => {
  const now = new Date("2026-10-30T05:30:00Z"); // Oct 29, 10:30pm PT
  assert.deepEqual(resolveTrafficRange({ preset: "today" }, now), { from: "2026-10-29", to: "2026-10-29" });
  assert.deepEqual(resolveTrafficRange({ preset: "7d" }, now), { from: "2026-10-26", to: "2026-10-29" }); // clamped to launch
  assert.deepEqual(resolveTrafficRange({ preset: "launch" }, now), { from: SITE_LAUNCH_DATE, to: "2026-10-29" });
  assert.deepEqual(resolveTrafficRange({ from: "2026-10-27", to: "2026-10-28" }, now), { from: "2026-10-27", to: "2026-10-28" });
  assert.deepEqual(previousRange({ from: "2026-10-27", to: "2026-10-28" }), { from: "2026-10-25", to: "2026-10-26" });
});

test("devices", () => {
  assert.equal(deviceForUserAgent(IPHONE), "mobile");
  assert.equal(deviceForUserAgent(CHROME), "desktop");
  assert.equal(deviceForUserAgent("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)"), "tablet");
});
