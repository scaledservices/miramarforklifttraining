import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Check, X, Lightbulb } from "lucide-react";
import type { EmbeddedQuizBlock, QuizQuestion } from "@shared/lesson-blocks";

interface EmbeddedQuizProps {
  block: EmbeddedQuizBlock;
}

function isCorrect(q: QuizQuestion, selected: string[]): boolean {
  const correct = q.correctAnswers.split(",").map((s) => s.trim()).filter(Boolean);
  if (q.type === "mcq_multi") {
    return (
      correct.length === selected.length && correct.every((c) => selected.includes(c))
    );
  }
  return selected.length === 1 && selected[0] === correct[0];
}

/**
 * Inline knowledge check graded client-side with immediate feedback.
 * Unlike checkpoint steps it never blocks progress.
 */
export default function EmbeddedQuiz({ block }: EmbeddedQuizProps) {
  const { t } = useTranslation();
  // question index -> selected option texts
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  // question index -> graded result
  const [graded, setGraded] = useState<Record<number, boolean>>({});

  const select = (qi: number, option: string, multi: boolean) => {
    if (qi in graded) return;
    setAnswers((prev) => {
      const current = prev[qi] || [];
      if (multi) {
        return {
          ...prev,
          [qi]: current.includes(option)
            ? current.filter((o) => o !== option)
            : [...current, option],
        };
      }
      return { ...prev, [qi]: [option] };
    });
  };

  const check = (qi: number) => {
    const q = block.questions[qi];
    setGraded((prev) => ({ ...prev, [qi]: isCorrect(q, answers[qi] || []) }));
  };

  return (
    <div className="embedded-quiz my-6" data-testid="embedded-quiz">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="h-5 w-5 text-[#FF7F00]" aria-hidden="true" />
        <h3 className="text-base font-semibold m-0">{block.title || t("lms.quickCheck")}</h3>
      </div>
      <div className="space-y-4">
        {block.questions.map((q, qi) => {
          const selected = answers[qi] || [];
          const result = graded[qi];
          const isGraded = qi in graded;
          const multi = q.type === "mcq_multi";
          return (
            <div key={qi} className="embedded-quiz-question" data-testid={`embedded-quiz-question-${qi}`}>
              <p className="font-medium text-sm mb-2">{q.question}</p>
              <div className="space-y-1.5" role={multi ? "group" : "radiogroup"} aria-label={q.question}>
                {q.options.map((opt, oi) => {
                  const chosen = selected.includes(opt);
                  const correctOpts = q.correctAnswers.split(",").map((s) => s.trim());
                  const showCorrect = isGraded && correctOpts.includes(opt);
                  const showWrong = isGraded && chosen && !correctOpts.includes(opt);
                  return (
                    <button
                      key={oi}
                      type="button"
                      role={multi ? "checkbox" : "radio"}
                      aria-checked={chosen}
                      disabled={isGraded}
                      onClick={() => select(qi, opt, multi)}
                      className={`embedded-quiz-option ${chosen ? "embedded-quiz-option-selected" : ""} ${showCorrect ? "embedded-quiz-option-correct" : ""} ${showWrong ? "embedded-quiz-option-wrong" : ""}`}
                      data-testid={`embedded-quiz-q${qi}-option-${oi}`}
                    >
                      <span className={`embedded-quiz-radio ${multi ? "embedded-quiz-checkbox" : ""}`} aria-hidden="true">
                        {chosen && <span className="embedded-quiz-radio-dot" />}
                      </span>
                      <span className="flex-1 text-left">{opt}</span>
                      {showCorrect && <Check className="h-4 w-4 text-green-600 shrink-0" aria-hidden="true" />}
                      {showWrong && <X className="h-4 w-4 text-red-600 shrink-0" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
              <div aria-live="polite">
                {isGraded ? (
                  <div
                    className={`mt-2 flex items-start gap-2 text-sm rounded-md p-3 ${
                      result
                        ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                        : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                    }`}
                    data-testid={`embedded-quiz-feedback-${qi}`}
                  >
                    {result ? (
                      <Check className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
                    ) : (
                      <X className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
                    )}
                    <span>
                      <strong>{result ? t("lms.quizCorrect") : t("lms.quizIncorrect")}</strong>{" "}
                      {q.explanation}
                    </span>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    disabled={selected.length === 0}
                    onClick={() => check(qi)}
                    data-testid={`embedded-quiz-check-${qi}`}
                  >
                    {t("lms.checkAnswers")}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
