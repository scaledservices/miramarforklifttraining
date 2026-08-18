# Course Hero Banner — Image Generation Briefs

Goal: replace flat diagram PNGs used as `hero_image` (top banner) with photoreal
scenes. Diagrams stay inline in the body. One photoreal banner per topic, reused
across EN/ES and course variants. Style reference: the 8 existing
`/images/training/photos/*-scene.png` (photoreal, diffused warehouse lighting,
brand-yellow PPE/forklift accents, landscape 1536x1024).

## Style suffix (append to every prompt)
"Photorealistic, natural diffused warehouse lighting, shallow depth of field,
landscape orientation, professional safety-training photography. Workers wear
correct PPE (hard hat, hi-vis vest, safety glasses). Yellow Toyota-style
counterbalance forklift. No text, no watermark, no logos."

## Banner briefs (14 to generate)
Each maps to the existing diagram filename stem it replaces as a banner.

1. warehouse-aisle — Warehouse aisle with tall pallet racking both sides, a
   forklift driving down the center, loading door at the far end. Sense of
   open travel lane.
2. aerial-lift-hero — Boom lift (articulating) elevated beside a steel
   structure, operator in basket with harness. Clear sky/industrial backdrop.
3. pre-shift-checklist — Operator standing at a parked forklift holding a
   clipboard, inspecting the forks/mast. Conveys "walk-around inspection."
4. osha-compliance — Training/classroom-meets-floor scene: instructor with a
   group of workers in PPE reviewing safety material near a forklift.
5. train-the-trainer-hero — A trainer demonstrating forklift controls to a
   small group of attentive adult trainees. Leadership/instruction mood.
6. safe-driving — Forklift moving through a warehouse, operator looking in
   direction of travel, load carried low and tilted back. Motion but safe.
7. pedestrian-safety — A forklift yielding to a pedestrian in a marked
   walkway, hi-vis, clear separation between person and truck.
8. stability-triangle — Photoreal three-quarter view of a counterbalance
   forklift carrying a load, slightly raised, conveying balance/center of
   gravity (concept conveyed by scene, not a drawn triangle).
9. scissor-lift-hero — Scissor lift raised with operator at height, guardrails
   up, indoor warehouse/industrial setting.
10. ppe-gloves — Close scene of a worker donning work gloves / PPE station:
    hard hat, hi-vis vest, gloves, safety glasses laid out or being worn.
11. parking-shutdown — Forklift properly parked: forks lowered flat to the
    ground, mast tilted forward, in a designated parking area, engine off.
12. load-center — Forklift carrying a pallet load close to the mast, forks
    low, showing the load held near the truck's center (heeled against the
    backrest).
13. ramps-slopes — Forklift driving straight up a loading-dock ramp with the
    load upgrade (load on the uphill side), correct incline travel.
14. forklift-hero — Hero shot: clean three-quarter studio-style photo of a
    yellow counterbalance forklift, no operator, brand-forward.

## Output
- Save to `client/public/images/training/photos/banners/<stem>.png` (staged
  first in `ai-staged/banners/` for the contact-sheet veto, then moved).
- 1536x1024, quality=high, gpt-image-1 `/v1/images/generations` (no reference
  image needed for from-scratch scenes; the diagram is NOT used as reference
  because we want a different (photoreal) composition, not the diagram redrawn).
- After veto, wire each banner in by changing the hero `img("<stem>.png")` to
  `photo("banners/<stem>.png")` in all content seeds, then `--refresh` the DB.
