import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link, Redirect } from "wouter";
import QRCode from "qrcode";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Gift, Copy, Share2, Users, DollarSign, Loader2, Check } from "lucide-react";

interface ReferralCodeData {
  id: number;
  userId: number;
  code: string;
  discountCodeId: number;
  referredBy: number | null;
  createdAt: string;
}

interface MineResponse {
  referralCode: ReferralCodeData | null;
  redemptionCount: number;
  totalSavings: number;
  referrerCreditDollars: number;
  referredDiscountPercent: number;
}

export default function ReferralProgram() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Query existing referral code
  const { data, isLoading } = useQuery<MineResponse>({
    queryKey: ["/api/referrals/mine"],
  });

  const referralCode = data?.referralCode;
  const redemptionCount = data?.redemptionCount ?? 0;
  const totalSavings = data?.totalSavings ?? 0;
  const referrerCredit = data?.referrerCreditDollars ?? 50;
  const referredDiscount = data?.referredDiscountPercent ?? 10;

  // Generate referral code mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/referrals/generate", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/referrals/mine"] });
      toast({ title: t("referral.codeGenerated") });
    },
    onError: (err: Error) => {
      toast({
        title: t("referral.generateFailed"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Build the shareable link
  const shareLink = referralCode
    ? `${window.location.origin}/book-training?ref=${referralCode.code}`
    : "";

  // Generate QR code
  useEffect(() => {
    if (!shareLink) {
      setQrDataUrl("");
      return;
    }
    QRCode.toDataURL(shareLink, {
      width: 240,
      margin: 2,
      color: { dark: "#4f3b3b", light: "#ffffff" },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("QR generation error:", err));
  }, [shareLink]);

  const handleCopyLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast({ title: t("referral.linkCopied") });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: t("referral.copyFailed"),
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (!shareLink || !navigator.share) return;
    try {
      await navigator.share({
        title: t("referral.shareTitle"),
        text: t("referral.shareText", {
          code: referralCode?.code ?? "",
          discount: referredDiscount,
        }),
        url: shareLink,
      });
    } catch {
      // User cancelled share — no-op
    }
  };

  if (!user) {
    return <Redirect to="/login" />;
  }

  return (
    <div className="min-h-screen bg-background" data-testid="referral-program-page">
      {/* Hero header */}
      <div className="bg-primary py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Gift className="h-8 w-8 text-primary-foreground" />
            <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground">
              {t("referral.pageTitle")}
            </h1>
          </div>
          <p className="text-primary-foreground/80 mt-1">
            {t("referral.pageSubtitle")}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : !referralCode ? (
          /* No code yet — prompt to generate */
          <Card className="text-center py-12">
            <CardContent className="pt-6">
              <Gift className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h2 className="text-xl font-semibold mb-2">
                {t("referral.noCodeTitle")}
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {t("referral.noCodeDesc", {
                  discount: referredDiscount,
                  credit: referrerCredit,
                })}
              </p>
              <Button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                size="lg"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("referral.generating")}
                  </>
                ) : (
                  t("referral.generateCode")
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Has a code — show full referral dashboard */
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left: Code + share */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-primary" />
                  {t("referral.yourReferralCode")}
                </CardTitle>
                <CardDescription>{t("referral.shareAndEarn")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Code display */}
                <div className="bg-brand-brown/10 border-2 border-dashed border-brand-brown/30 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    {t("referral.yourCode")}
                  </p>
                  <p className="text-2xl font-bold tracking-wider text-brand-brown">
                    {referralCode.code}
                  </p>
                </div>

                {/* Shareable link */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    {t("referral.shareableLink")}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareLink}
                      className="flex-1 rounded-md border border-input bg-muted px-3 py-2 text-sm"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleCopyLink}
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* QR Code */}
                {qrDataUrl && (
                  <div className="flex flex-col items-center pt-2">
                    <img
                      src={qrDataUrl}
                      alt={t("referral.qrAlt")}
                      className="rounded-lg border border-border"
                      width={200}
                      height={200}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {t("referral.qrHint")}
                    </p>
                  </div>
                )}

                {/* Share button (mobile) */}
                {typeof navigator !== "undefined" && "share" in navigator && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    {t("referral.shareNow")}
                  </Button>
                )}

                {/* How it works */}
                <div className="bg-muted/50 rounded-lg p-4 text-sm">
                  <p className="font-medium mb-2">
                    {t("referral.howItWorks")}
                  </p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>
                      {t("referral.step1", {
                        discount: referredDiscount,
                      })}
                    </li>
                    <li>
                      {t("referral.step2", {
                        credit: referrerCredit,
                      })}
                    </li>
                    <li>{t("referral.step3")}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Right: Stats */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    {t("referral.yourStats")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">
                        {redemptionCount}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {t("referral.referralsMade")}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">
                        ${totalSavings.toFixed(0)}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {t("referral.totalSavings")}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    {t("referral.yourEarnings")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <Badge
                      variant="secondary"
                      className="text-lg px-4 py-2 mb-3"
                    >
                      ${redemptionCount * referrerCredit}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      {t("referral.earnedFromReferrals", {
                        credit: referrerCredit,
                        count: redemptionCount,
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground text-center">
                    {t("referral.sharePrompt", {
                      code: referralCode.code,
                      discount: referredDiscount,
                      credit: referrerCredit,
                    })}
                  </p>
                  <div className="text-center mt-4">
                    <Button asChild variant="secondary">
                      <Link href="/book-training">{t("referral.bookNow")}</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
