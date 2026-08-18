/**
 * Generate photoreal course hero banners via gpt-image-1 /v1/images/generations.
 * Usage:
 *   node scripts/gen-banners.mjs <stem> [<stem> ...]   # specific stems
 *   node scripts/gen-banners.mjs --all                 # all 14
 * Reads OPENAI_API_KEY from .env. Output: ai-staged/banners/<stem>.png
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "ai-staged", "banners");
fs.mkdirSync(OUT, { recursive: true });

// Load OPENAI_API_KEY from .env without printing it.
const envText = fs.readFileSync(path.join(ROOT, ".env"), "utf8");
const KEY = (envText.match(/^OPENAI_API_KEY=(.+)$/m) || [])[1]?.trim();
if (!KEY) { console.error("OPENAI_API_KEY not found in .env"); process.exit(1); }

const STYLE = "Photorealistic, natural diffused warehouse lighting, professional safety-training photography. EXTREMELY WIDE, ZOOMED-OUT establishing shot, like a distant wide-angle photograph: the subject (vehicle and people) is small in the frame, occupying only about a third of the image, with the rest being the surrounding warehouse/environment. Compose for a thin banner crop (about 4:1): keep the small subject in the vertical middle so the crop keeps it. Workers wear correct PPE (hard hat, hi-vis vest, safety glasses). Yellow Toyota-style counterbalance forklift. No text, no watermark, no logos.";

const BRIEFS = {
  "warehouse-aisle": "Warehouse aisle with tall pallet racking on both sides, a forklift driving down the center lane, loading door at the far end. Sense of an open travel lane.",
  "aerial-lift-hero": "Articulating boom lift elevated beside a steel structure, operator in the basket wearing a harness. Industrial backdrop.",
  "pre-shift-checklist": "Operator standing at a parked forklift holding a clipboard, inspecting the forks and mast. Conveys a walk-around pre-shift inspection.",
  "osha-compliance": "Instructor with a group of workers in PPE reviewing safety material near a forklift on a warehouse floor. Training and compliance mood.",
  "train-the-trainer-hero": "A trainer demonstrating forklift controls to a small group of attentive adult trainees. Leadership and instruction mood.",
  "safe-driving": "Forklift moving through a warehouse, operator looking in the direction of travel, load carried low and tilted back. Controlled, safe motion.",
  "pedestrian-safety": "A forklift yielding to a pedestrian in a marked walkway, clear separation between person and truck, both in hi-vis.",
  "stability-triangle": "Photoreal three-quarter view of a counterbalance forklift carrying a load slightly raised, conveying balance and center of gravity through the scene.",
  "scissor-lift-hero": "Scissor lift raised with an operator at height, guardrails up, indoor warehouse setting.",
  "ppe-gloves": "A worker donning work gloves at a PPE station: hard hat, hi-vis vest, gloves, and safety glasses being worn or laid out.",
  "parking-shutdown": "Forklift properly parked with forks lowered flat to the ground and mast tilted forward, in a designated parking area, shut down.",
  "load-center": "Forklift carrying a pallet load held close to the mast and heeled against the backrest, forks low, showing the load near the truck center.",
  "ramps-slopes": "A yellow counterbalance forklift driving straight up a wide concrete loading-dock ramp that leads UP to an OPEN raised loading dock with a visible dock doorway/opening and a truck backed up to it. The ramp clearly connects the lower ground level to the higher dock level; the far side is OPEN (doorway/sky/truck), NOT a blank wall. Load carried low on the uphill side, correct incline travel. Wide shot showing the full ramp from the side so the slope and the open dock at the top are both clearly visible.",
  "forklift-hero": "Clean three-quarter studio-style photo of a yellow counterbalance forklift, no operator, brand-forward hero shot.",
};

const args = process.argv.slice(2);
const stems = args.includes("--all") ? Object.keys(BRIEFS) : args.filter(a => BRIEFS[a]);
if (stems.length === 0) { console.error("No valid stems. Choices:", Object.keys(BRIEFS).join(", ")); process.exit(1); }

async function gen(stem) {
  const prompt = `${BRIEFS[stem]} ${STYLE}`;
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model: "gpt-image-1", prompt, size: "1536x1024", quality: "high" }),
  });
  if (!res.ok) { console.error(`[${stem}] HTTP ${res.status}:`, (await res.text()).slice(0, 300)); return false; }
  const json = await res.json();
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) { console.error(`[${stem}] no b64_json in response`); return false; }
  fs.writeFileSync(path.join(OUT, `${stem}.png`), Buffer.from(b64, "base64"));
  console.log(`[${stem}] saved`);
  return true;
}

for (const stem of stems) {
  await gen(stem);
  if (stems.length > 1) await new Promise(r => setTimeout(r, 5000)); // rate-limit spacing
}
console.log("done");
