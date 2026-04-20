import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft, User, Building2, Phone, Mail, MapPin, Users, Calendar,
  ClipboardList, MessageSquare, StickyNote, Wrench, UserPlus, UserCheck,
  Star, CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp,
  Clock, PhoneCall, FileText, AlertCircle, Link2, Plus,
} from "lucide-react";
import { Link } from "wouter";
import { VALID_TRANSITIONS, STATUS_LABELS, type OnsiteStatus } from "@shared/config/onsite-states";
import { QUOTE_STATUS_LABELS, type QuoteStatus } from "@shared/config/quote-states";
import { getLocation } from "@shared/config/locations";

interface OnsiteRequest {
  id: number;
  companyName: string | null;
  contactName: string;
  email: string;
  phone: string;
  trainingAddress: string;
  city: string;
  state: string;
  zip: string;
  traineeCount: number;
  preferredDate1: string | null;
  preferredDate2: string | null;
  preferredDate3: string | null;
  equipmentTypes: string[];
  trainingType: string;
  notes: string | null;
  status: OnsiteStatus;
  adminNotes: string | null;
  requestedLocationSlug: string | null;
  requestedLocationType: string | null;
  companyId: number | null;
  contactId: number | null;
  assignedRepId: number | null;
  nextActionType: string | null;
  nextActionDate: string | null;
  lastActivityAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Assignment {
  id: number;
  requestId: number;
  instructorId: number;
  status: string;
  assignedByUserId: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  instructorName: string;
  instructorEmail: string;
  instructorCity: string;
  instructorState: string;
  assignedByName: string;
}

interface StatusChange {
  id: number;
  assignmentId: number;
  changedByUserId: number;
  changedByName: string;
  previousStatus: string;
  newStatus: string;
  note: string | null;
  createdAt: string;
}

interface MatchedInstructor {
  id: number;
  fullName: string;
  email: string;
  city: string;
  state: string;
  equipmentClasses: string[];
  languages: string[];
  travelRadius: number | null;
  matchScore: number;
  matchReasons: string[];
  onboardingChecklist: Record<string, boolean>;
}

interface LeadActivity {
  id: number;
  leadId: number;
  companyId: number | null;
  contactId: number | null;
  actorUserId: number | null;
  actorName: string | null;
  activityType: string;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

const STATUS_BADGE_STYLES: Record<string, { bg: string; label: string }> = {
  new_lead: { bg: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", label: "New Lead" },
  contacted: { bg: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200", label: "Contacted" },
  quoted: { bg: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", label: "Quoted" },
  quote_accepted: { bg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200", label: "Quote Accepted" },
  quote_declined: { bg: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", label: "Quote Declined" },
  scheduled: { bg: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200", label: "Scheduled" },
  confirmed: { bg: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", label: "Confirmed" },
  completed: { bg: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200", label: "Completed" },
  invoiced: { bg: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", label: "Invoiced" },
  unresponsive: { bg: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200", label: "Unresponsive" },
  cancelled: { bg: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", label: "Cancelled" },
};

const NEXT_ACTION_LABELS: Record<string, string> = {
  call_back: "Call Back",
  send_quote: "Send Quote",
  follow_up: "Follow Up",
  schedule_training: "Schedule Training",
  send_info: "Send Info",
  other: "Other",
};

const ACTIVITY_ICONS: Record<string, typeof Clock> = {
  note_added: StickyNote,
  call_logged: PhoneCall,
  email_logged: Mail,
  status_changed: ClipboardList,
  rep_assigned: UserCheck,
  follow_up_scheduled: Clock,
  quote_requested: FileText,
  company_linked: Building2,
  contact_linked: User,
  training_event_created: Calendar,
  training_event_status_changed: Calendar,
  training_event_updated: Calendar,
  quote_created: FileText,
  quote_sent: FileText,
  quote_approved: FileText,
  quote_declined: FileText,
  quote_converted: FileText,
};

const ACTIVITY_LABELS: Record<string, string> = {
  note_added: "Note Added",
  call_logged: "Call Logged",
  email_logged: "Email Logged",
  status_changed: "Status Changed",
  rep_assigned: "Rep Assigned",
  follow_up_scheduled: "Follow-up Scheduled",
  quote_requested: "Quote Requested",
  company_linked: "Company Linked",
  contact_linked: "Contact Linked",
  training_event_created: "Training Event Created",
  training_event_status_changed: "Event Status Changed",
  training_event_updated: "Training Event Updated",
  quote_created: "Quote Created",
  quote_sent: "Quote Sent",
  quote_approved: "Quote Approved",
  quote_declined: "Quote Declined",
  quote_converted: "Quote Converted",
};

function statusBadge(status: OnsiteRequest["status"]) {
  const style = STATUS_BADGE_STYLES[status];
  if (!style) return <Badge variant="outline">{status}</Badge>;
  return <Badge className={style.bg}>{style.label}</Badge>;
}

function assignmentStatusBadge(status: string) {
  switch (status) {
    case "proposed":
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Proposed</Badge>;
    case "assigned":
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Assigned</Badge>;
    case "confirmed":
      return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">Confirmed</Badge>;
    case "completed":
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completed</Badge>;
    case "cancelled":
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function AssignmentHistoryPanel({ assignmentId }: { assignmentId: number }) {
  const { data, isLoading } = useQuery<{ history: StatusChange[] }>({
    queryKey: ["/api/admin/assignments", assignmentId, "history"],
    queryFn: () => fetch(`/api/admin/assignments/${assignmentId}/history`, { credentials: "include" }).then(r => r.json()),
  });

  if (isLoading) return <Skeleton className="h-8 w-full mt-2" />;

  const history = data?.history ?? [];
  if (history.length === 0) return <p className="text-xs text-muted-foreground mt-2">No status changes recorded.</p>;

  return (
    <div className="mt-2 border-t pt-2 space-y-1" data-testid={`history-panel-${assignmentId}`}>
      <p className="text-xs font-medium text-muted-foreground mb-1">Audit Trail</p>
      {history.map(h => (
        <div key={h.id} className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono text-[10px]">{new Date(h.createdAt).toLocaleString()}</span>
          <span className="font-medium">{h.changedByName}</span>
          <span>{h.previousStatus} → {h.newStatus}</span>
          {h.note && <span className="italic truncate max-w-[200px]">({h.note})</span>}
        </div>
      ))}
    </div>
  );
}

function ActivityTimeline({ leadId }: { leadId: string }) {
  const { data, isLoading } = useQuery<{ activities: LeadActivity[] }>({
    queryKey: ["/api/admin/leads", leadId, "activities"],
    queryFn: () => fetch(`/api/admin/leads/${leadId}/activities`, { credentials: "include" }).then(r => r.json()),
  });

  if (isLoading) return <Skeleton className="h-20 w-full" />;

  const activities = data?.activities ?? [];
  if (activities.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-activities">No activity recorded yet.</p>;
  }

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto" data-testid="activity-timeline">
      {activities.map((a) => {
        const Icon = ACTIVITY_ICONS[a.activityType] || Clock;
        const meta = a.metadata as Record<string, string> | null;
        return (
          <div key={a.id} className="flex gap-3 text-sm" data-testid={`activity-${a.id}`}>
            <div className="mt-0.5 shrink-0">
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-foreground">{ACTIVITY_LABELS[a.activityType] || a.activityType}</span>
                {a.actorName && <span className="text-muted-foreground">by {a.actorName}</span>}
              </div>
              {a.activityType === "status_changed" && meta && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {STATUS_LABELS[meta.previousStatus as OnsiteStatus] || meta.previousStatus} → {STATUS_LABELS[meta.newStatus as OnsiteStatus] || meta.newStatus}
                </p>
              )}
              {a.activityType === "company_linked" && meta?.companyName && (
                <p className="text-xs text-muted-foreground mt-0.5">Linked to {meta.companyName}</p>
              )}
              {a.activityType === "contact_linked" && meta?.contactName && (
                <p className="text-xs text-muted-foreground mt-0.5">Linked to {meta.contactName}</p>
              )}
              {a.activityType === "training_event_created" && meta && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Event #{meta.trainingEventId}: {meta.title as string}
                </p>
              )}
              {a.activityType === "training_event_status_changed" && meta && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Event #{meta.trainingEventId}: {meta.previousStatusLabel as string} → {meta.newStatusLabel as string}
                </p>
              )}
              {a.activityType === "training_event_updated" && meta && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Event #{meta.trainingEventId}: {Object.keys((meta.changes as Record<string, unknown>) || {}).join(", ")} updated
                </p>
              )}
              {a.notes && (
                <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap bg-muted/50 rounded p-2">{a.notes}</p>
              )}
              <p className="text-[10px] text-muted-foreground mt-1">{new Date(a.createdAt).toLocaleString()}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NoteComposer({ leadId }: { leadId: string }) {
  const [activityType, setActivityType] = useState("note_added");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (payload: { activityType: string; notes?: string }) =>
      apiRequest("POST", `/api/admin/leads/${leadId}/activities`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads", leadId, "activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads"] });
      toast({ title: "Activity logged" });
      setNotes("");
    },
    onError: (err: Error) => {
      toast({ title: "Failed to log activity", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-3 border-t pt-4" data-testid="note-composer">
      <div className="flex gap-2">
        <Select value={activityType} onValueChange={setActivityType}>
          <SelectTrigger className="w-[160px]" data-testid="select-activity-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="note_added">Add Note</SelectItem>
            <SelectItem value="call_logged">Log Call</SelectItem>
            <SelectItem value="email_logged">Log Email</SelectItem>
            <SelectItem value="quote_requested">Quote Requested</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add details about this interaction..."
        rows={3}
        data-testid="textarea-activity-notes"
      />
      <Button
        size="sm"
        onClick={() => mutation.mutate({ activityType, notes: notes || undefined })}
        disabled={mutation.isPending}
        data-testid="button-log-activity"
      >
        {mutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
        Log Activity
      </Button>
    </div>
  );
}

function NextActionPanel({ leadId, currentType, currentDate }: { leadId: string; currentType: string | null; currentDate: string | null }) {
  const [actionType, setActionType] = useState(currentType || "");
  const [actionDate, setActionDate] = useState(currentDate ? new Date(currentDate).toISOString().split("T")[0] : "");
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (payload: { nextActionType: string | null; nextActionDate: string | null }) =>
      apiRequest("PATCH", `/api/admin/leads/${leadId}/next-action`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/onsite-requests", leadId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads", leadId, "activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads"] });
      toast({ title: "Next action updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update next action", description: err.message, variant: "destructive" });
    },
  });

  const isOverdue = currentDate ? new Date(currentDate) < new Date() : false;

  return (
    <div className="space-y-3" data-testid="next-action-panel">
      {currentType && (
        <div className="flex items-center gap-2">
          {isOverdue && <AlertCircle className="h-4 w-4 text-red-500" />}
          <Badge variant={isOverdue ? "destructive" : "outline"} className="text-xs">
            {NEXT_ACTION_LABELS[currentType] || currentType}
            {currentDate && ` — ${new Date(currentDate).toLocaleDateString()}`}
          </Badge>
        </div>
      )}
      <div className="flex gap-2 items-end flex-wrap">
        <div>
          <Label className="text-xs">Action Type</Label>
          <Select value={actionType} onValueChange={setActionType}>
            <SelectTrigger className="w-[160px] h-8 text-xs" data-testid="select-next-action-type">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="call_back">Call Back</SelectItem>
              <SelectItem value="send_quote">Send Quote</SelectItem>
              <SelectItem value="follow_up">Follow Up</SelectItem>
              <SelectItem value="schedule_training">Schedule Training</SelectItem>
              <SelectItem value="send_info">Send Info</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Due Date</Label>
          <Input
            type="date"
            value={actionDate}
            onChange={(e) => setActionDate(e.target.value)}
            className="h-8 text-xs w-[140px]"
            data-testid="input-next-action-date"
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-8"
          disabled={!actionType || mutation.isPending}
          onClick={() => mutation.mutate({ nextActionType: actionType, nextActionDate: actionDate || null })}
          data-testid="button-set-next-action"
        >
          {mutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Set"}
        </Button>
        {currentType && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs"
            onClick={() => mutation.mutate({ nextActionType: null, nextActionDate: null })}
            disabled={mutation.isPending}
            data-testid="button-clear-next-action"
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}

function CompanyLinkPanel({ leadId, request }: { leadId: string; request: OnsiteRequest }) {
  const { toast } = useToast();

  const createCompanyMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/admin/leads/${leadId}/create-company`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/onsite-requests", leadId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads", leadId, "activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads"] });
      toast({ title: "Company created and linked" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to create company", description: err.message, variant: "destructive" });
    },
  });

  const createContactMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/admin/leads/${leadId}/create-contact`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/onsite-requests", leadId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads", leadId, "activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads"] });
      toast({ title: "Contact created and linked" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to create contact", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-3" data-testid="company-link-panel">
      <div className="flex items-center gap-3 flex-wrap">
        {request.companyId ? (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <Link href={`/admin/companies/${request.companyId}`} className="text-sm text-primary hover:underline font-medium" data-testid="link-company">
              View Company Record
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">No company linked</span>
            {request.companyName && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => createCompanyMutation.mutate()}
                disabled={createCompanyMutation.isPending}
                data-testid="button-create-company"
              >
                {createCompanyMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                Create "{request.companyName}"
              </Button>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        {request.contactId ? (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{request.contactName}</span>
            <Badge variant="secondary" className="text-[10px]">Linked</Badge>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">No contact linked</span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => createContactMutation.mutate()}
              disabled={createContactMutation.isPending}
              data-testid="button-create-contact"
            >
              {createContactMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
              Create Contact for "{request.contactName}"
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminOnsiteRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [newStatus, setNewStatus] = useState<string>("");
  const [statusInitialized, setStatusInitialized] = useState(false);
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [notesInitialized, setNotesInitialized] = useState(false);
  const [showMatchingPanel, setShowMatchingPanel] = useState(false);
  const [assignNote, setAssignNote] = useState("");
  const [expandedHistory, setExpandedHistory] = useState<number | null>(null);

  const { data, isLoading, isError } = useQuery<{ request: OnsiteRequest }>({
    queryKey: ["/api/admin/onsite-requests", id],
    enabled: !!id,
  });

  const request = data?.request;

  const { data: assignmentsData, isLoading: assignmentsLoading } = useQuery<{ assignments: Assignment[] }>({
    queryKey: ["/api/admin/onsite-requests", id, "assignments"],
    queryFn: () => fetch(`/api/admin/onsite-requests/${id}/assignments`, { credentials: "include" }).then(r => r.json()),
    enabled: !!id,
  });

  const assignments = assignmentsData?.assignments ?? [];
  const activeAssignments = assignments.filter(a => a.status !== "cancelled");

  const { data: matchingData, isLoading: matchingLoading } = useQuery<{ instructors: MatchedInstructor[] }>({
    queryKey: ["/api/admin/onsite-requests", id, "matching-instructors"],
    queryFn: () => fetch(`/api/admin/onsite-requests/${id}/matching-instructors`, { credentials: "include" }).then(r => r.json()),
    enabled: !!id && showMatchingPanel,
  });

  const matchedInstructors = matchingData?.instructors ?? [];

  const { data: trainingEventsData } = useQuery<{ events: { id: number; title: string; status: string; scheduledStart: string | null }[] }>({
    queryKey: ["/api/admin/training-events", "lead", id],
    queryFn: () => fetch(`/api/admin/training-events?originatingLeadId=${id}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!id,
  });

  const linkedEvents = trainingEventsData?.events ?? [];

  useEffect(() => {
    if (request && !notesInitialized) {
      setAdminNotes(request.adminNotes || "");
      setNotesInitialized(true);
    }
    if (request && !statusInitialized) {
      const currentStatus = request.status as OnsiteStatus;
      const validNext = VALID_TRANSITIONS[currentStatus] ?? [];
      setNewStatus(validNext.length > 0 ? validNext[0] : "");
      setStatusInitialized(true);
    }
  }, [request, notesInitialized, statusInitialized]);

  const mutation = useMutation({
    mutationFn: (payload: { status?: string; adminNotes?: string }) =>
      apiRequest("PATCH", `/api/admin/onsite-requests/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/onsite-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/onsite-requests", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads", id, "activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads"] });
      toast({ title: "Request updated", description: "Changes saved successfully." });
    },
    onError: () => {
      toast({ title: "Update failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    },
  });

  const assignMutation = useMutation({
    mutationFn: (payload: { instructorId: number; notes?: string }) =>
      apiRequest("POST", `/api/admin/onsite-requests/${id}/assignments`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/onsite-requests", id, "assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/onsite-requests", id, "matching-instructors"] });
      toast({ title: "Instructor assigned", description: "The instructor has been proposed for this request and notified by email." });
      setAssignNote("");
    },
    onError: (err: Error) => {
      toast({ title: "Assignment failed", description: err.message || "Something went wrong.", variant: "destructive" });
    },
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: (payload: { assignmentId: number; status: string; notes?: string }) =>
      apiRequest("PATCH", `/api/admin/assignments/${payload.assignmentId}`, { status: payload.status, notes: payload.notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/onsite-requests", id, "assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/onsite-requests", id, "matching-instructors"] });
      toast({ title: "Assignment updated", description: "Status changed successfully." });
    },
    onError: () => {
      toast({ title: "Update failed", description: "Something went wrong.", variant: "destructive" });
    },
  });

  function handleSave() {
    const payload: { status?: string; adminNotes?: string } = { adminNotes };
    if (newStatus && newStatus !== request?.status) {
      payload.status = newStatus;
    }
    mutation.mutate(payload);
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4 max-w-5xl">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (isError || !request) {
    return (
      <AdminLayout>
        <div className="max-w-5xl">
          <p className="text-destructive" data-testid="text-not-found">Request not found.</p>
          <Button variant="ghost" asChild className="mt-4">
            <Link href="/admin/onsite-requests">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Requests
            </Link>
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const preferredDates = [request.preferredDate1, request.preferredDate2, request.preferredDate3].filter(Boolean);

  return (
    <AdminLayout>
      <div className="max-w-5xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild data-testid="button-back">
            <Link href="/admin/onsite-requests">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold" data-testid="text-request-title">
                Request #{request.id}
              </h1>
              {statusBadge(request.status)}
              {activeAssignments.length > 0 && (
                <Badge variant="outline" className="gap-1">
                  <UserCheck className="h-3 w-3" />
                  {activeAssignments.length} instructor{activeAssignments.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Submitted {new Date(request.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border rounded-xl p-6 space-y-4">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Contact Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Contact Name</p>
                  <p className="font-medium" data-testid="text-contact-name">{request.contactName}</p>
                </div>
                {request.companyName && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Company</p>
                    <p className="font-medium flex items-center gap-1" data-testid="text-company-name">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      {request.companyName}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Email</p>
                  <a
                    href={`mailto:${request.email}`}
                    className="font-medium text-primary hover:underline flex items-center gap-1"
                    data-testid="link-contact-email"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {request.email}
                  </a>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Phone</p>
                  <a
                    href={`tel:${request.phone}`}
                    className="font-medium text-primary hover:underline flex items-center gap-1"
                    data-testid="link-contact-phone"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {request.phone}
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-xl p-6 space-y-4">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                Training Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Training Type</p>
                  <p className="font-medium" data-testid="text-training-type">{request.trainingType}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Trainees</p>
                  <p className="font-medium flex items-center gap-1" data-testid="text-trainee-count">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    {request.traineeCount}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-muted-foreground text-xs mb-1">Training Address</p>
                  <p className="font-medium flex items-start gap-1" data-testid="text-training-address">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                    <span>{request.trainingAddress}, {request.city}, {request.state} {request.zip}</span>
                  </p>
                </div>
                {(request.requestedLocationSlug || request.requestedLocationType) && (
                  <div className="sm:col-span-2">
                    <p className="text-muted-foreground text-xs mb-1">Market / Training Type</p>
                    <div className="flex gap-2 items-center">
                      {request.requestedLocationSlug && (
                        <Badge variant="outline" className="text-xs" data-testid="text-requested-location">
                          {getLocation(request.requestedLocationSlug)?.displayName ?? request.requestedLocationSlug}
                        </Badge>
                      )}
                      {request.requestedLocationType && (
                        <Badge variant="secondary" className="text-xs" data-testid="text-requested-location-type">
                          {request.requestedLocationType === "facility" ? "At Facility" : "Customer On-Site"}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                {request.equipmentTypes.length > 0 && (
                  <div className="sm:col-span-2">
                    <p className="text-muted-foreground text-xs mb-1 flex items-center gap-1">
                      <Wrench className="h-3.5 w-3.5" />
                      Equipment Types
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {request.equipmentTypes.map((eq) => (
                        <Badge key={eq} variant="secondary" className="text-xs">{eq}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {preferredDates.length > 0 && (
                  <div className="sm:col-span-2">
                    <p className="text-muted-foreground text-xs mb-1 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Preferred Dates
                    </p>
                    <div className="space-y-1 mt-1">
                      {preferredDates.map((d, i) => (
                        <p key={i} className="text-sm font-medium" data-testid={`text-preferred-date-${i + 1}`}>
                          Date {i + 1}: {d}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {request.notes && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1 flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Notes from Customer
                  </p>
                  <div className="bg-muted rounded-md p-3 text-sm whitespace-pre-wrap" data-testid="text-customer-notes">
                    {request.notes}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-card border rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  Instructor Assignments
                  {activeAssignments.length > 0 && (
                    <span className="text-xs text-muted-foreground font-normal">({activeAssignments.length} active)</span>
                  )}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMatchingPanel(!showMatchingPanel)}
                  data-testid="button-toggle-matching"
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  {showMatchingPanel ? "Hide" : "Find"} Instructors
                  {showMatchingPanel ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                </Button>
              </div>

              {assignmentsLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : activeAssignments.length === 0 ? (
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <UserPlus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground" data-testid="text-no-assignments">
                    No instructors assigned yet. Click "Find Instructors" to see matching candidates.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.map((a) => (
                    <div
                      key={a.id}
                      className={`border rounded-lg p-4 ${a.status === "cancelled" ? "opacity-50" : ""}`}
                      data-testid={`assignment-${a.id}`}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <div>
                            <Link
                              href={`/admin/instructors/${a.instructorId}`}
                              className="font-medium text-sm text-primary hover:underline"
                              data-testid={`link-assignment-instructor-${a.id}`}
                            >
                              {a.instructorName}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {a.instructorCity}, {a.instructorState} &middot; {a.instructorEmail}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {assignmentStatusBadge(a.status)}
                          {a.status !== "cancelled" && a.status !== "completed" && (() => {
                            const transitions: Record<string, { value: string; label: string }[]> = {
                              proposed: [{ value: "assigned", label: "Assigned" }, { value: "cancelled", label: "Cancelled" }],
                              assigned: [{ value: "confirmed", label: "Confirmed" }, { value: "cancelled", label: "Cancelled" }],
                              confirmed: [{ value: "completed", label: "Completed" }, { value: "cancelled", label: "Cancelled" }],
                            };
                            const options = transitions[a.status] ?? [];
                            return options.length > 0 ? (
                              <Select
                                value=""
                                onValueChange={(val) =>
                                  updateAssignmentMutation.mutate({ assignmentId: a.id, status: val })
                                }
                              >
                                <SelectTrigger className="w-[130px] h-8 text-xs" data-testid={`select-assignment-status-${a.id}`}>
                                  <SelectValue placeholder="Change..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {options.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : null;
                          })()}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Assigned by {a.assignedByName}</span>
                        <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                        {a.notes && <span className="italic">Note: {a.notes}</span>}
                        <button
                          className="text-primary hover:underline ml-auto"
                          onClick={() => setExpandedHistory(expandedHistory === a.id ? null : a.id)}
                          data-testid={`button-history-${a.id}`}
                        >
                          {expandedHistory === a.id ? "Hide" : "Show"} History
                        </button>
                      </div>
                      {expandedHistory === a.id && <AssignmentHistoryPanel assignmentId={a.id} />}
                    </div>
                  ))}
                </div>
              )}

              {showMatchingPanel && (
                <div className="border-t pt-4 mt-4 space-y-3">
                  <h3 className="font-medium text-sm text-foreground flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Matching Instructors
                  </h3>

                  {matchingLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                    </div>
                  ) : matchedInstructors.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center" data-testid="text-no-matches">
                      No available instructors found. All active instructors may already be assigned.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {matchedInstructors.map((inst) => {
                        const checklist = inst.onboardingChecklist ?? {};
                        const ready = checklist.readyForAssignment;
                        return (
                          <div
                            key={inst.id}
                            className="border rounded-lg p-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
                            data-testid={`match-instructor-${inst.id}`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/admin/instructors/${inst.id}`}
                                  className="font-medium text-sm truncate text-primary hover:underline"
                                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                  data-testid={`link-instructor-profile-${inst.id}`}
                                >
                                  {inst.fullName}
                                </Link>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] ${inst.matchScore >= 60 ? "border-emerald-500 text-emerald-700 dark:text-emerald-400" : inst.matchScore >= 30 ? "border-yellow-500 text-yellow-700 dark:text-yellow-400" : "border-gray-300 text-gray-500"}`}
                                >
                                  Score: {inst.matchScore}
                                </Badge>
                                {ready ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                ) : (
                                  <XCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {inst.city}, {inst.state}
                                {inst.travelRadius ? ` · ${inst.travelRadius}mi radius` : ""}
                                {inst.languages.length > 0 ? ` · ${inst.languages.join(", ")}` : ""}
                              </p>
                              {inst.matchReasons.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {inst.matchReasons.map((r, i) => (
                                    <Badge key={i} variant="secondary" className="text-[10px]">{r}</Badge>
                                  ))}
                                </div>
                              )}
                              {inst.equipmentClasses.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {inst.equipmentClasses.map((eq) => (
                                    <Badge key={eq} variant="outline" className="text-[10px]">{eq}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="ml-3 shrink-0"
                              disabled={assignMutation.isPending}
                              onClick={() => assignMutation.mutate({ instructorId: inst.id, notes: assignNote || undefined })}
                              data-testid={`button-assign-${inst.id}`}
                            >
                              {assignMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3 mr-1" />}
                              Assign
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="pt-2">
                    <Label className="text-xs text-muted-foreground">Assignment Note (optional)</Label>
                    <Textarea
                      value={assignNote}
                      onChange={(e) => setAssignNote(e.target.value)}
                      placeholder="Optional note for this assignment..."
                      rows={2}
                      className="mt-1"
                      data-testid="textarea-assign-note"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card border rounded-xl p-5 space-y-4">
              <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                CRM Links
              </h2>
              <CompanyLinkPanel leadId={id!} request={request} />
            </div>

            <div className="bg-card border rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Training Events
                </h2>
                <Link href={`/admin/training-events/new?fromLead=${id}`}>
                  <Button variant="outline" size="sm" data-testid="button-create-training-event-from-lead">
                    <Plus className="h-3 w-3 mr-1" />
                    Create Event
                  </Button>
                </Link>
              </div>
              {linkedEvents.length > 0 ? (
                linkedEvents.map(evt => (
                  <Link key={evt.id} href={`/admin/training-events/${evt.id}`}>
                    <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50 cursor-pointer" data-testid={`link-training-event-${evt.id}`}>
                      <div>
                        <span className="text-sm font-medium">{evt.title}</span>
                        <span className="text-xs text-muted-foreground ml-2 capitalize">{evt.status.replace(/_/g, " ")}</span>
                      </div>
                      <ChevronDown className="h-3 w-3 text-muted-foreground -rotate-90" />
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground" data-testid="text-no-linked-events">No training events linked to this lead yet.</p>
              )}
            </div>

            <LeadQuotesPanel leadId={Number(id)} companyId={request.companyId ?? null} contactId={request.contactId ?? null} />

            <div className="bg-card border rounded-xl p-5 space-y-4">
              <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Next Action
              </h2>
              <NextActionPanel leadId={id!} currentType={request.nextActionType} currentDate={request.nextActionDate} />
            </div>

            <div className="bg-card border rounded-xl p-5 space-y-4">
              <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                <StickyNote className="h-4 w-4 text-muted-foreground" />
                Admin Actions
              </h2>

              <div className="space-y-2">
                <Label htmlFor="status-select" className="text-xs">Status</Label>
                {(() => {
                  const currentStatus = (request?.status || "new_lead") as OnsiteStatus;
                  const validNext = VALID_TRANSITIONS[currentStatus] ?? [];
                  if (validNext.length === 0) return (
                    <div>
                      <Badge className="mb-2">{STATUS_LABELS[currentStatus] || currentStatus}</Badge>
                      <p className="text-xs text-muted-foreground">Terminal status — no transitions.</p>
                    </div>
                  );
                  return (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Current: <span className="font-medium">{STATUS_LABELS[currentStatus]}</span>
                      </p>
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger id="status-select" className="w-full" data-testid="select-request-status">
                          <SelectValue placeholder="Select next status" />
                        </SelectTrigger>
                        <SelectContent>
                          {validNext.map((s) => (
                            <SelectItem key={s} value={s}>{STATUS_LABELS[s] || s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })()}
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-notes" className="text-xs">Admin Notes</Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Internal notes..."
                  rows={3}
                  className="text-sm"
                  data-testid="textarea-admin-notes"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={mutation.isPending}
                  data-testid="button-save-changes"
                >
                  {mutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                  data-testid="button-email-customer"
                >
                  <a href={`mailto:${request.email}?subject=Re: Your On-Site Training Request`}>
                    <Mail className="h-4 w-4 mr-1" />
                    Email
                  </a>
                </Button>
              </div>
            </div>

            <div className="bg-card border rounded-xl p-5 space-y-4">
              <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                Activity Timeline
              </h2>
              <ActivityTimeline leadId={id!} />
              <NoteComposer leadId={id!} />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

interface LeadQuoteRow {
  id: number;
  title: string;
  status: QuoteStatus;
  total: number;
  createdAt: string;
}

function LeadQuotesPanel({ leadId, companyId, contactId }: { leadId: number; companyId: number | null; contactId: number | null }) {
  const { data, isLoading } = useQuery<{ quotes: LeadQuoteRow[] }>({
    queryKey: ["/api/admin/quotes", { originatingLeadId: leadId }],
    queryFn: () =>
      fetch(`/api/admin/quotes?originatingLeadId=${leadId}`, { credentials: "include" }).then((r) => r.json()),
    enabled: Number.isFinite(leadId) && leadId > 0,
  });

  const quotes = data?.quotes ?? [];
  const formatMoney = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((cents ?? 0) / 100);

  const createHref = [
    `/admin/quotes/new?leadId=${leadId}`,
    companyId ? `companyId=${companyId}` : "",
    contactId ? `contactId=${contactId}` : "",
  ].filter(Boolean).join("&");

  return (
    <div className="bg-card border rounded-xl p-5 space-y-3" data-testid="lead-quotes-panel">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4 text-muted-foreground" />
          Quotes
          <span className="text-xs text-muted-foreground font-normal">({quotes.length})</span>
        </h2>
        <Link href={createHref}>
          <Button variant="outline" size="sm" data-testid="button-create-quote-from-lead">
            <Plus className="h-3 w-3 mr-1" />
            New Quote
          </Button>
        </Link>
      </div>
      {isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : quotes.length === 0 ? (
        <p className="text-sm text-muted-foreground" data-testid="text-no-lead-quotes">No quotes linked to this lead yet.</p>
      ) : (
        <div className="space-y-1">
          {quotes.map((q) => (
            <Link key={q.id} href={`/admin/quotes/${q.id}`}>
              <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50 cursor-pointer" data-testid={`link-lead-quote-${q.id}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{q.title}</span>
                    <Badge variant="outline" className="text-xs shrink-0">{QUOTE_STATUS_LABELS[q.status]}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatMoney(q.total)} · {new Date(q.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
