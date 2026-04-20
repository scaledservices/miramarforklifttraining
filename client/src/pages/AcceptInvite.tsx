import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { brand } from "@shared/config/brand";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, AlertCircle, UserPlus, AlertTriangle, LogOut } from "lucide-react";

function useToken() {
  const params = new URLSearchParams(window.location.search);
  return params.get("token");
}

export default function AcceptInvite() {
  const { t } = useTranslation();
  const token = useToken();
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading, user, login, register, logout, isLoggingIn, isRegistering } = useAuth();
  const { toast } = useToast();
  const [emailMismatchConfirmed, setEmailMismatchConfirmed] = useState(false);

  const [authMode, setAuthMode] = useState<"register" | "login">("register");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  const { data: inviteInfo, isLoading: inviteInfoLoading } = useQuery<{
    email: string;
    name: string;
    groupName: string;
    inviterName: string;
    accepted: boolean;
    expired: boolean;
  }>({
    queryKey: ["/api/auth/invite-info", token],
    queryFn: async () => {
      const res = await fetch(`/api/auth/invite-info?token=${token}`);
      if (!res.ok) throw new Error(t("invite.invalidInvite"));
      return res.json();
    },
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (inviteInfo?.name && !name) {
      setName(inviteInfo.name);
    }
  }, [inviteInfo]);

  const invitedEmail = inviteInfo?.email || "";
  const emailMismatch = isAuthenticated && user && inviteInfo && user.email.toLowerCase() !== invitedEmail.toLowerCase();
  const shouldAutoAccept = isAuthenticated && token && !emailMismatch;

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/accept-invite", { inviteToken: token });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("invite.invalidInvite"));
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({ title: t("invite.accepted"), description: t("invite.joinedCrew") });
      const dest = data.redirectTo || "/dashboard";
      setTimeout(() => setLocation(dest), 1200);
    },
    onError: (err: any) => {
      toast({ title: t("invite.error"), description: err.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (shouldAutoAccept && !mutation.isPending && !mutation.isSuccess && !mutation.isError && !inviteInfoLoading) {
      mutation.mutate();
    }
  }, [shouldAutoAccept, inviteInfoLoading]);

  useEffect(() => {
    if (emailMismatchConfirmed && !mutation.isPending && !mutation.isSuccess && !mutation.isError) {
      mutation.mutate();
    }
  }, [emailMismatchConfirmed]);

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (authMode === "register") {
        await register({ name, email: invitedEmail, password, phone: phone || undefined });
        toast({ title: t("invite.accountCreated"), description: t("invite.welcomeTo", { brand: brand.name }) });
      } else {
        await login({ email: invitedEmail, password });
        toast({ title: t("invite.welcomeBack") });
      }
    } catch (err: any) {
      toast({
        title: authMode === "register" ? t("invite.registrationFailed") : t("invite.loginFailed"),
        description: err.message,
        variant: "destructive",
      });
    }
  }

  if (isLoading || inviteInfoLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center" data-testid="loading-invite">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12" data-testid="page-accept-invite">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8 space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h3 className="text-lg font-semibold" data-testid="text-no-token">{t("invite.invalidLink")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("invite.invalidLinkDesc")}
            </p>
            <Button variant="outline" onClick={() => setLocation("/")}>{t("invite.goHome")}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    const isSubmitting = isLoggingIn || isRegistering;

    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12" data-testid="page-accept-invite">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <UserPlus className="h-12 w-12 text-[hsl(25,90%,50%)] mx-auto mb-2" />
            <CardTitle className="text-2xl font-bold text-[hsl(220,50%,20%)]" data-testid="text-invite-title">
              {t("invite.youveBeenInvited")}
            </CardTitle>
            <CardDescription data-testid="text-invite-description">
              {inviteInfo && (
                <span className="block mb-1">
                  {t("invite.invitedByToJoin", { inviter: inviteInfo.inviterName, group: inviteInfo.groupName })}
                </span>
              )}
              {t("invite.signInOrCreate")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex rounded-lg border overflow-hidden">
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-medium transition-colors ${authMode === "register" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                onClick={() => setAuthMode("register")}
                data-testid="tab-register"
              >
                {t("invite.createAccount")}
              </button>
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-medium transition-colors ${authMode === "login" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                onClick={() => setAuthMode("login")}
                data-testid="tab-login"
              >
                {t("invite.signIn")}
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-3" data-testid="form-auth-invite">
              {authMode === "register" && (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="invite-name">{t("invite.fullName")}</Label>
                    <Input
                      id="invite-name"
                      placeholder={t("invite.yourName")}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      data-testid="input-invite-name"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="invite-phone">{t("invite.phoneOptional")}</Label>
                    <Input
                      id="invite-phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      data-testid="input-invite-phone"
                    />
                  </div>
                </>
              )}
              <div className="space-y-1">
                <Label htmlFor="invite-email">{t("invite.emailLabel")}</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={invitedEmail}
                  readOnly
                  className="bg-muted cursor-not-allowed"
                  data-testid="input-invite-email"
                />
                {invitedEmail && (
                  <p className="text-xs text-muted-foreground">
                    {t("invite.inviteForEmail", { email: invitedEmail })}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="invite-password">{t("invite.password")}</Label>
                <Input
                  id="invite-password"
                  type="password"
                  placeholder={authMode === "register" ? t("invite.createPassword") : t("invite.yourPassword")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="input-invite-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-[hsl(25,90%,50%)] hover:bg-[hsl(25,90%,40%)] text-white"
                disabled={isSubmitting || !invitedEmail}
                data-testid="button-auth-submit"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {authMode === "register" ? t("invite.createAndAccept") : t("invite.signInAndAccept")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (emailMismatch && !emailMismatchConfirmed && !mutation.isSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12" data-testid="page-accept-invite">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
            <CardTitle className="text-xl font-bold text-[hsl(220,50%,20%)]" data-testid="text-email-mismatch-title">
              {t("invite.differentAccount")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-4 text-sm" data-testid="text-mismatch-warning">
              <p className="mb-2">{t("invite.inviteSentTo", { email: invitedEmail })}</p>
              <p>{t("invite.signedInAs", { email: user?.email })}</p>
            </div>
            <div className="space-y-2">
              <Button
                className="w-full bg-[hsl(25,90%,50%)] hover:bg-[hsl(25,90%,40%)] text-white"
                onClick={() => setEmailMismatchConfirmed(true)}
                data-testid="button-accept-anyway"
              >
                {t("invite.acceptWithThis")}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={async () => {
                  await logout();
                  window.location.href = `/accept-invite?token=${token}`;
                }}
                data-testid="button-switch-account"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t("invite.signOutSwitch")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12" data-testid="page-accept-invite">
      <Card className="w-full max-w-md">
        <CardContent className="text-center py-8 space-y-4">
          {(mutation.isPending || (!mutation.isSuccess && !mutation.isError)) && (
            <div data-testid="status-accepting">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground mt-4">{t("invite.accepting")}</p>
            </div>
          )}
          {mutation.isSuccess && (
            <div data-testid="status-accepted">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <h3 className="text-lg font-semibold mt-4">{t("invite.invitationAccepted")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("invite.successfullyJoined", { group: inviteInfo?.groupName || t("instructorForm.theCrew") })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{t("invite.redirecting")}</p>
            </div>
          )}
          {mutation.isError && (
            <div data-testid="status-error">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <h3 className="text-lg font-semibold mt-4">
                {mutation.error?.message?.includes("expired") ? t("invite.inviteExpired") :
                 mutation.error?.message?.includes("already been accepted") ? t("invite.alreadyAccepted") :
                 t("invite.invalidInvite")}
              </h3>
              <p className="text-sm text-muted-foreground mt-2" data-testid="text-error-message">
                {mutation.error?.message?.includes("expired")
                  ? t("invite.expiredDesc", { admin: inviteInfo?.inviterName ? ` (${inviteInfo.inviterName})` : "" })
                  : mutation.error?.message?.includes("already been accepted")
                  ? t("invite.alreadyAcceptedDesc")
                  : t("invite.invalidInviteDesc")}
              </p>
              {mutation.error?.message?.includes("already been accepted") ? (
                <Button
                  className="mt-4 bg-[hsl(25,90%,50%)] hover:bg-[hsl(25,90%,40%)] text-white"
                  onClick={() => setLocation("/dashboard")}
                  data-testid="link-dashboard-error"
                >
                  {t("invite.goToDashboard")}
                </Button>
              ) : !mutation.error?.message?.includes("expired") ? (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => mutation.mutate()}
                  data-testid="button-retry"
                >
                  {t("invite.tryAgain")}
                </Button>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
