# Image Generation Purpose Briefs — Miramar Course Assets
# Rule: every generation must read this brief first. The PROMPT must encode
# PURPOSE + LESSON INTENT, not just visual description. Reference: original SVG
# rendered to PNG (composition guide only — photoreal output, not flat vector).
#
# Common style suffix for all: "Professional industrial-safety training
# photography, realistic textures and natural diffused warehouse lighting,
# sharp focus, landscape orientation. Miramar brand: yellow/gold forklift
# (like a Hyster/Yale), operator in hi-vis vest where a person appears."

## HERO IMAGES (free-form, no pin constraints) — 8

### 1. warehouse-aisle-scene (Module 1 hero: "What is a Powered Industrial Truck")
PURPOSE: Set the workplace context — this is where students will operate.
SCENE: Wide warehouse aisle with tall pallet racking on both sides, pallets
stacked, a loading door visible at the far end, clean concrete floor with
marked travel lanes. No people required. Conveys: scale, orderliness, the
real environment.

### 2. ppe-workers-scene (Module 1 hero: PPE & authorization culture)
PURPOSE: Show what "properly equipped operator" looks like.
SCENE: Two workers in full PPE (hi-vis vests, hard hats, safety glasses,
work boots) standing in front of a parked yellow forklift in a warehouse,
confident posture, one holding a clipboard/checklist. Conveys: professionalism,
safety-first culture.

### 3. forklift-lifting-scene (Modules 1+4 hero: load handling)
PURPOSE: Show correct load handling at height.
SCENE: Yellow forklift raising a properly-palletized, shrink-wrapped load
toward a warehouse rack level, load tilted slightly back, forks level, a
spotter in hi-vis watching from a safe distance. Conveys: correct technique,
teamwork.

### 4. operator-at-controls-scene (Module 2 hero: operator responsibilities)
PURPOSE: Model correct operating posture.
SCENE: Operator seated in yellow forklift cab wearing hi-vis vest AND seat
belt, hands on controls, eyes forward, slight smile of focus. Cab interior
visible. Conveys: seatbelt use, attention, proper seating.

### 5. pre-inspection-scene (Module 5 hero: pre-shift inspection)
PURPOSE: Show inspection as a routine professional task.
SCENE: Operator in hi-vis with a checklist on a clipboard, crouched beside
the forks of a yellow forklift, visually examining the fork heel/chain area.
Warehouse background. Conveys: hands-on diligence, the checklist habit.

### 6. pedestrian-crossing-scene (Module 6 hero: pedestrian safety)
PURPOSE: Dramatize the pedestrian right-of-way rule.
SCENE: Yellow forklift STOPPED, operator looking at a pedestrian crossing in
a marked pedestrian walkway (zebra striping) inside a warehouse, pedestrian
in hi-vis making eye contact with the operator. Conveys: yield, eye contact,
marked walkways.

### 7. aerial-lift-scene (Aerial course hero)
PURPOSE: Context for the aerial/scissor lift course.
SCENE: A yellow scissor lift raised midway with an operator in the platform
wearing hi-vis and fall-protection harness, working near warehouse racking.
Conveys: elevated work done correctly with harness.

### 8. warehouse-aisle (img, Module 6 hero: travel rules)
PURPOSE: Show safe travel lanes and clearance.
SCENE: Warehouse aisle with clearly marked forklift travel lanes (yellow
floor lines), clearance zones around rack ends, one forklift traveling
slowly in-lane with load low. Conveys: lane discipline, clearance.

## HOTSPOT DIAGRAMS (prescriptive; pins must map) — 4 remaining

### 9. forklift-anatomy (USED TWICE: anatomy lesson + inspection points)
LESSON PINS: mast, forks, overhead guard, counterweight, data plate area,
tires, hydraulic controls (verify against current pin set in course-content.ts
before generating).
SCENE: Photorealistic SIDE PROFILE of a counterbalance forklift, clean
uncluttered background, entire truck in frame with margin, facing left.
Must clearly show: mast+forks (front), overhead guard (top), counterweight
(rear), data plate area (side of dash), pneumatic tires, operator seat with
controls. This is the single most-reused diagram — worth 2 candidate runs.

### 10. osha-compliance (Module 1: OSHA three-part training requirement)
LESSON INTENT: formal instruction + practical training + evaluation = certification.
This is more infographic than photo. OPTION: generate a photoreal triptych —
three panels left-to-right: (a) classroom/laptop learning, (b) hands-on
forklift practice with trainer, (c) evaluator with checklist observing operator.
Pins map to the three panels.

### 11. stability-triangle (Module 4: tip-over physics) — CAREFUL, QA said keep
the load-center ANIMATION but this static hotspot may stay diagrammatic.
LESSON PINS: front axle pivot points, rear steer pivot, center of gravity.
RECOMMEND: do NOT photo-replace; the geometric diagram teaches better.
Instead: polish the existing SVG (proportions) or leave. FLAG FOR PETER.

### 12. pre-shift-checklist (Module 5 hero diagram) — QA: "cut off at bottom,
clipped indicators" — replace with photoreal.
LESSON INTENT: walkaround inspection points around the truck.
SCENE: Three-quarter view of a yellow forklift, full truck in frame WITH
MARGIN at bottom (the old one was cut off), operator walking around it with
checklist. Clear view of: forks, mast, tires, overhead guard, engine bay,
counterweight, data plate. Bright even lighting so every pin target is visible.

## CERTIFICATE — 1

### 13. official-seal (certificate bottom-left, replaces vector seal)
PURPOSE: embossed gold official seal, reads "OFFICIAL SEAL" / "OSHA COMPLIANT"
feel without fake legal claims. Style: photorealistic embossed gold foil seal
on white/transparent background, circular, classic rosette with serrated edge,
subtle "MIRAMAR FORKLIFT TRAINING" arc text and "OFFICIAL SEAL" center or arc.
Must render legibly at ~84px diameter on the PDF. Square canvas, centered.

## GENERATION ORDER
1. forklift-anatomy (most reused, 2 runs, pick best)
2. pre-shift-checklist (QA-flagged broken)
3. warehouse-aisle-scene, ppe-workers-scene, forklift-lifting-scene
4. operator-at-controls, pre-inspection-scene, pedestrian-crossing, warehouse-aisle
5. aerial-lift-scene
6. osha-compliance (triptych)
7. official-seal
Skip stability-triangle (keep geometric; flag for Peter).
