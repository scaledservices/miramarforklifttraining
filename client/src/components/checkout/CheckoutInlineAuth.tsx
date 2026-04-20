import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, User, Mail, Lock, Phone, ShieldCheck } from "lucide-react";
import { SiGoogle, SiLinkedin, SiFacebook } from "react-icons/si";
import { Link } from "wouter";

type AuthMode = "register" | "login";

export default function CheckoutInlineAuth() {
  const { t, i18n } = useTranslation();
  const { login, register, isLoggingIn, isRegistering } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<AuthMode>("register");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  const { data: providers } = useQuery<{ google: boolean; linkedin: boolean; facebook: boolean }>({
    queryKey: ["/api/auth/providers"],
  });
  const hasOAuth = providers?.google || providers?.linkedin || providers?.facebook;

  const currentPath = window.location.pathname;
  const oauthReturnTo = `?returnTo=${encodeURIComponent(currentPath)}`;

  const isPending = mode === "login" ? isLoggingIn : isRegistering;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (mode === "login") {
        await login({ email, password });
        toast({ title: t("auth.welcomeBack"), description: t("auth.loggedInSuccess") });
      } else {
        await register({
          name,
          email,
          password,
          phone: phone || undefined,
          locale: i18n.language?.startsWith("es") ? "es" : "en",
        });
        toast({ title: t("auth.accountCreated"), description: t("checkoutAuth.accountReady") });
      }
    } catch (err: any) {
      toast({
        title: mode === "login" ? t("auth.loginFailed") : t("auth.registrationFailed"),
        description: err.message,
        variant: "destructive",
      });
    }
  }

  return (
    <Card data-testid="checkout-inline-auth">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-accent" />
          <h2 className="font-bold text-lg">{t("checkoutAuth.title")}</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          {t("checkoutAuth.subtitle")}
        </p>

        <div
          className="flex rounded-lg border overflow-hidden mb-5"
          role="tablist"
          aria-label={t("checkoutAuth.title")}
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "register"}
            aria-controls="checkout-auth-panel"
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              mode === "register"
                ? "bg-accent text-accent-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
            onClick={() => setMode("register")}
            data-testid="tab-checkout-register"
          >
            {t("checkoutAuth.newAccount")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            aria-controls="checkout-auth-panel"
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              mode === "login"
                ? "bg-accent text-accent-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
            onClick={() => setMode("login")}
            data-testid="tab-checkout-login"
          >
            {t("checkoutAuth.existingAccount")}
          </button>
        </div>

        <div id="checkout-auth-panel" role="tabpanel">
          {hasOAuth && (
            <div className="space-y-2 mb-4">
              {providers?.google && (
                <Button
                  asChild
                  variant="outline"
                  className="w-full"
                  data-testid="button-checkout-google"
                >
                  <a href={`/api/auth/google${oauthReturnTo}`}>
                    <SiGoogle className="h-4 w-4 mr-2" />
                    {mode === "login"
                      ? t("auth.signInWith", { provider: "Google" })
                      : t("auth.signUpWith", { provider: "Google" })}
                  </a>
                </Button>
              )}
              {providers?.linkedin && (
                <Button
                  asChild
                  variant="outline"
                  className="w-full"
                  data-testid="button-checkout-linkedin"
                >
                  <a href={`/api/auth/linkedin${oauthReturnTo}`}>
                    <SiLinkedin className="h-4 w-4 mr-2" />
                    {mode === "login"
                      ? t("auth.signInWith", { provider: "LinkedIn" })
                      : t("auth.signUpWith", { provider: "LinkedIn" })}
                  </a>
                </Button>
              )}
              {providers?.facebook && (
                <Button
                  asChild
                  variant="outline"
                  className="w-full"
                  data-testid="button-checkout-facebook"
                >
                  <a href={`/api/auth/facebook${oauthReturnTo}`}>
                    <SiFacebook className="h-4 w-4 mr-2" />
                    {mode === "login"
                      ? t("auth.signInWith", { provider: "Facebook" })
                      : t("auth.signUpWith", { provider: "Facebook" })}
                  </a>
                </Button>
              )}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    {t("auth.orContinueWithEmail")}
                  </span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3" data-testid="form-checkout-auth">
            {mode === "register" && (
              <div className="space-y-1.5">
                <Label htmlFor="checkout-name">{t("form.fullName")}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="checkout-name"
                    type="text"
                    placeholder={t("form.placeholderName")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="pl-10"
                    data-testid="input-checkout-name"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="checkout-email">{t("form.email")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="checkout-email"
                  type="email"
                  placeholder={t("form.placeholderEmail")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                  data-testid="input-checkout-email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="checkout-password">{t("form.password")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="checkout-password"
                  type="password"
                  placeholder={
                    mode === "register"
                      ? t("form.placeholderCreatePassword")
                      : t("form.placeholderPassword")
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={mode === "register" ? 8 : undefined}
                  className="pl-10"
                  data-testid="input-checkout-password"
                />
              </div>
            </div>

            {mode === "register" && (
              <div className="space-y-1.5">
                <Label htmlFor="checkout-phone">{t("form.phoneOptional")}</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="checkout-phone"
                    type="tel"
                    placeholder={t("form.placeholderPhone")}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10"
                    data-testid="input-checkout-phone"
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-accent text-accent-foreground"
              disabled={isPending}
              data-testid="button-checkout-auth-submit"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {mode === "login"
                ? t("checkoutAuth.signInContinue")
                : t("checkoutAuth.createContinue")}
            </Button>
          </form>

          {mode === "login" && (
            <p className="text-center text-xs text-muted-foreground mt-3">
              <Link
                href="/reset-password"
                className="text-accent hover:underline"
                data-testid="link-checkout-forgot-password"
              >
                {t("auth.forgotPassword")}
              </Link>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
