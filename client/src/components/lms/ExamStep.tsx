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
        onComplete(data);
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

        <div className="space-y-4">
          {result.graded.map((g, idx) => {
            const question = questions.find((q) => q.id === g.questionId);
            return (
              <Card key={g.questionId} data-testid={`card-result-${g.questionId}`}>
                <CardHeader className="pb-2 flex flex-row items-start gap-2">
                  {g.correct ? (
                    <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <X className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <CardTitle className="text-sm font-medium">
                    {idx + 1}. {question?.question}
                  </CardTitle>
                </CardHeader>
                {g.explanation && (
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground" data-testid={`text-explanation-${g.questionId}`}>
                      {g.explanation}
                    </p>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

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
                  {(q.options as string[]).map((option, oi) => (
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
                  {(q.options as string[]).map((option, oi) => {
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
