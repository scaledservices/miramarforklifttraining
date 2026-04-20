import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Check, X, HelpCircle, ChevronRight } from "lucide-react";
import { fireConfetti } from "@/lib/confetti";
import { useTranslation } from "react-i18next";

interface CheckpointStepProps {
  step: {
    id: number;
    title: string;
    config: any;
    progress: { status: string };
  };
  questions: {
    id: number;
    question: string;
    type: string;
    options: string[];
    order: number;
  }[];
  enrollmentId: number;
  onComplete: (result?: any) => void;
}

export default function CheckpointStep({ step, questions, enrollmentId, onComplete }: CheckpointStepProps) {
  const { t } = useTranslation();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [graded, setGraded] = useState<any[]>([]);
  const [score, setScore] = useState(0);

  const isCompleted = step.progress.status === "completed";

  const submitCheckpoint = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/course-player/${enrollmentId}/exam-submit`, {
        stepId: step.id,
        answers,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setSubmitted(true);
      setGraded(data.graded || []);
      setScore(data.score || 0);
      fireConfetti();
    },
  });

  if (isCompleted) {
    return (
      <div className="space-y-4" data-testid="checkpoint-completed">
        <div className="flex items-center gap-2 text-green-600">
          <Check className="h-5 w-5" />
          <span className="font-medium text-lg">{t("lms.checkpointComplete")}</span>
        </div>
        <p className="text-muted-foreground">{t("lms.checkpointAlreadyDone")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="checkpoint-step">
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
          <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-300" />
        </div>
        <div>
          <h2 className="text-lg font-semibold" data-testid="text-checkpoint-title">{step.title}</h2>
          <p className="text-sm text-muted-foreground">{t("lms.checkpointSubtitle")}</p>
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((q, qi) => {
          const gradedQ = graded.find((g: any) => g.questionId === q.id);

          return (
            <div
              key={q.id}
              className={`p-4 rounded-lg border ${
                gradedQ
                  ? gradedQ.correct
                    ? "border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700"
                    : "border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700"
                  : "border-border bg-card"
              }`}
              data-testid={`checkpoint-question-${qi}`}
            >
              <p className="font-medium mb-3">
                {qi + 1}. {q.question}
              </p>

              <RadioGroup
                value={answers[q.id] || ""}
                onValueChange={(val) => setAnswers({ ...answers, [q.id]: val })}
                disabled={submitted}
                className="space-y-2"
              >
                {(q.options as string[]).map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <RadioGroupItem value={opt} id={`q${q.id}-o${oi}`} />
                    <Label htmlFor={`q${q.id}-o${oi}`} className="cursor-pointer text-sm">
                      {opt}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              {gradedQ && (
                <div className={`mt-3 flex items-start gap-2 text-sm ${gradedQ.correct ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                  {gradedQ.correct ? <Check className="h-4 w-4 mt-0.5 shrink-0" /> : <X className="h-4 w-4 mt-0.5 shrink-0" />}
                  <span>{gradedQ.explanation}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {submitted ? (
        <div className="border-t pt-4 space-y-4">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <Check className="h-5 w-5" />
            <span className="font-medium">{t("lms.checkpointComplete")}</span>
          </div>
          <p className="text-sm text-muted-foreground" data-testid="text-checkpoint-score">
            {t("lms.checkpointScoreMsg", { score })}
          </p>
          <Button
            onClick={() => onComplete({ score, graded })}
            data-testid="button-continue-checkpoint"
          >
            {t("lms.continue")}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => submitCheckpoint.mutate()}
          disabled={submitCheckpoint.isPending || Object.keys(answers).length < questions.length}
          size="lg"
          data-testid="button-submit-checkpoint"
        >
          {submitCheckpoint.isPending ? t("lms.checking") : t("lms.checkAnswers")}
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      )}
    </div>
  );
}
