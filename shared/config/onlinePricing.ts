// Display price of the online forklift operator certification.
// The amount actually CHARGED comes from courses.price in the database
// (server/routes/authorizeNet.ts buildOrder reads course.price), which is
// seeded from scripts/course-content.ts (EN) and course-content-es.ts (ES).
// Keep this in sync with those seed files; scripts/site-batch-1114.test.ts
// fails if they drift.
export const ONLINE_FORKLIFT_COURSE_PRICE = 45;
export const ONLINE_FORKLIFT_COURSE_PRICE_DISPLAY = `$${ONLINE_FORKLIFT_COURSE_PRICE.toFixed(2)}`;
