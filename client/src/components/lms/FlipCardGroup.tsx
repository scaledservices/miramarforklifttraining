import { useState } from "react";
import { useTranslation } from "react-i18next";
import { RotateCw } from "lucide-react";
import type { FlipCardsBlock } from "@shared/lesson-blocks";

interface FlipCardGroupProps {
  block: FlipCardsBlock;
}

/**
 * Grid of 3D flip cards: front shows a term, back the explanation.
 * Tap/click or Enter/Space flips. aria-pressed exposes flip state.
 */
export default function FlipCardGroup({ block }: FlipCardGroupProps) {
  const { t } = useTranslation();
  const [flipped, setFlipped] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div className="my-6" data-testid="flip-card-group">
      {block.title && <h3 className="text-lg font-semibold mb-1">{block.title}</h3>}
      <p className="text-xs text-muted-foreground mb-3">{t("lms.tapToFlip")}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {block.cards.map((card, i) => {
          const isFlipped = flipped.has(i);
          return (
            <button
              key={i}
              type="button"
              className={`flip-card ${isFlipped ? "flip-card-flipped" : ""}`}
              onClick={() => toggle(i)}
              aria-pressed={isFlipped}
              data-testid={`flip-card-${i}`}
            >
              <span className="flip-card-inner">
                <span className="flip-card-front">
                  <span className="flip-card-text">{card.front}</span>
                  <RotateCw className="h-4 w-4 opacity-50 shrink-0" aria-hidden="true" />
                </span>
                <span className="flip-card-back">
                  <span className="flip-card-text">{card.back}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
