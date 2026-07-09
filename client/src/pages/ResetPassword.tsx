import { useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock, CheckCircle } from "lucide-react";

function useToken() {
  const params = new URLSearchParams(window.location.search);
  return params.get("token");
}

function RequestResetForm() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: async (email: string) => {
      await apiRequest("POST", "/api/auth/password-reset-request", { email });
    },
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err: any) => {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    },
  });

  if (submitted) {
    return (
      <div className="text-center space-y-4 py-4" data-testid="text-reset-success">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
        <h3 className="text-lg font-semibold">{t("auth.checkEmail")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("auth.checkEmailDesc")}
        </p>
        <Link href="/login" className="text-sm text-[hsl(25,90%,50%)] hover:underline" data-testid="link-back-login">
          {t("auth.backToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); mutation.mutate(email); }}
      className="space-y-4"
      data-testid="form-request-reset"
    >
      <div className="space-y-2">
        <Label htmlFor="email">{t("form.emailAddress")}</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={t("form.placeholderEmail")}
            value={email}
            onChange={(e) => setEmail(e.target.value.toLowerCase().replace(/\s/g, ""))}
            required
            className="pl-10"
            data-testid="input-email"
          />
        </div>
      </div>
      <Button
        type="submit"
        className="w-full bg-[hsl(220,50%,20%)] hover:bg-[hsl(220,50%,30%)] text-white"
        disabled={mutation.isPending}
        data-testid="button-request-reset"
      >
        {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {t("form.sendResetLink")}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-[hsl(25,90%,50%)] hover:underline" data-testid="link-back-login">
          {t("auth.backToLogin")}
        </Link>
      </p>
    </form>
  );
}

function ConfirmResetForm({ token }: { token: string }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/password-reset-confirm", { token, password });
    },
    onSuccess: () => {
      setSuccess(true);
      toast({ title: t("auth.passwordReset"), description: t("auth.passwordResetDesc") });
    },
    onError: (err: any) => {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    },
  });

  if (success) {
    return (
      <div className="text-center space-y-4 py-4" data-testid="text-confirm-success">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
        <h3 className="text-lg font-semibold">{t("auth.passwordUpdated")}</h3>
        <p className="text-sm text-muted-foreground">{t("auth.passwordUpdatedDesc")}</p>
        <Link href="/login" data-testid="link-login-after-reset">
          <Button className="bg-[hsl(25,90%,50%)] hover:bg-[hsl(25,90%,40%)] text-white">
            {t("auth.signIn")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
          toast({ title: t("common.error"), description: t("auth.passwordsDoNotMatch"), variant: "destructive" });
          return;
        }
        mutation.mutate();
      }}
      className="space-y-4"
      data-testid="form-confirm-reset"
    >
      <div className="space-y-2">
        <Label htmlFor="password">{t("form.newPassword")}</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder={t("form.placeholderNewPassword")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="pl-10"
            data-testid="input-new-password"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">{t("form.confirmPassword")}</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            placeholder={t("form.placeholderConfirmPassword")}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className="pl-10"
            data-testid="input-confirm-password"
          />
        </div>
      </div>
      <Button
        type="submit"
        className="w-full bg-[hsl(220,50%,20%)] hover:bg-[hsl(220,50%,30%)] text-white"
        disabled={mutation.isPending}
        data-testid="button-confirm-reset"
      >
        {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {t("form.resetPassword")}
      </Button>
    </form>
  );
}

export default function ResetPassword() {
  const { t } = useTranslation();
  const token = useToken();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12" data-testid="page-reset-password">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-[hsl(220,50%,20%)]" data-testid="text-reset-title">
            {token ? t("auth.setNewPassword") : t("auth.resetPasswordTitle")}
          </CardTitle>
          <CardDescription data-testid="text-reset-description">
            {token
              ? t("auth.setNewPasswordDesc")
              : t("auth.resetPasswordDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {token ? <ConfirmResetForm token={token} /> : <RequestResetForm />}
        </CardContent>
      </Card>
    </div>
  );
}
