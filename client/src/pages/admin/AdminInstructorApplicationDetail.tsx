import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft, User, Phone, Mail, MapPin, Wrench, Clock, GraduationCap,
  MessageSquare, StickyNote, Award, Globe, Briefcase, Car, History,
  Star, ClipboardCheck, ExternalLink, AlertTriangle, Loader2,
} from "lucide-react";
import { Link } from "wouter";

type AppStatus = "applied" | "reviewing" | "approved" | "rejected" | "archived";

interface StatusChange {
  id: number;
  applicationId: number;
  changedByUserId: number;
  actorName?: string;
  previousStatus: string;
  newStatus: string;
  note: string | null;
  createdAt: string;
}

interface InstructorApp {
  id: number;
  userId: number;
  certificationId: number | null;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  zip: string;
  yearsExperience: number;
  equipmentTypes: string[];
  industries: string[];
  hasTeachingExperience: boolean;
  trainingExperience: string | null;
  currentCertifications: string | null;
  availability: string;
  availabilityNotes: string | null;
  willingToTravel: boolean;
  travelRadius: number | null;
  whyInstructor: string;
  additionalNotes: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  resumeUrl: string | null;
  eligibilityVerifiedAt: string | null;
  status: AppStatus;
  adminNotes: string | null;
  complianceRating: number | null;
  professionalismRating: number | null;
  fieldExperienceRating: number | null;
  interviewRecommended: boolean;
  followUpNeeded: boolean;
  reviewChecklist: Record<string, boolean> | null;
  decisionSummary: string | null;
  createdAt: string;
  updatedAt: string;
}

function statusBadge(status: string) {
  switch (status) {
    case "applied":
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Applied</Badge>;
    case "reviewing":
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Reviewing</Badge>;
    case "approved":
      return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">Approved</Badge>;
    case "rejected":
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Rejected</Badge>;
    case "archived":
      return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">Archived</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

const REVIEW_CHECKLIST_ITEMS = [
  { key: "qualificationsMet", label: "Qualifications met" },
  { key: "experienceVerified", label: "Experience verified" },
  { key: "communicationAssessed", label: "Communication assessed" },
  { key: "safetyKnowledgeConfirmed", label: "Safety knowledge confirmed" },
  { key: "referencesChecked", label: "References checked" },
];

function RatingSelector({ value, onChange, label }: { value: number | null; onChange: (v: number) => void; label: string }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground mb-2 block">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`h-8 w-8 rounded-md border text-sm font-medium transition-colors ${
              value !== null && n <= value
                ? "bg-brand-dark text-white border-primary"
                : "bg-background hover:bg-muted border-border text-foreground"
            }`}
            data-testid={`rating-${label.toLowerCase().replace(/\s+/g, "-")}-${n}`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AdminInstructorApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [initialized, setInitialized] = useState(false);

  const [adminNotes, setAdminNotes] = useState("");
  const [complianceRating, setComplianceRating] = useState<number | null>(null);
  const [professionalismRating, setProfessionalismRating] = useState<number | null>(null);
  const [fieldExperienceRating, setFieldExperienceRating] = useState<number | null>(null);
  const [interviewRecommended, setInterviewRecommended] = useState(false);
  const [followUpNeeded, setFollowUpNeeded] = useState(false);
  const [reviewChecklist, setReviewChecklist] = useState<Record<string, boolean>>({});
  const [decisionSummary, setDecisionSummary] = useState("");
  const [statusChangeNote, setStatusChangeNote] = useState("");

  const { data, isLoading, isError } = useQuery<{ application: InstructorApp; statusChanges: StatusChange[] }>({
    queryKey: ["/api/admin/instructor-applications", id],
    enabled: !!id,
  });

  const application = data?.application;
  const statusChanges = data?.statusChanges ?? [];

  useEffect(() => {
    if (application && !initialized) {
      setAdminNotes(application.adminNotes || "");
      setComplianceRating(application.complianceRating);
      setProfessionalismRating(application.professionalismRating);
      setFieldExperienceRating(application.fieldExperienceRating);
      setInterviewRecommended(application.interviewRecommended);
      setFollowUpNeeded(application.followUpNeeded);
      setReviewChecklist(application.reviewChecklist || {});
      setDecisionSummary(application.decisionSummary || "");
      setInitialized(true);
    }
  }, [application, initialized]);

  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest("PATCH", `/api/admin/instructor-applications/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/instructor-applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/instructor-applications", id] });
      toast({ title: "Application updated", description: "Changes saved successfully." });
    },
    onError: () => {
      toast({ title: "Update failed", description: "Something went wrong.", variant: "destructive" });
    },
  });

  function handleSaveReview() {
    saveMutation.mutate({
      adminNotes,
      complianceRating,
      professionalismRating,
      fieldExperienceRating,
      interviewRecommended,
      followUpNeeded,
      reviewChecklist,
      decisionSummary,
    });
  }

  function handleStatusChange(newStatus: string) {
    if (newStatus === "approved" || newStatus === "rejected") {
      if (!window.confirm(`Are you sure you want to ${newStatus === "approved" ? "approve" : "reject"} this application?`)) return;
    }
    saveMutation.mutate({
      status: newStatus,
      statusChangeNote: statusChangeNote || undefined,
      adminNotes,
      complianceRating,
      professionalismRating,
      fieldExperienceRating,
      interviewRecommended,
      followUpNeeded,
      reviewChecklist,
      decisionSummary,
    });
    setStatusChangeNote("");
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4 max-w-4xl">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (isError || !application) {
    return (
      <AdminLayout>
        <div className="max-w-4xl">
          <p className="text-destructive" data-testid="text-not-found">Application not found.</p>
          <Button variant="ghost" asChild className="mt-4">
            <Link href="/admin/instructor-applications">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Applications
            </Link>
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild data-testid="button-back">
            <Link href="/admin/instructor-applications">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold" data-testid="text-application-title">
                {application.fullName}
              </h1>
              {statusBadge(application.status)}
              {application.eligibilityVerifiedAt && (
                <Badge variant="outline" className="text-xs text-green-700 border-green-300 dark:text-green-300 dark:border-green-700">
                  Eligibility Verified
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Application #{application.id} &middot; Submitted {new Date(application.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            Contact Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-1">Full Name</p>
              <p className="font-medium" data-testid="text-full-name">{application.fullName}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Email</p>
              <a href={`mailto:${application.email}`} className="font-medium text-primary hover:underline flex items-center gap-1" data-testid="link-email">
                <Mail className="h-3.5 w-3.5" />{application.email}
              </a>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Phone</p>
              <a href={`tel:${application.phone}`} className="font-medium text-primary hover:underline flex items-center gap-1" data-testid="link-phone">
                <Phone className="h-3.5 w-3.5" />{application.phone}
              </a>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Location</p>
              <p className="font-medium flex items-center gap-1" data-testid="text-location">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                {application.city}, {application.state} {application.zip}
              </p>
            </div>
            {application.linkedinUrl && (
              <div>
                <p className="text-muted-foreground text-xs mb-1">LinkedIn</p>
                <a href={application.linkedinUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline flex items-center gap-1" data-testid="link-linkedin">
                  <Globe className="h-3.5 w-3.5" />LinkedIn Profile
                </a>
              </div>
            )}
            {application.websiteUrl && (
              <div>
                <p className="text-muted-foreground text-xs mb-1">Website</p>
                <a href={application.websiteUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline flex items-center gap-1" data-testid="link-website">
                  <Globe className="h-3.5 w-3.5" />Website
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            Qualifications
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-1">Years of Forklift Experience</p>
              <p className="font-medium" data-testid="text-years-experience">{application.yearsExperience} years</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Teaching Experience</p>
              <p className="font-medium" data-testid="text-teaching-exp">{application.hasTeachingExperience ? "Yes" : "No"}</p>
            </div>
            {application.certificationId && (
              <div>
                <p className="text-muted-foreground text-xs mb-1">Certification ID</p>
                <p className="font-medium flex items-center gap-1" data-testid="text-cert-id">
                  <Award className="h-3.5 w-3.5 text-muted-foreground" />#{application.certificationId}
                </p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground text-xs mb-1">Availability</p>
              <p className="font-medium capitalize flex items-center gap-1" data-testid="text-availability">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />{application.availability.replace("-", " ")}
              </p>
            </div>
            {application.currentCertifications && (
              <div className="sm:col-span-2">
                <p className="text-muted-foreground text-xs mb-1">Other Certifications</p>
                <p className="font-medium" data-testid="text-current-certs">{application.currentCertifications}</p>
              </div>
            )}
          </div>

          {application.equipmentTypes.length > 0 && (
            <div>
              <p className="text-muted-foreground text-xs mb-2 flex items-center gap-1"><Wrench className="h-3 w-3" />Equipment Types</p>
              <div className="flex flex-wrap gap-1.5" data-testid="list-equipment-types">
                {application.equipmentTypes.map((eq) => <Badge key={eq} variant="secondary" className="text-xs">{eq}</Badge>)}
              </div>
            </div>
          )}

          {application.industries.length > 0 && (
            <div>
              <p className="text-muted-foreground text-xs mb-2 flex items-center gap-1"><Briefcase className="h-3 w-3" />Industry Experience</p>
              <div className="flex flex-wrap gap-1.5" data-testid="list-industries">
                {application.industries.map((ind) => <Badge key={ind} variant="secondary" className="text-xs">{ind}</Badge>)}
              </div>
            </div>
          )}

          {application.trainingExperience && (
            <div>
              <p className="text-muted-foreground text-xs mb-1">Training Experience Details</p>
              <p className="text-sm whitespace-pre-wrap" data-testid="text-training-experience">{application.trainingExperience}</p>
            </div>
          )}
        </div>

        {(application.willingToTravel || application.availabilityNotes) && (
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Car className="h-4 w-4 text-muted-foreground" />
              Travel & Scheduling
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Willing to Travel</p>
                <p className="font-medium" data-testid="text-willing-travel">{application.willingToTravel ? "Yes" : "No"}</p>
              </div>
              {application.travelRadius && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Travel Radius</p>
                  <p className="font-medium" data-testid="text-travel-radius">{application.travelRadius} miles</p>
                </div>
              )}
              {application.availabilityNotes && (
                <div className="sm:col-span-2">
                  <p className="text-muted-foreground text-xs mb-1">Availability Notes</p>
                  <p className="text-sm" data-testid="text-availability-notes">{application.availabilityNotes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            Motivation
          </h2>
          <p className="text-sm whitespace-pre-wrap" data-testid="text-why-instructor">{application.whyInstructor}</p>
          {application.additionalNotes && (
            <div>
              <p className="text-muted-foreground text-xs mb-1 mt-4">Additional Notes</p>
              <p className="text-sm whitespace-pre-wrap" data-testid="text-additional-notes">{application.additionalNotes}</p>
            </div>
          )}
        </div>

        <div className="bg-card border rounded-xl p-6 space-y-5">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Star className="h-4 w-4 text-muted-foreground" />
            Review Assessment
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <RatingSelector label="Compliance" value={complianceRating} onChange={setComplianceRating} />
            <RatingSelector label="Professionalism" value={professionalismRating} onChange={setProfessionalismRating} />
            <RatingSelector label="Field Experience" value={fieldExperienceRating} onChange={setFieldExperienceRating} />
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={interviewRecommended}
                onCheckedChange={setInterviewRecommended}
                data-testid="switch-interview-recommended"
              />
              <Label className="text-sm">Interview Recommended</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={followUpNeeded}
                onCheckedChange={setFollowUpNeeded}
                data-testid="switch-follow-up-needed"
              />
              <Label className="text-sm flex items-center gap-1">
                {followUpNeeded && <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />}
                Follow-Up Needed
              </Label>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">
              <ClipboardCheck className="h-3 w-3 inline mr-1" />
              Review Checklist
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {REVIEW_CHECKLIST_ITEMS.map((item) => (
                <label
                  key={item.key}
                  className="flex items-center gap-2 text-sm p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                  data-testid={`checklist-${item.key}`}
                >
                  <input
                    type="checkbox"
                    checked={reviewChecklist[item.key] || false}
                    onChange={(e) => setReviewChecklist({ ...reviewChecklist, [item.key]: e.target.checked })}
                    className="rounded border-border"
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Decision Summary</Label>
            <Textarea
              value={decisionSummary}
              onChange={(e) => setDecisionSummary(e.target.value)}
              rows={3}
              placeholder="Summary of review decision and rationale..."
              data-testid="textarea-decision-summary"
            />
          </div>

          <Button onClick={handleSaveReview} disabled={saveMutation.isPending} data-testid="button-save-review">
            {saveMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Saving...</> : "Save Review"}
          </Button>
        </div>

        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-muted-foreground" />
            Admin Notes & Actions
          </h2>

          <div>
            <Label className="text-xs text-muted-foreground">Internal Notes</Label>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
              placeholder="Internal notes about this application..."
              data-testid="textarea-admin-notes"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Status Change Note (optional)</Label>
            <Textarea
              value={statusChangeNote}
              onChange={(e) => setStatusChangeNote(e.target.value)}
              rows={2}
              placeholder="Add a note for the audit trail..."
              data-testid="textarea-status-change-note"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {application.status !== "reviewing" && (
              <Button variant="outline" onClick={() => handleStatusChange("reviewing")} disabled={saveMutation.isPending} data-testid="button-status-reviewing">
                Mark Reviewing
              </Button>
            )}
            {application.status !== "approved" && (
              <Button
                variant="outline"
                className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-700 dark:hover:bg-emerald-950"
                onClick={() => handleStatusChange("approved")}
                disabled={saveMutation.isPending}
                data-testid="button-status-approve"
              >
                Approve
              </Button>
            )}
            {application.status !== "rejected" && (
              <Button
                variant="outline"
                className="text-red-700 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-950"
                onClick={() => handleStatusChange("rejected")}
                disabled={saveMutation.isPending}
                data-testid="button-status-reject"
              >
                Reject
              </Button>
            )}
            {application.status !== "archived" && (
              <Button variant="outline" onClick={() => handleStatusChange("archived")} disabled={saveMutation.isPending} data-testid="button-status-archive">
                Archive
              </Button>
            )}
            {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin self-center" />}
          </div>

          {application.status === "approved" && (
            <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-emerald-800 dark:text-emerald-200">
                This applicant has been approved.
              </span>
              <Link href="/admin/instructors" className="text-sm text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1 ml-auto" data-testid="link-instructor-profile">
                View Instructor Directory <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>

        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            Status History
          </h2>

          {statusChanges.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No status changes recorded yet.</p>
          ) : (
            <div className="space-y-3" data-testid="status-history-list">
              {statusChanges.map((change) => (
                <div key={change.id} className="flex items-start gap-3 text-sm border-l-2 border-muted pl-4 py-1" data-testid={`status-change-${change.id}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {statusBadge(change.previousStatus)}
                      <span className="text-muted-foreground">&rarr;</span>
                      {statusBadge(change.newStatus)}
                      <span className="text-xs text-muted-foreground">
                        by {change.actorName || `User #${change.changedByUserId}`}
                      </span>
                    </div>
                    {change.note && (
                      <p className="text-muted-foreground text-xs mt-1">{change.note}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(change.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
