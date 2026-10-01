// Required pre-exam training videos (2026-09-28 meeting, Alberto): trainees
// must watch the same safety video the legacy training.miramarforklift.com
// course shows before they can take the final exam.
//
// One URL per language. Any YouTube URL form works (watch?v=, youtu.be/,
// /embed/); VideoStep normalizes it to a privacy-enhanced embed.
//
// After changing a URL, reseed so existing course rows pick it up:
//   DATABASE_URL=... npx tsx scripts/seed-online-courses.ts --refresh
// es may be null (Spanish students then see the English video, no dead end).
export const FORKLIFT_SAFETY_VIDEO: { en: string; es: string | null } = {
  // "Forklift or Powered Industrial Truck Safety" (unlisted, 27:29)
  en: "https://youtu.be/aMdWwGJVXXQ",
  // "Spanish Forklift Powered Industrial Truck Safety" (unlisted, 27:37)
  es: "https://youtu.be/fGlG-WlMYQg",
};

/** Share of the video (by real playback time) required before the exam unlocks. */
export const REQUIRED_WATCH_PERCENTAGE = 90;
