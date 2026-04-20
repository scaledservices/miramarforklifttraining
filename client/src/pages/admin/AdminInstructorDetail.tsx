import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft, User, Phone, Mail, MapPin, Wrench, Languages, Car,
  StickyNote, ClipboardCheck, CheckCircle2, XCircle, ExternalLink, Loader2, Save,
} from "lucide-react";
import { Link } from "wouter";

interface OnboardingChecklist {
  identityVerified: boolean;
  experienceReviewed: boolean;
  interviewCompleted: boolean;
  insuranceCollected: boolean;
  agreementSigned: boolean;
  taxInfoCollected: boolean;
  backgroundCheckComplete: boolean;
  readyForAssignment: boolean;
}

interface Instructor {
  id: number;
  applicationId: number | null;
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  zip: string;
  travelRadius: number | null;
  equipmentClasses: string[];
  languages: string[];
  active: boolean;
  internalNotes: string | null;
  onboardingChecklist: OnboardingChecklist;
  createdAt: string;
  updatedAt: string;
}

const ONBOARDING_ITEMS: { key: keyof OnboardingChecklist; label: string }[] = [
  { key: "identityVerified", label: "Identity Verified" },
  { key: "experienceReviewed", label: "Experience Reviewed" },
  { key: "interviewCompleted", label: "Interview Completed" },
  { key: "insuranceCollected", label: "Insurance Collected" },
  { key: "agreementSigned", label: "Agreement Signed" },
  { key: "taxInfoCollected", label: "Tax Info Collected" },
  { key: "backgroundCheckComplete", label: "Background Check Complete" },
  { key: "readyForAssignment", label: "Ready for Assignment" },
];

export default function AdminInstructorDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [initialized, setInitialized] = useState(false);

  const [travelRadius, setTravelRadius] = useState<string>("");
  const [equipmentInput, setEquipmentInput] = useState("");
  const [languagesInput, setLanguagesInput] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [activeLocal, setActiveLocal] = useState<boolean | null>(null);
  const [onboardingChecklist, setOnboardingChecklist] = useState<OnboardingChecklist>({
    identityVerified: false,
    experienceReviewed: false,
    interviewCompleted: false,
    insuranceCollected: false,
    agreementSigned: false,
    taxInfoCollected: false,
    backgroundCheckComplete: false,
    readyForAssignment: false,
  });

  const { data, isLoading, isError } = useQuery<{ instructor: Instructor }>({
    queryKey: ["/api/admin/instructors", id],
    enabled: !!id,
  });

  const instructor = data?.instructor;

  useEffect(() => {
    if (instructor && !initialized) {
      setTravelRadius(instructor.travelRadius?.toString() || "");
      setEquipmentInput(instructor.equipmentClasses.join(", "));
      setLanguagesInput(instructor.languages.join(", "));
      setInternalNotes(instructor.internalNotes || "");
      setOnboardingChecklist(instructor.onboardingChecklist);
      setInitialized(true);
    }
  }, [instructor, initialized]);

  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest("PATCH", `/api/admin/instructors/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/instructors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/instructors", id] });
      toast({ title: "Instructor updated", description: "Changes saved successfully." });
    },
    onError: () => {
      toast({ title: "Update failed", description: "Something went wrong.", variant: "destructive" });
    },
  });

  function handleSave() {
    const equipmentClasses = equipmentInput.split(",").map((s) => s.trim()).filter(Boolean);
    const languages = languagesInput.split(",").map((s) => s.trim()).filter(Boolean);
    const radius = travelRadius ? parseInt(travelRadius) : null;
    mutation.mutate({
      travelRadius: radius,
      equipmentClasses,
      languages,
      internalNotes: internalNotes || null,
      onboardingChecklist,
    });
  }

  function handleToggleActive(active: boolean) {
    if (!active && !window.confirm("Are you sure you want to deactivate this instructor?")) return;
    setActiveLocal(active);
    mutation.mutate({ active });
  }

  function toggleOnboardingItem(key: keyof OnboardingChecklist) {
    setOnboardingChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4 max-w-3xl">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (isError || !instructor) {
    return (
      <AdminLayout>
        <div className="max-w-3xl">
          <p className="text-destructive" data-testid="text-not-found">Instructor not found.</p>
          <Button variant="ghost" asChild className="mt-4">
            <Link href="/admin/instructors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Instructors
            </Link>
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const progress = Object.values(onboardingChecklist);
  const completedCount = progress.filter(Boolean).length;
  const totalCount = progress.length;
  const progressPct = (completedCount / totalCount) * 100;

  return (
    <AdminLayout>
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild data-testid="button-back">
            <Link href="/admin/instructors">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold" data-testid="text-instructor-title">{instructor.fullName}</h1>
              {instructor.active ? (
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">Active</Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">Inactive</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Instructor #{instructor.id} &middot; Added {new Date(instructor.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(activeLocal ?? instructor.active) ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <XCircle className="h-5 w-5 text-muted-foreground" />
            )}
            <Switch
              checked={activeLocal ?? instructor.active}
              onCheckedChange={handleToggleActive}
              data-testid="switch-instructor-active"
            />
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            Contact & Location
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-1">Full Name</p>
              <p className="font-medium" data-testid="text-instructor-name">{instructor.fullName}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Email</p>
              <a href={`mailto:${instructor.email}`} className="font-medium text-primary hover:underline flex items-center gap-1" data-testid="link-instructor-email">
                <Mail className="h-3.5 w-3.5" />{instructor.email}
              </a>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Phone</p>
              <a href={`tel:${instructor.phone}`} className="font-medium text-primary hover:underline flex items-center gap-1" data-testid="link-instructor-phone">
                <Phone className="h-3.5 w-3.5" />{instructor.phone}
              </a>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Location</p>
              <p className="font-medium flex items-center gap-1" data-testid="text-instructor-location">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                {instructor.city}, {instructor.state} {instructor.zip}
              </p>
            </div>
          </div>
          {instructor.applicationId && (
            <div className="pt-2 border-t">
              <Link
                href={`/admin/instructor-applications/${instructor.applicationId}`}
                className="text-sm text-primary hover:underline flex items-center gap-1"
                data-testid="link-original-application"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View Original Application #{instructor.applicationId}
              </Link>
            </div>
          )}
        </div>

        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            Skills & Capabilities
          </h2>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Equipment Classes (comma-separated)</Label>
              <Input
                value={equipmentInput}
                onChange={(e) => setEquipmentInput(e.target.value)}
                placeholder="Sit-Down Counterbalance, Reach Truck, ..."
                data-testid="input-equipment-classes"
              />
              {equipmentInput && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {equipmentInput.split(",").map((s) => s.trim()).filter(Boolean).map((eq) => (
                    <Badge key={eq} variant="secondary" className="text-xs">{eq}</Badge>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Languages className="h-3 w-3" />
                Languages (comma-separated)
              </Label>
              <Input
                value={languagesInput}
                onChange={(e) => setLanguagesInput(e.target.value)}
                placeholder="English, Spanish, ..."
                data-testid="input-languages"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Car className="h-3 w-3" />
                Travel Radius (miles)
              </Label>
              <Input
                type="number"
                value={travelRadius}
                onChange={(e) => setTravelRadius(e.target.value)}
                placeholder="e.g. 50"
                className="max-w-[150px]"
                data-testid="input-travel-radius"
              />
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            Onboarding Checklist
            <span className="text-xs text-muted-foreground ml-auto">{completedCount}/{totalCount} complete</span>
          </h2>

          <div className="w-full h-3 bg-muted rounded-full overflow-hidden" data-testid="onboarding-progress-bar">
            <div
              className={`h-full rounded-full transition-all duration-300 ${progressPct === 100 ? "bg-emerald-500" : progressPct >= 50 ? "bg-blue-500" : "bg-yellow-500"}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ONBOARDING_ITEMS.map((item) => (
              <label
                key={item.key}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                data-testid={`onboarding-${item.key}`}
              >
                <Checkbox
                  checked={onboardingChecklist[item.key]}
                  onCheckedChange={() => toggleOnboardingItem(item.key)}
                />
                <span className={`text-sm ${onboardingChecklist[item.key] ? "text-foreground" : "text-muted-foreground"}`}>
                  {item.label}
                </span>
                {onboardingChecklist[item.key] && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" />
                )}
              </label>
            ))}
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-muted-foreground" />
            Internal Notes
          </h2>
          <Textarea
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            rows={4}
            placeholder="Internal notes about this instructor..."
            data-testid="textarea-internal-notes"
          />
        </div>

        <div className="flex gap-3 pb-6">
          <Button onClick={handleSave} disabled={mutation.isPending} data-testid="button-save-instructor">
            {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Saving...</> : <><Save className="h-4 w-4 mr-1" />Save Changes</>}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
