import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Check, Lock, PlayCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { creditWatch, watchedPercent, youtubeIdFrom } from "@shared/video-watch";

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

// --- YouTube IFrame Player API loader (singleton) ---
declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}
let ytApiPromise: Promise<any> | null = null;
function loadYouTubeApi(timeoutMs = 10000): Promise<any> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      ytApiPromise = null;
      reject(new Error("YouTube API timeout"));
    }, timeoutMs);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      window.clearTimeout(timer);
      resolve(window.YT);
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.async = true;
      s.onerror = () => {
        window.clearTimeout(timer);
        ytApiPromise = null;
        reject(new Error("YouTube API failed to load"));
      };
      document.head.appendChild(s);
    }
  });
  return ytApiPromise;
}

const TICK_MS = 1000;

export default function VideoStep({ step, enrollmentId, onComplete }: VideoStepProps) {
  const { t } = useTranslation();
  const [marked, setMarked] = useState(step.progress.status === "completed");
  const config = step.config as any;
  const videoUrl: string = config?.video_url || config?.videoUrl || "";
  const minWatch: number = Number(config?.min_watch_percentage) || 80;
  const ytId = youtubeIdFrom(videoUrl);
  const isVimeo = videoUrl.includes("vimeo.com");

  // Watch credit is persisted per enrollment + step + video, so a student who
  // leaves mid-video resumes their credit instead of starting over.
  const storageKey = `mft-video-watch:${enrollmentId}:${step.id}:${ytId ?? ""}`;
  const readSaved = (): { seconds: number; pct: number } => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      return {
        seconds: typeof saved?.seconds === "number" ? saved.seconds : 0,
        pct: typeof saved?.pct === "number" ? saved.pct : 0,
      };
    } catch {
      return { seconds: 0, pct: 0 };
    }
  };
  const [watchedPct, setWatchedPct] = useState<number>(() => readSaved().pct);
  const [trackingFailed, setTrackingFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (!ytId || marked) return;
    let cancelled = false;
    let interval: number | undefined;
    const saved = readSaved();
    let watchedSeconds = saved.seconds;
    setWatchedPct(saved.pct);
    let lastTime: number | null = null;

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled || !containerRef.current) return;
        const mount = document.createElement("div");
        containerRef.current.innerHTML = "";
        containerRef.current.appendChild(mount);
        playerRef.current = new YT.Player(mount, {
          host: "https://www.youtube-nocookie.com",
          videoId: ytId,
          width: "100%",
          height: "100%",
          playerVars: { rel: 0, modestbranding: 1, playsinline: 1, hl: document.documentElement.lang || "en" },
          events: {
            onError: () => { if (!cancelled) setTrackingFailed(true); },
          },
        });
        interval = window.setInterval(() => {
          const p = playerRef.current;
          if (!p?.getPlayerState) return;
          const playing = p.getPlayerState() === YT.PlayerState.PLAYING;
          const now = p.getCurrentTime?.() ?? 0;
          const duration = p.getDuration?.() ?? 0;
          watchedSeconds = creditWatch(watchedSeconds, lastTime, now, playing);
          lastTime = playing ? now : null;
          if (duration > 0) {
            const pct = watchedPercent(watchedSeconds, duration);
            setWatchedPct((prev) => (pct > prev ? pct : prev));
            try {
              localStorage.setItem(storageKey, JSON.stringify({ seconds: watchedSeconds, pct }));
            } catch { /* storage full / private mode */ }
          }
        }, TICK_MS);
      })
      .catch(() => {
        if (!cancelled) setTrackingFailed(true);
      });

    return () => {
      cancelled = true;
      if (interval) window.clearInterval(interval);
      try { playerRef.current?.destroy?.(); } catch { /* ignore */ }
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ytId, marked, storageKey]);

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
      try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
      onComplete(data);
    },
  });

  // Tracked mode: YouTube video + Player API loaded. If the API is blocked
  // (network/ad blocker) or the video is not YouTube, never dead-end the
  // student: fall back to a plain embed with honor-system completion.
  const tracked = !!ytId && !trackingFailed;
  const thresholdMet = !tracked || watchedPct >= minWatch;
  const embedSrc = ytId
    ? `https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1&playsinline=1`
    : isVimeo || videoUrl.includes("embed")
      ? videoUrl
      : "";

  return (
    <div className="space-y-6" data-testid="video-step">
      <h2 className="text-xl md:text-2xl font-bold" data-testid="text-step-title">{step.title}</h2>

      {config?.description && (
        <p className="text-muted-foreground" data-testid="text-video-description">{config.description}</p>
      )}

      <Card>
        <CardContent className="p-0">
          {tracked && !marked ? (
            <div
              ref={containerRef}
              className="aspect-video w-full rounded-md overflow-hidden bg-black"
              data-testid="video-player-tracked"
            />
          ) : embedSrc ? (
            <div className="aspect-video w-full">
              <iframe
                src={embedSrc}
                className="w-full h-full rounded-md"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
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

      {marked ? (
        <div className="flex items-center gap-2 text-green-600" data-testid="text-video-completed">
          <Check className="h-5 w-5" />
          <span className="font-medium">{t("lms.markedAsWatched")}</span>
        </div>
      ) : (
        <div className="space-y-3">
          {tracked && (
            <div className="space-y-1.5" data-testid="video-watch-progress">
              <div className="flex justify-between gap-2 text-sm text-muted-foreground">
                <span data-testid="text-video-watched-pct">
                  {t("lms.videoWatched", { pct: watchedPct, defaultValue: "Watched: {{pct}}%" })}
                </span>
                <span>{t("lms.videoRequired", { pct: minWatch, defaultValue: "{{pct}}% required" })}</span>
              </div>
              <Progress value={Math.min(100, (watchedPct / minWatch) * 100)} className="h-2" />
            </div>
          )}
          <Button
            onClick={() => markWatched.mutate()}
            disabled={!thresholdMet || markWatched.isPending}
            data-testid="button-mark-watched"
          >
            {!thresholdMet && <Lock className="h-4 w-4 mr-2" />}
            {markWatched.isPending
              ? t("lms.saving")
              : thresholdMet
                ? t("lms.videoContinue", { defaultValue: "I watched the video: continue" })
                : t("lms.videoKeepWatching", { defaultValue: "Keep watching to unlock the next step" })}
          </Button>
        </div>
      )}
    </div>
  );
}
