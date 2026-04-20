import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, PlayCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface VideoStepProps {
  step: {
    id: number;
    title: string;
    config: any;
    progress: { status: string };
  };
  enrollmentId: number;
  onComplete: (result?: any) => void;
}

export default function VideoStep({ step, enrollmentId, onComplete }: VideoStepProps) {
  const { t } = useTranslation();
  const [marked, setMarked] = useState(step.progress.status === "completed");
  const config = step.config as any;
  const videoUrl = config?.video_url || config?.videoUrl || "";

  const markWatched = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/course-player/${enrollmentId}/video-progress`, {
        stepId: step.id,
        watchPercentage: 100,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setMarked(true);
      onComplete(data);
    },
  });

  const isYoutube = videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");
  const isVimeo = videoUrl.includes("vimeo.com");
  const isEmbeddable = isYoutube || isVimeo || videoUrl.includes("embed");

  return (
    <div className="space-y-6" data-testid="video-step">
      <h2 className="text-xl md:text-2xl font-bold" data-testid="text-step-title">{step.title}</h2>

      <Card>
        <CardContent className="p-0">
          {isEmbeddable && videoUrl ? (
            <div className="aspect-video w-full">
              <iframe
                src={videoUrl}
                className="w-full h-full rounded-md"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={step.title}
                data-testid="video-iframe"
              />
            </div>
          ) : (
            <div
              className="aspect-video w-full bg-muted flex flex-col items-center justify-center gap-3 rounded-md"
              data-testid="video-placeholder"
            >
              <PlayCircle className="h-16 w-16 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">
                {videoUrl ? t("lms.videoContent") : t("lms.videoAvailableSoon")}
              </p>
              {videoUrl && (
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary underline"
                  data-testid="link-video-external"
                >
                  {t("lms.openVideoNewTab")}
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {config?.description && (
        <p className="text-muted-foreground" data-testid="text-video-description">{config.description}</p>
      )}

      {marked ? (
        <div className="flex items-center gap-2 text-green-600" data-testid="text-video-completed">
          <Check className="h-5 w-5" />
          <span className="font-medium">{t("lms.markedAsWatched")}</span>
        </div>
      ) : (
        <Button
          onClick={() => markWatched.mutate()}
          disabled={markWatched.isPending}
          data-testid="button-mark-watched"
        >
          {markWatched.isPending ? t("lms.saving") : t("lms.markAsWatched")}
        </Button>
      )}
    </div>
  );
}
