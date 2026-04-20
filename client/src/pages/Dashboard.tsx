import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Clock, PlayCircle, Award, GraduationCap } from "lucide-react";
import { Redirect } from "wouter";

interface EnrollmentWithCourse {
  id: number;
  userId: number | null;
  courseId: number;
  orderId: number;
  status: string;
  enrolledAt: string;
  completedAt: string | null;
  certificationId?: number | null;
  course?: {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    category: string | null;
    thumbnailUrl: string | null;
  };
  progress?: {
    completedSteps: number;
    totalSteps: number;
    percentage: number;
    estimatedMinutesRemaining: number;
  };
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();

  if (user?.role === "group_admin") {
    return <Redirect to="/group" />;
  }

  const { data, isLoading } = useQuery<{ enrollments: EnrollmentWithCourse[] }>({
    queryKey: ["/api/enrollments"],
  });

  const enrollments = data?.enrollments ?? [];

  return (
    <div className="min-h-screen bg-background" data-testid="dashboard-page">
      <div className="bg-primary py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground" data-testid="text-dashboard-title">
            {t("dashboard.welcomeBack", { name: user?.name || t("dashboard.learner") })}
          </h1>
          <p className="text-primary-foreground/80 mt-1">
            {t("dashboard.trackProgress")}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-3" />
                  <Skeleton className="h-3 w-1/2 mb-4" />
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : enrollments.length === 0 ? (
          <Card data-testid="empty-enrollments">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <BookOpen className="h-16 w-16 text-muted-foreground" />
              <h2 className="text-xl font-semibold" data-testid="text-empty-title">{t("dashboard.noCourses")}</h2>
              <p className="text-muted-foreground text-center max-w-md">
                {t("dashboard.noCoursesDesc")}
              </p>
              <Link href="/online-forklift-certification">
                <Button data-testid="button-browse-courses">
                  {t("cta.browseCourses")}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((enrollment) => {
              const progress = enrollment.progress;
              const percentage = progress?.percentage ?? 0;
              const isComplete = enrollment.status === "completed";

              return (
                <Card key={enrollment.id} data-testid={`card-enrollment-${enrollment.id}`}>
                  <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
                    <CardTitle className="text-base leading-tight">
                      {enrollment.course?.title || t("dashboard.courseNumber", { id: enrollment.courseId })}
                    </CardTitle>
                    {isComplete ? (
                      <Badge variant="default" className="bg-green-600 shrink-0" data-testid={`badge-status-${enrollment.id}`}>
                        <Award className="h-3 w-3 mr-1" />
                        {t("common.complete")}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="shrink-0" data-testid={`badge-status-${enrollment.id}`}>
                        {t("common.inProgress")}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {enrollment.course?.category && (
                      <p className="text-sm text-muted-foreground">{enrollment.course.category}</p>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="font-medium" data-testid={`text-progress-${enrollment.id}`}>
                          {t("dashboard.percentComplete", { percent: percentage })}
                        </span>
                        {progress && (
                          <span className="text-muted-foreground" data-testid={`text-steps-${enrollment.id}`}>
                            {t("dashboard.stepsProgress", { completed: progress.completedSteps, total: progress.totalSteps })}
                          </span>
                        )}
                      </div>
                      <Progress value={percentage} data-testid={`progress-bar-${enrollment.id}`} />
                    </div>

                    {progress && progress.estimatedMinutesRemaining > 0 && !isComplete && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span data-testid={`text-time-remaining-${enrollment.id}`}>
                          {t("dashboard.minRemaining", { minutes: progress.estimatedMinutesRemaining })}
                        </span>
                      </div>
                    )}

                    <div className="pt-2">
                    <Link href={isComplete && enrollment.certificationId ? `/certifications/${enrollment.certificationId}` : `/course/${enrollment.id}`}>
                      <Button
                        className="w-full"
                        variant={isComplete ? "secondary" : "default"}
                        data-testid={`button-resume-${enrollment.id}`}
                      >
                        {isComplete ? (
                          <>
                            <GraduationCap className="h-4 w-4 mr-2" />
                            {t("cta.viewCertificate")}
                          </>
                        ) : (
                          <>
                            <PlayCircle className="h-4 w-4 mr-2" />
                            {t("cta.resumeCourse")}
                          </>
                        )}
                      </Button>
                    </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
