import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Check, X, RotateCcw, AlertCircle } from "lucide-react";
import { fireTripleConfetti } from "@/lib/confetti";
import { useTranslation } from "react-i18next";

interface Question {
  id: number;
  question: string;
  type: "mcq_single" | "mcq_multi";
  options: string[];
  order: number;
}

interface GradedQuestion {
  questionId: number;
  userAnswer: any;
  // 2026-09-07 (Alberto): server grader now returns this so the review screen
  // can highlight correct-vs-chosen options without exposing answers pre-submit.
  correctAnswer?: any;
  correct: boolean;
  explanation: string | null;
}

interface ExamResult {
  score: number;
  passed: boolean;
  graded: GradedQuestion[];
  attemptsRemaining: number;
  allComplete?: boolean;
  certification?: any;
}

interface ExamStepProps {
  step: {
    id: number;
    title: string;
    config: any;
    progress: { status: string };
  };
  questions: Question[];
  enrollmentId: number;
  onComplete: (result?: any) => void;
}

export default function ExamStep({ step, questions, enrollmentId, onComplete }: ExamStepProps) {
  const { t } = useTranslation();
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [result, setResult] = useState<ExamResult | null>(null);
  const config = step.config as any;
  const passingScore = config?.passing_score || 70;
  const isAlreadyComplete = step.progress.status === "completed";

  // Shuffle each question's option order per attempt so correct answers are
  // not clustered on the same letter (QA found long runs of "B"). Answers
  // are submitted as option TEXT, not indices, so display order is purely
  // cosmetic and the server-side grader is unaffected.
  //
  // 2026-09-07 (Alberto): NEVER shuffle True/False questions. Shuffling them
  // produced "False / True" ordering, which reads as a bug. T/F must always
  // be True first, False second.
  const isTrueFalse = (opts: string[]) =>
    opts.length === 2 && opts.every((o) => /^(true|false)$/i.test(o.trim()));
  const orderOptions = (opts: string[]) =>
    isTrueFalse(opts)
      ? [...opts].sort((a, b) => (/^true$/i.test(a.trim()) ? -1 : 0) - (/^true$/i.test(b.trim()) ? -1 : 0))
      : [...opts].sort(() => Math.random() - 0.5);

  const [shuffledOptions, setShuffledOptions] = useState<Record<number, string[]>>(() => {
    const map: Record<number, string[]> = {};
    for (const q of questions) {
      map[q.id] = orderOptions(q.options);
    }
    return map;
  });

  const submitExam = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/course-player/${enrollmentId}/exam-submit`, {
        stepId: step.id,
        answers,
      });
      return res.json();
    },
    onSuccess: (data: ExamResult) => {
      setResult(data);
      if (data.passed) {
        fireTripleConfetti();
        // 2026-09-03 (Alberto): do NOT advance immediately - the student
        // must be able to review which questions they missed (he scored 96
        // in the live test and could not see the one he got wrong). The
        // Continue button on the results screen calls onComplete.
      }
    },
  });

  const handleSingleAnswer = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleMultiAnswer = (questionId: number, option: string, checked: boolean) => {
    setAnswers((prev) => {
      const current = (prev[questionId] as string[]) || [];
      if (checked) {
        return { ...prev, [questionId]: [...current, option] };
      }
      return { ...prev, [questionId]: current.filter((o: string) => o !== option) };
    });
  };

  const handleRetry = () => {
    setAnswers({});
    setResult(null);
    setShuffledOptions(() => {
      const map: Record<number, string[]> = {};
      for (const q of questions) {
        map[q.id] = orderOptions(q.options);
      }
      return map;
    });
  };

  const allAnswered = questions.every((q) => {
    const answer = answers[q.id];
    if (q.type === "mcq_single") return !!answer;
    return Array.isArray(answer) && answer.length > 0;
  });

  if (isAlreadyComplete && !result) {
    return (
      <div className="space-y-4" data-testid="exam-step-completed">
        <h2 className="text-xl md:text-2xl font-bold" data-testid="text-step-title">{step.title}</h2>
        <div className="flex items-center gap-2 text-green-600">
          <Check className="h-5 w-5" />
          <span className="font-medium">{t("lms.examPassedAlready")}</span>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="space-y-6" data-testid="exam-results">
        <h2 className="text-xl md:text-2xl font-bold" data-testid="text-step-title">{step.title}</h2>

        <Card>
          <CardContent className="py-6 flex flex-col items-center gap-4">
            {result.passed ? (
              <div className="text-center space-y-2">
                <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-green-600" data-testid="text-exam-passed">{t("lms.examPassed")}</h3>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mx-auto">
                  <X className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-red-600" data-testid="text-exam-failed">{t("lms.examNotPassed")}</h3>
              </div>
            )}
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <Badge variant="secondary" data-testid="badge-exam-score">
                {t("lms.scoreLabel", { score: result.score })}
              </Badge>
              <Badge variant="secondary" data-testid="badge-passing-score">
                {t("lms.passingLabel", { score: passingScore })}
              </Badge>
              <Badge variant="secondary" data-testid="badge-attempts-remaining">
                {t("lms.attemptsRemaining", { count: result.attemptsRemaining })}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {(() => {
          // 2026-09-07 (Alberto): show ALL questions in their original
          // sequence (missed question #22 must appear between 21 and 23, not
          // floated to the top), and render every answer option with the
          // user's selection and the correct answer both highlighted. The
          // missed-count header stays as a summary banner above the list.
          const missedCount = result.graded.filter((g) => !g.correct).length;

          const normalizeTF = (opts: string[]) =>
            opts.length === 2 && opts.every((o) => /^(true|false)$/i.test(o.trim()))
              ? [...opts].sort((a, b) => (/^true$/i.test(a.trim()) ? -1 : 0) - (/^true$/i.test(b.trim()) ? -1 : 0))
              : opts;

          return (
            <div className="space-y-4">
              {missedCount > 0 && (
                <p className="text-sm font-medium text-foreground" data-testid="text-missed-count">
                  {t("lms.missedReviewTitle", { count: missedCount, defaultValue: `Review the ${missedCount} question${missedCount === 1 ? "" : "s"} you missed:` })}
                </p>
              )}
              {result.graded.map((g, gi) => {
                const question = questions.find((q) => q.id === g.questionId);
                if (!question) return null;
                // g.correctAnswer is provided by the server grader (the GET
                // endpoint strips correctAnswers for security — pre-submit).
                const correctAnswer: any = g.correctAnswer;
                const isCorrectOpt = (opt: string) =>
                  Array.isArray(correctAnswer) ? correctAnswer.includes(opt) : correctAnswer === opt;
                const isUserOpt = (opt: string) =>
                  Array.isArray(g.userAnswer) ? g.userAnswer.includes(opt) : g.userAnswer === opt;
                const displayOptions = normalizeTF(question.options);
                return (
                  <Card key={g.questionId} data-testid={`card-result-${g.questionId}`} className={g.correct ? "" : "border-red-300 dark:border-red-800"}>
                    <CardHeader className="pb-2 flex flex-row items-start gap-2">
                      {g.correct ? (
                        <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                      )}
                      <CardTitle className="text-sm font-medium">
                        {gi + 1}. {question.question}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-1.5">
                      {displayOptions.map((opt, oi) => {
                        const correct = isCorrectOpt(opt);
                        const chosen = isUserOpt(opt);
                        return (
                          <div
                            key={oi}
                            data-testid={`review-opt-${g.questionId}-${oi}`}
                            className={
                              "flex items-center gap-2 rounded px-2 py-1 text-sm " +
                              (correct
                                ? "bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200 font-medium"
                                : chosen
                                  ? "bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200 line-through"
                                  : "text-muted-foreground")
                            }
                          >
                            {correct ? (
                              <Check className="h-4 w-4 shrink-0 text-green-600" />
                            ) : chosen ? (
                              <X className="h-4 w-4 shrink-0 text-red-600" />
                            ) : (
                              <span className="h-4 w-4 shrink-0" />
                            )}
                            <span>{opt}</span>
                            {correct && <span className="ml-auto text-xs font-normal">{t("lms.correctAnswer", { defaultValue: "Correct" })}</span>}
                            {!correct && chosen && <span className="ml-auto text-xs font-normal">{t("lms.yourAnswer", { defaultValue: "Your answer" })}</span>}
                          </div>
                        );
                      })}
                      {g.explanation && (
                        <p className="text-sm text-muted-foreground pt-1" data-testid={`text-explanation-${g.questionId}`}>
                          {g.explanation}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          );
        })()}

        {result.passed && (
          <Button onClick={() => onComplete(result)} data-testid="button-continue-after-exam">
            {t("lms.continueAfterExam", { defaultValue: "Continue" })}
          </Button>
        )}

        {!result.passed && result.attemptsRemaining > 0 && (
          <Button onClick={handleRetry} data-testid="button-retry-exam">
            <RotateCcw className="h-4 w-4 mr-2" />
            {t("lms.retryExam")}
          </Button>
        )}

        {!result.passed && result.attemptsRemaining <= 0 && (
          <div className="flex items-center gap-2 text-muted-foreground" data-testid="text-no-attempts">
            <AlertCircle className="h-5 w-5" />
            <span>{t("lms.noAttemptsRemaining")}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="exam-step">
      <div>
        <h2 className="text-xl md:text-2xl font-bold" data-testid="text-step-title">{step.title}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("lms.questionsToPass", { count: questions.length, plural: questions.length !== 1 ? "s" : "", score: passingScore })}
        </p>
      </div>

      <div className="space-y-6">
        {questions.map((q, idx) => (
          <Card key={q.id} data-testid={`card-question-${q.id}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                {idx + 1}. {q.question}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {q.type === "mcq_single" ? (
                <RadioGroup
                  value={answers[q.id] || ""}
                  onValueChange={(val) => handleSingleAnswer(q.id, val)}
                  data-testid={`radio-group-${q.id}`}
                >
                  {(shuffledOptions[q.id] ?? q.options).map((option, oi) => (
                    <div key={oi} className="flex items-center gap-3 py-1.5">
                      <RadioGroupItem
                        value={option}
                        id={`q${q.id}-o${oi}`}
                        data-testid={`radio-${q.id}-${oi}`}
                      />
                      <Label htmlFor={`q${q.id}-o${oi}`} className="cursor-pointer flex-1">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <div className="space-y-2" data-testid={`checkbox-group-${q.id}`}>
                  {(shuffledOptions[q.id] ?? q.options).map((option, oi) => {
                    const checked = ((answers[q.id] as string[]) || []).includes(option);
                    return (
                      <div key={oi} className="flex items-center gap-3 py-1.5">
                        <Checkbox
                          id={`q${q.id}-o${oi}`}
                          checked={checked}
                          onCheckedChange={(c) => handleMultiAnswer(q.id, option, !!c)}
                          data-testid={`checkbox-${q.id}-${oi}`}
                        />
                        <Label htmlFor={`q${q.id}-o${oi}`} className="cursor-pointer flex-1">
                          {option}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        onClick={() => submitExam.mutate()}
        disabled={!allAnswered || submitExam.isPending}
        data-testid="button-submit-exam"
      >
        {submitExam.isPending ? t("lms.submitting") : t("lms.submitExam")}
      </Button>
    </div>
  );
}
