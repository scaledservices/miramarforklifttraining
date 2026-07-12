import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BookOpen, TrendingUp, Award, ChevronRight, ShoppingCart, GraduationCap, AlertTriangle, Lightbulb } from "lucide-react";
import GroupLayout from "./GroupLayout";

// Course recommendation logic based on completed certifications
const COURSE_RECOMMENDATIONS: Record<string, { slug: string; title: string; reason: string }[]> = {
  "online-forklift-operator-certification": [
    { slug: "online-aerial-scissor-lift-training", title: "Aerial & Scissor Lift Certification", reason: "Expand your team's qualifications with aerial lift certification" },
    { slug: "online-forklift-train-the-trainer", title: "Forklift Train the Trainer", reason: "Build internal training capacity — train your own operators" },
  ],
  "online-aerial-scissor-lift-certification": [
    { slug: "online-forklift-operator-training", title: "Forklift Operator Certification", reason: "Complete your team's forklift certification" },
    { slug: "online-aerial-train-the-trainer", title: "Aerial Lift Train the Trainer", reason: "Build internal training capacity for aerial lifts" },
  ],
  "online-forklift-train-the-trainer": [
    { slug: "online-aerial-train-the-trainer", title: "Aerial Lift Train the Trainer", reason: "Expand your trainer qualifications to aerial lifts" },
  ],
};

export default function GroupDashboard() {
  const { t } = useTranslation();

  const { data: groupsData, isLoading: groupsLoading } = useQuery<{ groups: any[] }>({
    queryKey: ["/api/groups"],
  });

  const group = groupsData?.groups?.[0];

  const { data: membersData, isLoading: membersLoading } = useQuery<{ members: any[] }>({
    queryKey: ["/api/groups", group?.id, "members"],
    enabled: !!group?.id,
  });

  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useQuery<{ enrollments: any[] }>({
    queryKey: ["/api/groups", group?.id, "enrollments"],
    enabled: !!group?.id,
  });

  const { data: certsData, isLoading: certsLoading } = useQuery<{ certifications: any[] }>({
    queryKey: ["/api/groups", group?.id, "certifications"],
    enabled: !!group?.id,
  });

  const isLoading = groupsLoading || membersLoading || enrollmentsLoading || certsLoading;

  const memberCount = membersData?.members?.length || 0;
  const totalEnrollments = enrollmentsData?.enrollments?.length || 0;
  const completedEnrollments = enrollmentsData?.enrollments?.filter((e: any) => e.status === "completed").length || 0;
  // Rate is over ASSIGNED seats — buying spare seats shouldn't drag the
  // displayed completion percentage down.
  const assignedEnrollments = enrollmentsData?.enrollments?.filter((e: any) => e.userId).length || 0;
  const completionRate = assignedEnrollments > 0 ? Math.round((completedEnrollments / assignedEnrollments) * 100) : 0;
  const totalCerts = certsData?.certifications?.length || 0;
  const unassignedSeats = enrollmentsData?.enrollments?.filter((e: any) => !e.userId).length || 0;

  const navCards = [
    {
      title: t("group.members"),
      description: t("group.membersDesc"),
      icon: Users,
      href: "/group/members",
      stat: t("group.membersCount", { count: memberCount }),
      testId: "card-nav-members",
    },
    {
      title: t("group.seatAssignments"),
      description: t("group.seatAssignmentsDesc"),
      icon: BookOpen,
      href: "/group/seats",
      stat: t("group.unassigned", { count: unassignedSeats }),
      testId: "card-nav-seats",
    },
    {
      title: t("group.progress"),
      description: t("group.progressDesc"),
      icon: TrendingUp,
      href: "/group/progress",
      stat: t("group.completionPercent", { percent: completionRate }),
      testId: "card-nav-progress",
    },
    {
      title: t("group.certifications"),
      description: t("group.certificationsDesc"),
      icon: Award,
      href: "/group/certifications",
      stat: t("group.issuedCount", { count: totalCerts }),
      testId: "card-nav-certifications",
    },
  ];

  if (groupsLoading) {
    return (
      <GroupLayout>
        <div className="space-y-6 p-6">
          <Skeleton className="h-8 w-64" data-testid="skeleton-title" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </GroupLayout>
    );
  }

  if (!group) {
    return (
      <GroupLayout>
        <div className="flex items-center justify-center min-h-[400px]" data-testid="no-group-message">
          <div className="text-center space-y-2">
            <Users className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold">{t("group.noCrewFound")}</h2>
            <p className="text-muted-foreground">{t("group.noCrewFoundDesc")}</p>
          </div>
        </div>
      </GroupLayout>
    );
  }

  return (
    <GroupLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-group-name">{group.name}</h1>
            <p className="text-muted-foreground">{t("group.crewAdminDashboard")}</p>
          </div>
          <Badge variant="secondary" data-testid="badge-group-id">{t("group.crewNumber", { id: group.id })}</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card data-testid="stat-members">
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("group.members")}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-2xl font-bold" data-testid="text-member-count">{memberCount}</div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="stat-enrollments">
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("group.totalEnrollments")}</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-2xl font-bold" data-testid="text-enrollment-count">{totalEnrollments}</div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="stat-completion">
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("group.completionRate")}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-2xl font-bold" data-testid="text-completion-rate">{completionRate}%</div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="stat-certifications">
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("group.certifications")}</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-2xl font-bold" data-testid="text-cert-count">{totalCerts}</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {navCards.map((card) => (
            <Link key={card.href} href={card.href}>
              <Card className="hover-elevate cursor-pointer" data-testid={card.testId}>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
                    <card.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{card.title}</h3>
                    <p className="text-sm text-muted-foreground">{card.description}</p>
                    <p className="text-sm font-medium mt-1">{card.stat}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {!isLoading && totalEnrollments > 0 && unassignedSeats === 0 && (
          <Card data-testid="card-buy-more">
            <CardContent className="flex items-center justify-between gap-4 p-6">
              <div>
                <h3 className="font-semibold">{t("group.needMoreSeats")}</h3>
                <p className="text-sm text-muted-foreground">{t("group.needMoreSeatsDesc")}</p>
              </div>
              <Link href="/p/online-forklift-operator-training?seats=5">
                <Button data-testid="button-buy-more-seats">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {t("group.buyMoreSeats")}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Course Recommendations based on completed certifications */}
        {!isLoading && totalCerts > 0 && (() => {
          const certs = certsData?.certifications || [];
          const recommendations: { slug: string; title: string; reason: string }[] = [];
          const seenSlugs = new Set<string>();

          certs.forEach((cert: any) => {
            const courseSlug = cert.courseSlug || cert.course?.slug;
            const recs = COURSE_RECOMMENDATIONS[courseSlug];
            if (recs) {
              recs.forEach(rec => {
                if (!seenSlugs.has(rec.slug)) {
                  seenSlugs.add(rec.slug);
                  recommendations.push(rec);
                }
              });
            }
          });

          // Also check for upcoming certification expirations
          const upcomingExpirations = certs.filter((cert: any) => {
            if (!cert.expiresAt) return false;
            const expiry = new Date(cert.expiresAt);
            const daysUntilExpiry = Math.floor((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return daysUntilExpiry <= 90 && daysUntilExpiry >= 0;
          });

          if (recommendations.length === 0 && upcomingExpirations.length === 0) return null;

          return (
            <div className="space-y-4">
              {recommendations.length > 0 && (
                <Card data-testid="card-course-recommendations">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-500" />
                      Recommended Next Steps for Your Team
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {recommendations.map((rec) => (
                      <div key={rec.slug} className="flex items-center justify-between gap-4 p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <GraduationCap className="h-8 w-8 text-primary" />
                          <div>
                            <p className="font-medium">{rec.title}</p>
                            <p className="text-sm text-muted-foreground">{rec.reason}</p>
                          </div>
                        </div>
                        <Link href={`/p/${rec.slug}`}>
                          <Button size="sm" variant="outline">
                            Learn More
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {upcomingExpirations.length > 0 && (
                <Card data-testid="card-cert-expirations" className="border-orange-400">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      Upcoming Certification Expirations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {upcomingExpirations.map((cert: any) => {
                      const expiry = new Date(cert.expiresAt);
                      const daysUntilExpiry = Math.floor((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      return (
                        <div key={cert.id} className="flex items-center justify-between gap-4 p-3 rounded-lg border border-orange-200 bg-orange-50">
                          <div>
                            <p className="font-medium">{cert.userName || cert.courseName || "Team member"}</p>
                            <p className="text-sm text-muted-foreground">
                              {cert.courseName || "Certification"} expires in {daysUntilExpiry} days ({expiry.toLocaleDateString()})
                            </p>
                          </div>
                          <Link href={`/p/online-forklift-operator-training`}>
                            <Button size="sm" variant="outline">
                              Recertify Now
                            </Button>
                          </Link>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
            </div>
          );
        })()}
      </div>
    </GroupLayout>
  );
}
