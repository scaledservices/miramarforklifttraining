import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { brand } from "@shared/config/brand";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Mail, Lock } from "lucide-react";
import { SiGoogle, SiLinkedin, SiFacebook } from "react-icons/si";
import Logo from "@/components/ui/Logo";

function getRedirectPath(user: any): string {
  const params = new URLSearchParams(window.location.search);
  const next = params.get("next");
  if (next && next.startsWith("/") && !next.startsWith("/login") && !next.startsWith("/register")) {
    return decodeURIComponent(next);
  }

  const stored = localStorage.getItem("postAuthRedirect");
  if (stored) {
    localStorage.removeItem("postAuthRedirect");
    return stored;
  }

  if (user.role === "super_admin" || user.role === "admin") return "/admin";
  if (user.role === "group_admin") return "/group";
  return "/dashboard";
}

export default function Login() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { login, isLoggingIn, isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { data: providers } = useQuery<{ google: boolean; linkedin: boolean; facebook: boolean }>({ queryKey: ["/api/auth/providers"] });
  const hasOAuth = providers?.google || providers?.linkedin || providers?.facebook;
  const nextParam = new URLSearchParams(window.location.search).get("next");
  const oauthReturnTo = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? `?returnTo=${encodeURIComponent(nextParam)}` : "";

  if (isAuthenticated && user) {
    const dest = getRedirectPath(user);
    setLocation(dest);
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const result = await login({ email, password });
      toast({ title: t("auth.welcomeBack"), description: t("auth.loggedInSuccess") });
      const dest = getRedirectPath(result.user);
      setLocation(dest);
    } catch (err: any) {
      toast({ title: t("auth.loginFailed"), description: err.message, variant: "destructive" });
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12" data-testid="page-login">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Logo variant="full" className="h-14" />
          </div>
          <CardTitle className="text-2xl font-bold text-[hsl(220,50%,20%)]" data-testid="text-login-title">
            {t("auth.loginTitle")}
          </CardTitle>
          <CardDescription data-testid="text-login-description">
            {t("auth.loginDescription", { brand: brand.name })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {hasOAuth && (
            <div className="space-y-3">
              {providers?.google && (
                <a href={`/api/auth/google${oauthReturnTo}`} className="block">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    data-testid="button-login-google"
                  >
                    <SiGoogle className="h-4 w-4 mr-2" />
                    {t("auth.signInWith", { provider: "Google" })}
                  </Button>
                </a>
              )}
              {providers?.linkedin && (
                <a href={`/api/auth/linkedin${oauthReturnTo}`} className="block">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    data-testid="button-login-linkedin"
                  >
                    <SiLinkedin className="h-4 w-4 mr-2" />
                    {t("auth.signInWith", { provider: "LinkedIn" })}
                  </Button>
                </a>
              )}
              {providers?.facebook && (
                <a href={`/api/auth/facebook${oauthReturnTo}`} className="block">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    data-testid="button-login-facebook"
                  >
                    <SiFacebook className="h-4 w-4 mr-2" />
                    {t("auth.signInWith", { provider: "Facebook" })}
                  </Button>
                </a>
              )}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">{t("auth.orContinueWithEmail")}</span>
                </div>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-login">
            <div className="space-y-2">
              <Label htmlFor="email">{t("form.email")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t("form.placeholderEmail")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                  data-testid="input-email"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("form.password")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder={t("form.placeholderPassword")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10"
                  data-testid="input-password"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Link
                href="/reset-password"
                className="text-sm text-[hsl(25,90%,50%)] hover:underline"
                data-testid="link-forgot-password"
              >
                {t("auth.forgotPassword")}
              </Link>
            </div>
            <Button
              type="submit"
              className="w-full bg-[hsl(220,50%,20%)] hover:bg-[hsl(220,50%,30%)] text-white"
              disabled={isLoggingIn}
              data-testid="button-login"
            >
              {isLoggingIn ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t("auth.signIn")}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4" data-testid="text-register-prompt">
            {t("auth.noAccount")}{" "}
            <Link href={`/register${window.location.search}`} className="text-[hsl(25,90%,50%)] font-medium hover:underline" data-testid="link-register">
              {t("auth.createOne")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
