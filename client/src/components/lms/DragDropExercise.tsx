import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Check, X, RotateCcw } from "lucide-react";
import type { DragDropBlock, DragDropItem } from "@shared/lesson-blocks";

interface DragDropExerciseProps {
  block: DragDropBlock;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Matching: place each item into its category bucket.
 * Ordering: tap the shuffled steps in the correct sequence.
 * Interaction model is tap-to-select then tap-to-place (works with touch,
 * mouse and keyboard); HTML5 drag-and-drop works as a desktop shortcut.
 */
export default function DragDropExercise({ block }: DragDropExerciseProps) {
  const { t } = useTranslation();
  const initialPool = useMemo(() => shuffle(block.items), [block.items]);

  // matching state: itemId -> targetId
  const [placements, setPlacements] = useState<Record<string, string>>({});
  // ordering state: item ids in the sequence the user built
  const [sequence, setSequence] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const isOrdering = block.mode === "ordering";
  const byId = useMemo(
    () => Object.fromEntries(block.items.map((it) => [it.id, it])),
    [block.items]
  );

  const poolItems = isOrdering
    ? initialPool.filter((it) => !sequence.includes(it.id))
    : initialPool.filter((it) => !(it.id in placements));

  const reset = () => {
    setPlacements({});
    setSequence([]);
    setSelected(null);
    setChecked(false);
  };

  const placeOnTarget = (targetId: string, itemId?: string) => {
    const id = itemId ?? selected;
    if (!id || checked) return;
    setPlacements((prev) => ({ ...prev, [id]: targetId }));
    setSelected(null);
  };

  const addToSequence = (itemId: string) => {
    if (checked) return;
    setSequence((prev) => [...prev, itemId]);
  };

  const removeFromSequence = (itemId: string) => {
    if (checked) return;
    setSequence((prev) => prev.filter((id) => id !== itemId));
  };

  const itemCorrect = (item: DragDropItem, position?: number): boolean => {
    if (isOrdering) {
      return block.items[position ?? -1]?.id === item.id;
    }
    return placements[item.id] === item.targetId;
  };

  const allPlaced = isOrdering
    ? sequence.length === block.items.length
    : Object.keys(placements).length === block.items.length;

  const allCorrect =
    checked &&
    (isOrdering
      ? sequence.every((id, pos) => block.items[pos]?.id === id)
      : block.items.every((it) => placements[it.id] === it.targetId));

  return (
    <div className="my-6" data-testid="drag-drop-exercise">
      <p className="font-medium text-sm mb-1">{block.prompt}</p>
      <p className="text-xs text-muted-foreground mb-3">
        {isOrdering ? t("lms.dragDropOrderHint") : t("lms.dragDropMatchHint")}
      </p>

      {/* Item pool */}
      {poolItems.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 p-3 rounded-lg border border-dashed bg-muted/30" data-testid="drag-drop-pool">
          {poolItems.map((it) => (
            <button
              key={it.id}
              type="button"
              draggable={!checked}
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", it.id);
                setSelected(it.id);
              }}
              onClick={() =>
                isOrdering ? addToSequence(it.id) : setSelected(selected === it.id ? null : it.id)
              }
              aria-pressed={selected === it.id}
              className={`drag-drop-item ${selected === it.id ? "drag-drop-item-selected" : ""}`}
              data-testid={`drag-drop-item-${it.id}`}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}

      {isOrdering ? (
        <ol className="space-y-2 mb-4" data-testid="drag-drop-sequence">
          {block.items.map((_, pos) => {
            const id = sequence[pos];
            const item = id ? byId[id] : null;
            const correct = item ? itemCorrect(item, pos) : false;
            return (
              <li key={pos} className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#4f3b3b] text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {pos + 1}
                </span>
                {item ? (
                  <button
                    type="button"
                    onClick={() => removeFromSequence(item.id)}
                    disabled={checked}
                    className={`drag-drop-item flex-1 justify-between ${checked ? (correct ? "drag-drop-item-correct" : "drag-drop-item-wrong") : ""}`}
                    data-testid={`drag-drop-slot-${pos}`}
                  >
                    <span>{item.label}</span>
                    {checked &&
                      (correct ? (
                        <Check className="h-4 w-4 text-green-600" aria-hidden="true" />
                      ) : (
                        <X className="h-4 w-4 text-red-600" aria-hidden="true" />
                      ))}
                  </button>
                ) : (
                  <span className="drag-drop-target flex-1" data-testid={`drag-drop-slot-${pos}`}>
                    &nbsp;
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {(block.targets || []).map((target) => {
            const placed = block.items.filter((it) => placements[it.id] === target.id);
            return (
              <div
                key={target.id}
                role="button"
                tabIndex={0}
                onClick={() => placeOnTarget(target.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    placeOnTarget(target.id);
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  placeOnTarget(target.id, e.dataTransfer.getData("text/plain"));
                }}
                className={`drag-drop-target ${selected ? "drag-drop-target-ready" : ""}`}
                aria-label={t("lms.dragDropPlaceIn", { target: target.label })}
                data-testid={`drag-drop-target-${target.id}`}
              >
                <p className="font-semibold text-sm mb-2">{target.label}</p>
                <div className="flex flex-wrap gap-1.5 min-h-8">
                  {placed.map((it) => {
                    const correct = itemCorrect(it);
                    return (
                      <button
                        key={it.id}
                        type="button"
                        disabled={checked}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (checked) return;
                          setPlacements((prev) => {
                            const next = { ...prev };
                            delete next[it.id];
                            return next;
                          });
                        }}
                        className={`drag-drop-item drag-drop-item-small ${checked ? (correct ? "drag-drop-item-correct" : "drag-drop-item-wrong") : ""}`}
                        data-testid={`drag-drop-placed-${it.id}`}
                      >
                        {it.label}
                        {checked &&
                          (correct ? (
                            <Check className="h-3.5 w-3.5 text-green-600" aria-hidden="true" />
                          ) : (
                            <X className="h-3.5 w-3.5 text-red-600" aria-hidden="true" />
                          ))}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div aria-live="polite">
        {checked && (
          <p
            className={`text-sm font-medium mb-3 ${allCorrect ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}
            data-testid="drag-drop-result"
          >
            {allCorrect ? t("lms.dragDropAllCorrect") : t("lms.dragDropSomeWrong")}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        {!checked && (
          <Button
            size="sm"
            disabled={!allPlaced}
            onClick={() => setChecked(true)}
            data-testid="drag-drop-check"
          >
            {t("lms.checkAnswers")}
          </Button>
        )}
        {(checked || Object.keys(placements).length > 0 || sequence.length > 0) && (
          <Button size="sm" variant="outline" onClick={reset} data-testid="drag-drop-reset">
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            {t("lms.reset")}
          </Button>
        )}
      </div>
    </div>
  );
}
