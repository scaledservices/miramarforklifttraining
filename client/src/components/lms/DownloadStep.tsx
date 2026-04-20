import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Check, Download, FileText, ChevronRight, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DownloadStepProps {
  step: {
    id: number;
    title: string;
    config: any;
    progress: { status: string };
  };
  enrollmentId: number;
  onComplete: (result?: any) => void;
}

interface DownloadItem {
  label: string;
  url: string;
  filename: string;
}

export default function DownloadStep({ step, enrollmentId, onComplete }: DownloadStepProps) {
  const { t } = useTranslation();
  const [marked, setMarked] = useState(step.progress.status === "completed");
  const config = step.config as any;
  const description = config?.description || "";
  const downloads: DownloadItem[] = config?.downloads || [];
  const important = config?.important || "";

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
    <div className="space-y-6" data-testid="download-step">
      <div className="flex items-center gap-3">
        <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-full">
          <Download className="h-5 w-5 text-purple-600 dark:text-purple-300" />
        </div>
        <h2 className="text-lg font-semibold" data-testid="text-download-title">{step.title}</h2>
      </div>

      {description && (
        <p className="text-muted-foreground" data-testid="text-download-description">{description}</p>
      )}

      <div className="space-y-3">
        {downloads.map((dl, i) => (
          <a
            key={i}
            href={dl.url}
            download={dl.filename}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:bg-muted transition-colors group"
            data-testid={`link-download-${i}`}
          >
            <FileText className="h-8 w-8 text-red-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm group-hover:underline">{dl.label}</p>
              <p className="text-xs text-muted-foreground">{t("lms.pdfDocument")}</p>
            </div>
            <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
          </a>
        ))}
      </div>

      {important && (
        <div className="flex items-start gap-2 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800" data-testid="text-download-important">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-300">{important}</p>
        </div>
      )}

      <div className="border-t pt-4">
        {marked ? (
          <div className="flex items-center gap-2 text-green-600" data-testid="text-download-completed">
            <Check className="h-5 w-5" />
            <span className="font-medium">{t("lms.completed")}</span>
          </div>
        ) : (
          <Button
            onClick={() => markComplete.mutate()}
            disabled={markComplete.isPending}
            size="lg"
            data-testid="button-download-continue"
          >
            {markComplete.isPending ? t("lms.saving") : t("lms.continue")}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
