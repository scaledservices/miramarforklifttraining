import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { brand } from "@shared/config/brand";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, User, Mail, Lock, Phone } from "lucide-react";
import { SiGoogle, SiLinkedin, SiFacebook } from "react-icons/si";
import Logo from "@/components/ui/Logo";
import { formatUsPhone, normalizeEmail, capitalizeWords } from "@/lib/inputFormat";

// Only same-origin absolute paths — rejects protocol-relative (//host),
// backslash tricks, and auth-page loops. Validate AFTER decoding so
// %2F%2Fevil.com can't sneak through.
function isSafeInternalPath(path: string): boolean {
  return (
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.includes("\\") &&
    !path.startsWith("/login") &&
    !path.startsWith("/register")
  );
}

function getRedirectPath(user: any): string {
  const rawNext = new URLSearchParams(window.location.search).get("next");
  if (rawNext) {
    let next = rawNext;
    try {
      next = decodeURIComponent(rawNext);
    } catch {}
    if (isSafeInternalPath(next)) return next;
  }

  const stored = localStorage.getItem("postAuthRedirect");
  if (stored) {
    localStorage.removeItem("postAuthRedirect");
    if (isSafeInternalPath(stored)) return stored;
  }

  if (user.role === "super_admin" || user.role === "admin") return "/admin";
  if (user.role === "group_admin") return "/group";
  return "/dashboard";
}

export default function Register() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { register, isRegistering, isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const { data: providers } = useQuery<{ google: boolean; linkedin: boolean; facebook: boolean }>({ queryKey: ["/api/auth/providers"] });
  const hasOAuth = providers?.google || providers?.linkedin || providers?.facebook;
  const searchParams = new URLSearchParams(window.location.search);
  const nextParam = searchParams.get("next");
  const oauthReturnTo = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? `?returnTo=${encodeURIComponent(nextParam)}` : "";
  const params = searchParams;
  const prefillEmail = params.get("email") || "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  if (isAuthenticated && user) {
    const dest = getRedirectPath(user);
    setLocation(dest);
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const result = await register({ name, email, password, phone: phone || undefined, locale: i18n.language === "es" ? "es" : "en" });
      toast({ title: t("auth.accountCreated"), description: t("auth.welcomeTo", { brand: brand.name }) });
      const dest = getRedirectPath(result.user);
      setLocation(dest);
    } catch (err: any) {
      toast({ title: t("auth.registrationFailed"), description: err.message, variant: "destructive" });
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12" data-testid="page-register">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Logo variant="full" className="h-14" />
          </div>
          <CardTitle className="text-2xl font-bold text-[hsl(220,50%,20%)]" data-testid="text-register-title">
            {t("auth.registerTitle")}
          </CardTitle>
          <CardDescription data-testid="text-register-description">
            {t("auth.registerDescription", { brand: brand.name })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasOAuth && (
            <div className="space-y-3 mb-6">
              {providers?.google && (
                <a href={`/api/auth/google${oauthReturnTo}`} className="block">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    data-testid="button-register-google"
                  >
                    <SiGoogle className="h-4 w-4 mr-2" />
                    {t("auth.signUpWith", { provider: "Google" })}
                  </Button>
                </a>
              )}
              {providers?.linkedin && (
                <a href={`/api/auth/linkedin${oauthReturnTo}`} className="block">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    data-testid="button-register-linkedin"
                  >
                    <SiLinkedin className="h-4 w-4 mr-2" />
                    {t("auth.signUpWith", { provider: "LinkedIn" })}
                  </Button>
                </a>
              )}
              {providers?.facebook && (
                <a href={`/api/auth/facebook${oauthReturnTo}`} className="block">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    data-testid="button-register-facebook"
                  >
                    <SiFacebook className="h-4 w-4 mr-2" />
                    {t("auth.signUpWith", { provider: "Facebook" })}
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
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-register">
            <div className="space-y-2">
              <Label htmlFor="name">{t("form.fullName")}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder={t("form.placeholderName")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={(e) => setName(capitalizeWords(e.target.value.trim()))}
                  required
                  className="pl-10"
                  data-testid="input-name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("form.email")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder={t("form.placeholderEmail")}
                  value={email}
                  onChange={(e) => setEmail(normalizeEmail(e.target.value))}
                  required
                  readOnly={!!prefillEmail}
                  className={`pl-10 ${prefillEmail ? "bg-muted" : ""}`}
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
                  autoComplete="new-password"
                  placeholder={t("form.placeholderCreatePassword")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="pl-10"
                  data-testid="input-password"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t("form.phoneOptional")}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={14}
                  placeholder={t("form.placeholderPhone")}
                  value={phone}
                  onChange={(e) => setPhone(formatUsPhone(e.target.value))}
                  className="pl-10"
                  data-testid="input-phone"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-[hsl(25,90%,50%)] hover:bg-[hsl(25,90%,40%)] text-white"
              disabled={isRegistering}
              data-testid="button-register"
            >
              {isRegistering ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t("form.createAccount")}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-6" data-testid="text-login-prompt">
            {t("auth.hasAccount")}{" "}
            <Link href={`/login${window.location.search}`} className="text-[hsl(220,50%,20%)] font-medium hover:underline" data-testid="link-login">
              {t("auth.signIn")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
