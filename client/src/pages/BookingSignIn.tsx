import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, MapPin, CalendarDays, Clock, GraduationCap, AlertCircle, Loader2 } from "lucide-react";
import { brand } from "@shared/config/brand";

interface SigninBootstrap {
  bookingNumber: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  trainingType: string;
  areaName: string | null;
  status: string;
}

/**
 * Public on-site sign-in (Alberto meeting 2026-07-28). A trainee scans the
 * class QR code (or the proctor opens the link on an iPad) and records their
 * own name - replacing the paper sign-in sheet and feeding the marketing
 * database. No account required. English-first for the pilot (most trainees
 * are bilingual; ES can be layered on after Alberto validates the flow).
 */
export default function BookingSignIn() {
  const params = useParams<{ bookingNumber: string }>();
  const bookingNumber = params.bookingNumber || "";
  const { toast } = useToast();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [done, setDone] = useState(false);

  const { data, isLoading, error } = useQuery<SigninBootstrap>({
    queryKey: ["/api/booking-signin", bookingNumber],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/booking-signin/${encodeURIComponent(bookingNumber)}`);
      return res.json();
    },
    enabled: !!bookingNumber,
    retry: false,
  });

  const signinMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/booking-signin/${encodeURIComponent(bookingNumber)}`, {
        firstName, lastName, email: email || undefined, phone: phone || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (err: Error) => {
      toast({ title: "Could not sign you in", description: err.message, variant: "destructive" });
    },
  });

  function formatDate(d?: string) {
    if (!d) return "";
    const dt = new Date(`${d}T12:00:00`);
    return dt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md"><CardContent className="p-6 space-y-3">
          <Skeleton className="h-6 w-2/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-10 w-full" />
        </CardContent></Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md border-destructive/40"><CardContent className="p-6 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
          <h1 className="text-lg font-semibold">Sign-in link not found</h1>
          <p className="text-sm text-muted-foreground">
            Check the link with your trainer, or call {brand.support.phone}.
          </p>
        </CardContent></Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md border-green-500/40"><CardContent className="p-8 text-center space-y-3">
          <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto" />
          <h1 className="text-2xl font-bold">You're signed in</h1>
          <p className="text-muted-foreground">
            Thanks, {firstName}. Your attendance for {formatDate(data.sessionDate)} is recorded.
          </p>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="w-5 h-5 text-accent" />
            <h1 className="text-xl font-bold">Training Sign-In</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-5">{brand.support.phone} · {data.trainingType}</p>

          <div className="rounded-lg bg-muted/40 border p-3 mb-5 space-y-1.5 text-sm">
            {data.areaName && (
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" /><span>{data.areaName}</span></div>
            )}
            <div className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-muted-foreground" /><span>{formatDate(data.sessionDate)}</span></div>
            <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground" /><span>{data.startTime} - {data.endTime}</span></div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First name *</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" data-testid="input-signin-first" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last name *</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" data-testid="input-signin-last" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email <span className="text-muted-foreground font-normal">(optional, for your certificate)</span></Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" data-testid="input-signin-email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" data-testid="input-signin-phone" />
            </div>
            <Button
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              size="lg"
              disabled={!firstName.trim() || !lastName.trim() || signinMutation.isPending}
              onClick={() => signinMutation.mutate()}
              data-testid="button-signin-submit"
            >
              {signinMutation.isPending ? (<><Loader2 className="w-4 h-4 animate-spin mr-2" />Signing in...</>) : "Sign In"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
