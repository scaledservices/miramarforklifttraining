# Fable 5 Mission: Course Experience Enhancement

## Context

Miramar Forklift Training sells 4 online OSHA-compliant courses (Forklift Operator, Aerial Lift, Forklift TTT, Aerial Lift TTT), each in EN + ES. Current lessons are static HTML strings with basic SVG placeholders (emoji + text). No video, no interactivity. The LMS needs a major upgrade: real illustrations, AI-generated photos, interactive elements (hotspots, drag-drop, scenarios, flip cards, embedded quizzes), and bilingual EN/ES parity throughout.

## Current Architecture

- Course content: `scripts/course-content*.ts` (8 files, ~4,300 lines total)
- LMS components: `client/src/components/lms/` (ContentStep.tsx, CheckpointStep.tsx, ExamStep.tsx, VideoStep.tsx, DownloadStep.tsx)
- Course player: `client/src/pages/CoursePlayer.tsx` (501 lines)
- Admin editor: `client/src/pages/admin/AdminCourseEditor.tsx` (690 lines)
- Lesson CSS: `client/src/index.css` lines 291-361 (.lesson-renderer styles)
- Images: `client/public/images/training/` (15 basic SVGs, ~800 bytes each)
- Schema: `courseSteps.config` is jsonb, currently stores `{ html_content: string }`. `examQuestions` table for quiz questions.
- Step types: "lesson", "checkpoint", "exam", "video", "download", "content"
- Seeder: `scripts/seed-online-courses.ts` and `scripts/demo-seed.ts`

## The Mission

### Phase 1: Content Block Format + Interactive Lesson Renderer

1. Design a structured content block format for the `config` jsonb field. Replace flat `html_content` strings with a `blocks` array:
   ```
   { "blocks": [
     { "type": "hero_image", "src": "...", "alt": "..." },
     { "type": "heading", "level": 2, "text": "..." },
     { "type": "paragraph", "html": "..." },
     { "type": "list", "items": ["...", "..."] },
     { "type": "callout", "variant": "tip"|"warning", "text": "..." },
     { "type": "key_takeaways", "items": ["...", "..."] },
     { "type": "hotspot_diagram", "src": "...", "hotspots": [{ "x": N, "y": N, "label": "...", "description": "..." }] },
     { "type": "flip_cards", "cards": [{ "front": "...", "back": "..." }] },
     { "type": "embedded_quiz", "questions": [...] },
     { "type": "drag_drop", "prompt": "...", "items": [...], "targets": [...] },
     { "type": "scenario", "prompt": "...", "choices": [{ "text": "...", "correct": bool, "feedback": "..." }] }
   ]}
   ```

2. Build `client/src/components/lms/InteractiveLesson.tsx` — renders the blocks array. Must be backwards-compatible (if `html_content` exists, render it as before; if `blocks` exists, render block-by-block).

3. Update `ContentStep.tsx` to delegate to `InteractiveLesson` when `blocks` config is present.

### Phase 2: Interactive Components

Build these new components in `client/src/components/lms/`:

4. `HotspotDiagram.tsx` — Image with clickable hotspot markers. User clicks a numbered pin, sees a tooltip/card with the label and description. SVG-friendly (works with both SVG and raster images). Mobile: tap to reveal, tap again to dismiss.

5. `FlipCardGroup.tsx` — Grid of flip cards. Front shows a term/label, back shows the explanation. CSS 3D flip animation. Mobile: tap to flip.

6. `EmbeddedQuiz.tsx` — Inline knowledge check within a lesson. 1-3 questions, immediate feedback (green check for correct, red X for incorrect with explanation). Does NOT block progress (unlike checkpoint steps). Uses the same question format as examQuestions.

7. `DragDropExercise.tsx` — Drag items to matching targets. Use HTML5 drag-and-drop or pointer events. Mobile: tap-to-select then tap-to-place pattern. Types: matching (match items to categories) and ordering (arrange steps in sequence).

8. `ScenarioPlayer.tsx` — Branching scenario with decision points. User reads a situation, picks from choices, gets feedback. Can branch (choice A leads to scenario B). Simple version: single decision with feedback for each choice.

### Phase 3: Professional Illustrations

9. Replace all 15 existing SVG placeholders in `client/public/images/training/` with professional instructional diagrams. Keep the same filenames so existing references work. Each SVG should be a real diagram, not an emoji placeholder:

   - `forklift-hero.svg` — Forklift side view with labeled parts (mast, forks, counterweight, overhead guard, data plate, tires, backrest)
   - `osha-compliance.svg` — 3-part OSHA requirement infographic (formal instruction + practical training + evaluation)
   - `warehouse-aisle.svg` — Warehouse aisle cross-section showing narrow vs wide aisle, clearance zones
   - `stability-triangle.svg` — Top-down forklift with stability triangle overlay, center of gravity point, tip-over zone
   - `load-center.svg` — Side view showing load center distance and how capacity changes
   - `pre-shift-checklist.svg` — Forklift walkaround with numbered inspection points
   - `pedestrian-safety.svg` — Forklift blind spots, right-of-way zones, pedestrian separation
   - `safe-driving.svg` — Proper driving posture, steering techniques, visibility
   - `ramps-slopes.svg` — Forklift on ramp with correct load orientation (load upgrade when ascending)
   - `ppe-gloves.svg` — Required PPE: gloves, safety vest, hard hat, safety shoes, eye protection
   - `parking-shutdown.svg` — Parking procedure: lower forks, neutral, brake, key out, block wheels
   - `dock-safety.svg` — Dock area with truck-trailer, wheel chocks, dock plate, trailer creep
   - `aerial-lift-hero.svg` — Aerial lift (boom type) with labeled components
   - `scissor-lift-hero.svg` — Scissor lift with labeled components
   - `train-the-trainer-hero.svg` — Instructor training concept diagram

10. Add NEW illustration SVGs as needed for interactive elements (forklift anatomy for hotspot diagram, etc.)

### Phase 4: AI-Generated Photographic Content

11. Generate realistic training photos using the image_generate tool. For each lesson, create a photographic image to complement the diagram. Store in `client/public/images/training/photos/`. Categories needed:
    - Warehouse environment (aisles, racking, loading docks) — 5-6 images
    - Forklift operation (operator at controls, lifting, traveling) — 5-6 images
    - Safety scenarios (correct vs incorrect operation, near-miss) — 4-5 images
    - Equipment close-ups (data plate, forks, mast, controls) — 4-5 images
    - Pre-inspection (walkaround, specific checkpoints) — 3-4 images
    - PPE worn correctly — 2-3 images
    - Aerial lift operation — 3-4 images
    - Training/classroom scenes — 2-3 images

    Use Miramar brand context: warehouse environments, professional forklift operators, safety-focused imagery. Realistic, not cartoonish. Diverse operators.

### Phase 5: Update Course Content

12. Update `scripts/course-content.ts` (Forklift Operator EN) — pilot course. Replace `lessonHtml()` calls with structured `blocks` arrays. Add interactive elements where they enhance learning:
    - Module 0 (Welcome): Add OSHA compliance hotspot diagram
    - Module 1 (Basics): Add forklift anatomy hotspot diagram, OSHA class flip cards
    - Module 2 (Stability): Add interactive stability triangle, load center drag-drop
    - Module 3 (Pre-Op): Add pre-inspection hotspot walkaround, embedded quiz
    - Module 4 (Safe Driving): Add pedestrian safety scenario, embedded quiz
    - Module 5 (Ramps/Docks): Add ramp orientation scenario, dock safety hotspot
    - Module 6 (Parking): Add parking procedure drag-drop (sequence the steps)
    - Module 7 (Site-Specific): Add employer responsibilities flip cards
    - Add photographic hero images to each lesson

13. Update `scripts/course-content-es.ts` (Forklift Operator ES) — translate all new interactive content to Spanish.

14. Update `scripts/course-content-aerial.ts` and `scripts/course-content-aerial-es.ts` — apply same enhancement pattern for the Aerial Lift course.

15. Update `scripts/course-content-forklift-ttt.ts`, `scripts/course-content-forklift-ttt-es.ts`, `scripts/course-content-aerial-ttt.ts`, `scripts/course-content-aerial-ttt-es.ts` — apply same pattern for TTT courses.

### Phase 6: Video Content

16. The existing `VideoStep.tsx` component supports YouTube/Vimeo embeds. Add video steps to courses where video adds value:
    - If no real video is available, create animated SVG/CSS diagrams for key concepts (stability triangle animation, load center animation, tip-over demonstration)
    - Add these as "content" type steps with animated SVG content (not video steps, since no video URLs exist yet)
    - The animated diagrams should loop and be self-explanatory without audio

### Phase 7: CSS + Styling

17. Update `client/src/index.css` to add styles for new interactive elements:
    - `.hotspot-marker` — clickable pin styling
    - `.flip-card` — 3D flip card CSS
    - `.drag-drop-item` / `.drag-drop-target` — drag-drop styling
    - `.scenario-choice` — scenario button styling
    - `.embedded-quiz` — inline quiz styling
    - All must have dark mode variants (`.dark .hotspot-marker` etc.)
    - All must be mobile-responsive

### Phase 8: Admin Editor Updates

18. Update `client/src/pages/admin/AdminCourseEditor.tsx` to support editing the new block format. The admin should be able to:
    - View blocks in a lesson
    - Reorder blocks (up/down buttons)
    - Add/remove blocks
    - Edit block content (text fields, image URL, hotspot coordinates, quiz questions)
    - Preview the lesson as the student would see it

### Phase 9: Seeder Updates

19. Update `scripts/seed-online-courses.ts` and/or `scripts/demo-seed.ts` to seed the new block-format content into the database.

## Constraints

- Do NOT change payment logic, Authorize.net code, or checkout flow
- Do NOT touch certificate generation logic
- Do NOT remove existing test IDs (data-testid attributes)
- Do NOT change the database schema (use existing jsonb config field)
- Do NOT introduce new npm packages without checking if the functionality can be achieved with existing dependencies
- Do NOT push to GitHub or deploy
- Use existing Shadcn/UI components where possible (Card, Button, Input, Dialog, Badge, etc.)
- Use existing brand colors: Gold #FFC326, brown #4f3b3b, green #019E7C, orange #FF7F00
- All interactive elements must work on mobile (tap, not just mouse)
- All interactive elements must be keyboard-accessible
- Maintain backwards compatibility: lessons with `html_content` must still render
- All new content must be in both English and Spanish

## Context Frugality

- Only read files directly relevant to the current task
- Prefer grep to locate, then read specific regions
- Never read lockfiles, node_modules, or generated files
- Sample large files first (head/tail/grep), then targeted reads
- The existing course content files are large (500-740 lines each). Read the structure first (grep for "module:", "title:", "type:"), then read specific modules you're working on
- Don't read all 8 content files at once — work on one course at a time

## Verification

Before reporting done:
1. Run `npm run check` — zero NEW TypeScript errors (pre-existing errors in server/storage.ts and shared/schema.ts are expected)
2. Run `npm run build` — must pass
3. Point to specific evidence that each deliverable is complete
4. If something is NOT verified, say so explicitly
5. Commit work with `git add -A && git commit -m "feat: course experience enhancement - interactive lessons, illustrations, photos, bilingual"`
