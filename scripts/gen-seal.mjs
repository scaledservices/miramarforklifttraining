/**
 * Generate an official-looking embossed gold certificate seal via gpt-image-1
 * /v1/images/generations (from-scratch; no reference image). Staged to
 * ai-staged/seal/ for veto before any wire-in. Reads OPENAI_API_KEY from .env.
 * Usage: node scripts/gen-seal.mjs [variant]
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "ai-staged", "seal");
fs.mkdirSync(OUT, { recursive: true });

const envText = fs.readFileSync(path.join(ROOT, ".env"), "utf8");
const KEY = (envText.match(/^OPENAI_API_KEY=(.+)$/m) || [])[1]?.trim();
if (!KEY) { console.error("OPENAI_API_KEY not found in .env"); process.exit(1); }

// Every word spelled out explicitly (AI text WILL misspell otherwise).
const PROMPT = `A single circular official embossed gold foil certificate seal, like a notary or university diploma seal, centered on a pure white background. Photorealistic metallic gold with realistic embossed texture, raised ridges, and light catching the metal. Around the TOP inner arc of the seal, the raised capital letters read exactly "MIRAMAR FORKLIFT TRAINING". Around the BOTTOM inner arc, the raised capital letters read exactly "OFFICIAL SEAL". In the CENTER of the seal, large raised capital letters read "OSHA" on one line and "COMPLIANT" below it. A small five-pointed gold star sits between the top and bottom text rings on each side. Classic official seal design with concentric ridged rings and a serrated outer edge. Spell every word exactly correctly: MIRAMAR, FORKLIFT, TRAINING, OFFICIAL, SEAL, OSHA, COMPLIANT. Clean, symmetrical, professional, high detail. Square canvas, the seal fills most of the frame, must stay legible when scaled down to one inch.`;

async function gen(variant) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model: "gpt-image-1", prompt: PROMPT, size: "1024x1024", quality: "high" }),
  });
  if (!res.ok) { console.error(`HTTP ${res.status}:`, (await res.text()).slice(0, 400)); process.exit(1); }
  const json = await res.json();
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) { console.error("no b64_json in response"); process.exit(1); }
  const file = path.join(OUT, `seal-${variant}.png`);
  fs.writeFileSync(file, Buffer.from(b64, "base64"));
  console.log(`saved ${file}`);
}

gen(process.argv[2] || "a");
