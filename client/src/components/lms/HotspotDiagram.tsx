import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import type { HotspotDiagramBlock } from "@shared/lesson-blocks";

interface HotspotDiagramProps {
  block: HotspotDiagramBlock;
}

/**
 * Image with numbered hotspot pins. Tap/click or keyboard-activate a pin to
 * reveal its label + description in a detail card below the image (reliable on
 * mobile where floating tooltips clip). Tap again to dismiss.
 */
export default function HotspotDiagram({ block }: HotspotDiagramProps) {
  const { t } = useTranslation();
  const [active, setActive] = useState<number | null>(null);
  const [visited, setVisited] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    setActive((prev) => (prev === i ? null : i));
    setVisited((prev) => new Set(prev).add(i));
  };

  const activeSpot = active !== null ? block.hotspots[active] : null;

  return (
    <div className="my-6" data-testid="hotspot-diagram">
      <p className="text-xs text-muted-foreground mb-2">{t("lms.hotspotHint")}</p>
      <div className="relative rounded-lg overflow-hidden border bg-muted/30">
        <img src={block.src} alt={block.alt} className="w-full h-auto block" />
        {block.hotspots.map((spot, i) => (
          <button
            key={i}
            type="button"
            className={`hotspot-marker ${active === i ? "hotspot-marker-active" : ""} ${visited.has(i) ? "hotspot-marker-visited" : ""}`}
            style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
            onClick={() => toggle(i)}
            aria-expanded={active === i}
            aria-label={`${i + 1}. ${spot.label}`}
            data-testid={`hotspot-pin-${i}`}
          >
            {i + 1}
          </button>
        ))}
      </div>
      {block.caption && (
        <p className="text-xs text-muted-foreground mt-2 text-center italic">{block.caption}</p>
      )}
      <div aria-live="polite">
        {activeSpot && (
          <div
            className="mt-3 p-4 rounded-lg border border-[#FFC326]/60 bg-[#FFC326]/10 dark:bg-[#FFC326]/5 flex items-start gap-3"
            data-testid="hotspot-detail"
          >
            <span className="shrink-0 w-6 h-6 rounded-full bg-[#FFC326] text-black text-xs font-bold flex items-center justify-center mt-0.5">
              {active! + 1}
            </span>
            <div className="flex-1">
              <p className="font-semibold text-sm">{activeSpot.label}</p>
              <p className="text-sm text-muted-foreground mt-1">{activeSpot.description}</p>
            </div>
            <button
              type="button"
              onClick={() => setActive(null)}
              className="shrink-0 p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
              aria-label={t("lms.close")}
              data-testid="hotspot-detail-close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-2" data-testid="hotspot-progress">
        {t("lms.hotspotProgress", { visited: visited.size, total: block.hotspots.length })}
      </p>
    </div>
  );
}
