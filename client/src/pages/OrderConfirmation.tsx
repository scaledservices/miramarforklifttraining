import { useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, ArrowRight, BookOpen, Users } from "lucide-react";
import { fireConfetti, fireTripleConfetti } from "@/lib/confetti";

export default function OrderConfirmation() {
  const { t } = useTranslation();
  const { orderId } = useParams<{ orderId: string }>();
  const { refetchUser } = useAuth();

  const confettiFired = useRef(false);

  useEffect(() => {
    refetchUser();
    queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
  }, []);

  const { data, isLoading, error } = useQuery<{ order: any; items: any[]; enrollments: any[] }>({
    queryKey: ["/api/orders", orderId],
  });

  useEffect(() => {
    if (data && !confettiFired.current) {
      confettiFired.current = true;
      if (data.order?.groupId) {
        fireTripleConfetti();
      } else {
        fireConfetti();
      }
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-4 w-64 mb-8" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">{t("order.notFound")}</h1>
        <p className="text-muted-foreground mb-8">{t("order.notFoundDesc")}</p>
        <Link href="/">
          <Button data-testid="button-go-home">{t("cta.goHome")}</Button>
        </Link>
      </div>
    );
  }

  const { order, items, enrollments } = data;
  const isGroupOrder = !!order.groupId;
  const firstEnrollment = enrollments && enrollments.length > 0 ? enrollments[0] : null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-10">
        <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2" data-testid="text-confirmation-title">{t("order.confirmed")}</h1>
        <p className="text-muted-foreground">
          {t("order.confirmedDesc")}
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <div>
              <p className="text-sm text-muted-foreground">{t("order.orderNumber")}</p>
              <p className="font-bold text-lg" data-testid="text-order-number">{order.orderNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{t("common.status")}</p>
              <p className="font-semibold text-green-600" data-testid="text-order-status">
                {order.status === "paid" ? t("common.paid") : order.status}
              </p>
            </div>
          </div>

          <Separator className="my-4" />

          <h3 className="font-semibold mb-3">{t("common.items")}</h3>
          <div className="space-y-3">
            {items.map((item: any) => (
              <div key={item.id} className="flex justify-between gap-4 text-sm" data-testid={`text-order-item-${item.id}`}>
                <span>
                  {t("order.courseItem", { id: item.courseId, quantity: item.quantity })}
                </span>
                <span className="font-medium">${(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="flex justify-between gap-2 font-bold text-lg">
            <span>{t("common.total")}</span>
            <span data-testid="text-order-total">${parseFloat(order.total).toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            {isGroupOrder ? (
              <Users className="w-5 h-5 text-accent" />
            ) : (
              <BookOpen className="w-5 h-5 text-accent" />
            )}
            <h3 className="font-bold text-lg">{t("order.nextSteps")}</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {isGroupOrder
              ? t("order.groupNextSteps")
              : t("order.individualNextSteps")}
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            {isGroupOrder ? (
              <Link href="/group">
                <Button className="bg-accent text-accent-foreground border-accent-border" data-testid="button-manage-group">
                  {t("cta.manageGroup")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            ) : (
              <Link href={firstEnrollment ? `/course/${firstEnrollment.id}` : "/dashboard"}>
                <Button className="bg-accent text-accent-foreground border-accent-border" data-testid="button-start-training">
                  {t("cta.startCourse")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            )}
            <Link href="/training-programs">
              <Button variant="outline" data-testid="button-browse-more">
                {t("cta.browseMore")}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
