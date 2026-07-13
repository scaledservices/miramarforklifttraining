/**
 * Structured lesson content block format stored in courseSteps.config (jsonb).
 *
 * A lesson config is either the legacy shape `{ html_content: string }` or the
 * new shape `{ blocks: LessonBlock[] }`. Renderers must support both.
 */

export interface HeroImageBlock {
  type: "hero_image";
  src: string;
  alt: string;
  caption?: string;
}

export interface ImageBlock {
  type: "image";
  src: string;
  alt: string;
  caption?: string;
}

export interface HeadingBlock {
  type: "heading";
  /** 2, 3 or 4 — h1 is reserved for the page title */
  level: 2 | 3 | 4;
  text: string;
}

export interface ParagraphBlock {
  type: "paragraph";
  /** Inline HTML allowed (strong, em, a, br) */
  html: string;
}

export interface ListBlock {
  type: "list";
  ordered?: boolean;
  /** Inline HTML allowed in items */
  items: string[];
}

export interface CalloutBlock {
  type: "callout";
  variant: "tip" | "warning";
  /** Inline HTML allowed */
  text: string;
}

export interface KeyTakeawaysBlock {
  type: "key_takeaways";
  items: string[];
}

export interface Hotspot {
  /** Percentage 0-100 from left edge of the image */
  x: number;
  /** Percentage 0-100 from top edge of the image */
  y: number;
  label: string;
  description: string;
}

export interface HotspotDiagramBlock {
  type: "hotspot_diagram";
  src: string;
  alt: string;
  caption?: string;
  hotspots: Hotspot[];
}

export interface FlipCard {
  front: string;
  back: string;
}

export interface FlipCardsBlock {
  type: "flip_cards";
  title?: string;
  cards: FlipCard[];
}

/** Same shape as examQuestions rows so questions can be reused between the two */
export interface QuizQuestion {
  question: string;
  type: "mcq_single" | "mcq_multi";
  options: string[];
  /** Option text for mcq_single; comma-separated option texts for mcq_multi */
  correctAnswers: string;
  explanation: string;
}

export interface EmbeddedQuizBlock {
  type: "embedded_quiz";
  title?: string;
  questions: QuizQuestion[];
}

export interface DragDropItem {
  id: string;
  label: string;
  /** matching mode: id of the target this item belongs to */
  targetId?: string;
}

export interface DragDropTarget {
  id: string;
  label: string;
}

export interface DragDropBlock {
  type: "drag_drop";
  /**
   * matching: place each item on its category target.
   * ordering: arrange items into the correct sequence — `items` is authored
   * in the correct order and shuffled for display.
   */
  mode: "matching" | "ordering";
  prompt: string;
  items: DragDropItem[];
  /** Required for matching mode */
  targets?: DragDropTarget[];
}

export interface ScenarioChoice {
  text: string;
  correct?: boolean;
  feedback: string;
  /** Branching: id of the ScenarioNode to continue to after feedback */
  next?: string;
}

export interface ScenarioNode {
  id: string;
  prompt: string;
  image?: string;
  choices: ScenarioChoice[];
}

export interface ScenarioBlock {
  type: "scenario";
  title?: string;
  /** Situation text for the first decision (inline HTML allowed) */
  prompt: string;
  image?: string;
  choices: ScenarioChoice[];
  /** Optional additional nodes for branching (choice.next -> node.id) */
  nodes?: ScenarioNode[];
}

export type LessonBlock =
  | HeroImageBlock
  | ImageBlock
  | HeadingBlock
  | ParagraphBlock
  | ListBlock
  | CalloutBlock
  | KeyTakeawaysBlock
  | HotspotDiagramBlock
  | FlipCardsBlock
  | EmbeddedQuizBlock
  | DragDropBlock
  | ScenarioBlock;

export interface LessonBlocksConfig {
  blocks: LessonBlock[];
}

export const LESSON_BLOCK_TYPES: LessonBlock["type"][] = [
  "hero_image",
  "image",
  "heading",
  "paragraph",
  "list",
  "callout",
  "key_takeaways",
  "hotspot_diagram",
  "flip_cards",
  "embedded_quiz",
  "drag_drop",
  "scenario",
];
