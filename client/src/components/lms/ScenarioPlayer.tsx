import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Check, X, RotateCcw, MapPin } from "lucide-react";
import type { ScenarioBlock, ScenarioNode } from "@shared/lesson-blocks";

interface ScenarioPlayerProps {
  block: ScenarioBlock;
}

const START_ID = "__start__";

/**
 * Decision scenario: read a situation, pick a choice, get feedback.
 * Supports branching via choice.next -> block.nodes[].id.
 */
export default function ScenarioPlayer({ block }: ScenarioPlayerProps) {
  const { t } = useTranslation();
  const [nodeId, setNodeId] = useState(START_ID);
  const [picked, setPicked] = useState<number | null>(null);

  const startNode: ScenarioNode = {
    id: START_ID,
    prompt: block.prompt,
    image: block.image,
    choices: block.choices,
  };
  const node =
    nodeId === START_ID
      ? startNode
      : (block.nodes || []).find((n) => n.id === nodeId) || startNode;

  const choice = picked !== null ? node.choices[picked] : null;
  const nextNode = choice?.next
    ? (block.nodes || []).find((n) => n.id === choice.next)
    : null;

  const restart = () => {
    setNodeId(START_ID);
    setPicked(null);
  };

  return (
    <div
      className="my-6 rounded-lg border-2 border-[#4f3b3b]/20 dark:border-[#FFC326]/20 overflow-hidden"
      data-testid="scenario-player"
    >
      <div className="bg-[#4f3b3b] text-white px-4 py-2.5 flex items-center gap-2">
        <MapPin className="h-4 w-4 text-[#FFC326]" aria-hidden="true" />
        <span className="font-semibold text-sm">{block.title || t("lms.scenarioTitle")}</span>
      </div>
      <div className="p-4 space-y-4">
        {node.image && (
          <img src={node.image} alt="" className="w-full h-auto rounded-md" />
        )}
        <div
          className="text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: node.prompt }}
          data-testid="scenario-prompt"
        />
        <div className="space-y-2" role="group" aria-label={t("lms.scenarioChoices")}>
          {node.choices.map((c, i) => {
            const isPicked = picked === i;
            const showState = picked !== null && isPicked;
            return (
              <button
                key={i}
                type="button"
                disabled={picked !== null}
                onClick={() => setPicked(i)}
                className={`scenario-choice ${showState ? (c.correct ? "scenario-choice-correct" : "scenario-choice-wrong") : ""} ${picked !== null && !isPicked ? "scenario-choice-dimmed" : ""}`}
                data-testid={`scenario-choice-${i}`}
              >
                <span className="scenario-choice-letter" aria-hidden="true">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1 text-left">{c.text}</span>
                {showState &&
                  (c.correct ? (
                    <Check className="h-4 w-4 text-green-600 shrink-0" aria-hidden="true" />
                  ) : (
                    <X className="h-4 w-4 text-red-600 shrink-0" aria-hidden="true" />
                  ))}
              </button>
            );
          })}
        </div>
        <div aria-live="polite">
          {choice && (
            <div
              className={`rounded-md p-3 text-sm flex items-start gap-2 ${
                choice.correct
                  ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                  : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300"
              }`}
              data-testid="scenario-feedback"
            >
              {choice.correct ? (
                <Check className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
              ) : (
                <X className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
              )}
              <span>
                <strong>
                  {choice.correct ? t("lms.scenarioGoodCall") : t("lms.scenarioRisky")}
                </strong>{" "}
                {choice.feedback}
              </span>
            </div>
          )}
        </div>
        {choice && (
          <div className="flex gap-2">
            {nextNode && (
              <Button
                size="sm"
                onClick={() => {
                  setNodeId(nextNode.id);
                  setPicked(null);
                }}
                data-testid="scenario-next"
              >
                {t("lms.continue")}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={restart} data-testid="scenario-restart">
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              {t("lms.tryAgain")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
