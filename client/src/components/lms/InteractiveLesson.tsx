import { useTranslation } from "react-i18next";
import { Lightbulb, AlertTriangle, ClipboardList } from "lucide-react";
import type { LessonBlock } from "@shared/lesson-blocks";
import HotspotDiagram from "./HotspotDiagram";
import FlipCardGroup from "./FlipCardGroup";
import EmbeddedQuiz from "./EmbeddedQuiz";
import DragDropExercise from "./DragDropExercise";
import ScenarioPlayer from "./ScenarioPlayer";

interface InteractiveLessonProps {
  blocks: LessonBlock[];
}

function BlockRenderer({ block, index }: { block: LessonBlock; index: number }) {
  const { t } = useTranslation();

  switch (block.type) {
    case "hero_image":
      return (
        <figure className="m-0">
          <img
            src={block.src}
            alt={block.alt}
            className="lesson-hero-image"
            data-testid={`block-hero-${index}`}
          />
          {block.caption && (
            <figcaption className="text-xs text-muted-foreground -mt-4 mb-4 text-center italic">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
    case "image":
      return (
        <figure className="my-5 mx-0">
          <img
            src={block.src}
            alt={block.alt}
            className="w-full h-auto rounded-lg border"
            data-testid={`block-image-${index}`}
          />
          {block.caption && (
            <figcaption className="text-xs text-muted-foreground mt-2 text-center italic">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
    case "heading": {
      const Tag = `h${block.level}` as "h2" | "h3" | "h4";
      return <Tag data-testid={`block-heading-${index}`}>{block.text}</Tag>;
    }
    case "paragraph":
      return (
        <p
          dangerouslySetInnerHTML={{ __html: block.html }}
          data-testid={`block-paragraph-${index}`}
        />
      );
    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag data-testid={`block-list-${index}`}>
          {block.items.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </Tag>
      );
    }
    case "callout":
      return (
        <div
          className={`callout ${block.variant === "tip" ? "callout-tip" : "callout-warning"} flex items-start gap-2`}
          data-testid={`block-callout-${index}`}
        >
          {block.variant === "tip" ? (
            <Lightbulb className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
          ) : (
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
          )}
          <span>
            <strong>{block.variant === "tip" ? t("lms.tipLabel") : t("lms.warningLabel")}:</strong>{" "}
            <span dangerouslySetInnerHTML={{ __html: block.text }} />
          </span>
        </div>
      );
    case "key_takeaways":
      return (
        <div className="key-takeaways" data-testid={`block-takeaways-${index}`}>
          <h4 className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" aria-hidden="true" />
            {t("lms.keyTakeaways")}
          </h4>
          <ul>
            {block.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      );
    case "hotspot_diagram":
      return <HotspotDiagram block={block} />;
    case "flip_cards":
      return <FlipCardGroup block={block} />;
    case "embedded_quiz":
      return <EmbeddedQuiz block={block} />;
    case "drag_drop":
      return <DragDropExercise block={block} />;
    case "scenario":
      return <ScenarioPlayer block={block} />;
    default:
      return null;
  }
}

/**
 * Renders the structured `blocks` lesson format. Legacy `html_content`
 * lessons are handled by ContentStep directly, not here.
 */
export default function InteractiveLesson({ blocks }: InteractiveLessonProps) {
  return (
    <div
      className="lesson-renderer prose prose-sm md:prose-base max-w-none dark:prose-invert"
      data-testid="interactive-lesson"
    >
      {blocks.map((block, i) => (
        <BlockRenderer key={i} block={block} index={i} />
      ))}
    </div>
  );
}
