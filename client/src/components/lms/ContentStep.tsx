import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Check, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import InteractiveLesson from "./InteractiveLesson";
import type { LessonBlock } from "@shared/lesson-blocks";

interface ContentStepProps {
  step: {
    id: number;
    title: string;
    type: string;
    config: any;
    estimatedMinutes?: number | null;
    progress: { status: string };
  };
  enrollmentId: number;
  onComplete: (result?: any) => void;
}

export default function ContentStep({ step, enrollmentId, onComplete }: ContentStepProps) {
  const { t } = useTranslation();
  const [marked, setMarked] = useState(step.progress.status === "completed");
  const config = step.config as any;
  const blocks: LessonBlock[] | null =
    Array.isArray(config?.blocks) && config.blocks.length > 0 ? config.blocks : null;
  const htmlContent = config?.html_content || config?.htmlContent || config?.content || "";

  const markComplete = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/course-player/${enrollmentId}/content-complete`, {
        stepId: step.id,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setMarked(true);
      onComplete(data);
    },
  });

  return (
    <div className="space-y-6" data-testid="content-step">
      {step.estimatedMinutes && (
        <div className="text-xs text-muted-foreground" data-testid="text-estimated-time">
          {t("lms.minRead", { minutes: step.estimatedMinutes })}
        </div>
      )}

      {blocks ? (
        <InteractiveLesson blocks={blocks} />
      ) : htmlContent ? (
        <div
          className="lesson-renderer prose prose-sm md:prose-base max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
          data-testid="content-html"
        />
      ) : (
        <div>
          <h2 className="text-xl md:text-2xl font-bold mb-4" data-testid="text-step-title">{step.title}</h2>
          <p className="text-muted-foreground" data-testid="content-empty">
            {t("lms.contentAvailableSoon")}
          </p>
        </div>
      )}

      <div className="border-t pt-4">
        {marked ? (
          <div className="flex items-center gap-2 text-green-600" data-testid="text-content-completed">
            <Check className="h-5 w-5" />
            <span className="font-medium">{t("lms.completed")}</span>
          </div>
        ) : (
          <Button
            onClick={() => markComplete.mutate()}
            disabled={markComplete.isPending}
            size="lg"
            data-testid="button-mark-complete"
          >
            {markComplete.isPending ? t("lms.saving") : t("lms.continue")}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
