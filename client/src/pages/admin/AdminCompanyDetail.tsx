import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft, Building2, Phone, Mail, Globe, MapPin, Briefcase, Users,
  Plus, ClipboardList, ShoppingCart, Award, Calendar, DollarSign,
  GraduationCap, AlertTriangle, X, UserCheck, FileText,
} from "lucide-react";
import {
  QUOTE_STATUS_LABELS,
  type QuoteStatus,
} from "@shared/config/quote-states";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { STATUS_LABELS, type OnsiteStatus } from "@shared/config/onsite-states";
import { EVENT_STATUS_LABELS, type TrainingEventStatus } from "@shared/config/training-events";
import { getAllLocations } from "@shared/config/locations";

interface Company {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  billingStreet: string | null;
  billingCity: string | null;
  billingState: string | null;
  billingZip: string | null;
  industry: string | null;
  employeeCount: number | null;
  assignedRepId: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Contact {
  id: number;
  companyId: number | null;
  userId: number | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  role: string | null;
  isPrimary: boolean;
  notes: string | null;
  tags: string[];
}

const TAG_LABEL_KEYS: Record<string, string> = {
  business_contact: "adminCompany.tagBusinessContact",
  learner: "adminCompany.tagLearner",
  platform_user: "adminCompany.tagPlatformUser",
  decision_maker: "adminCompany.tagDecisionMaker",
  safety_manager: "adminCompany.tagSafetyManager",
  billing: "adminCompany.tagBilling",
};

const AVAILABLE_TAGS = Object.keys(TAG_LABEL_KEYS);

interface SearchedUser {
  id: number;
  name: string;
  email: string;
}

interface OnsiteRequest {
  id: number;
  contactName: string;
  trainingType: string;
  traineeCount: number;
  status: OnsiteStatus;
  createdAt: string;
}

interface Order {
  id: number;
  orderNumber: string;
  total: string;
  status: string;
  createdAt: string;
}

interface CompanyTrainingEvent {
  id: number;
  title: string;
  status: TrainingEventStatus;
  locationType: string;
  locationSlug: string | null;
  onsiteCity: string | null;
  onsiteState: string | null;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  createdAt: string;
}

interface CompanyCertification {
  id: number;
  certificateNumber: string;
  status: string;
  userId: number;
  courseId: number;
  issuedAt: string;
  expiresAt: string | null;
  learnerName: string;
  courseName: string;
}

interface CompanySummaryStats {
  totalRevenue: number;
  orderCount: number;
  activeLearners: number;
  totalCertifications: number;
  expiringCertifications: number;
  leadCount: number;
  trainingEventCount: number;
  trainingEventsByStatus: Record<string, number>;
}

const STATUS_BADGE_STYLES: Record<string, string> = {
  new_lead: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  contacted: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  quoted: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  quote_accepted: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  scheduled: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  confirmed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  completed: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  invoiced: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

export default function AdminCompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactFirst, setContactFirst] = useState("");
  const [contactLast, setContactLast] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactTitle, setContactTitle] = useState("");
  const [contactRole, setContactRole] = useState("other");
  const [linkingContactId, setLinkingContactId] = useState<number | null>(null);
  const [userSearchEmail, setUserSearchEmail] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<SearchedUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editIndustry, setEditIndustry] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const { data, isLoading, isError } = useQuery<{
    company: Company;
    contacts: Contact[];
    requests: OnsiteRequest[];
    orders: Order[];
    trainingEvents: CompanyTrainingEvent[];
    certifications: CompanyCertification[];
  }>({
    queryKey: ["/api/admin/companies", id],
    enabled: !!id,
  });

  const { data: summaryStats } = useQuery<CompanySummaryStats>({
    queryKey: ["/api/admin/companies", id, "summary"],
    enabled: !!id,
  });

  const company = data?.company;
  const companyContacts = data?.contacts ?? [];
  const requests = data?.requests ?? [];
  const orders = data?.orders ?? [];
  const companyEvents = data?.trainingEvents ?? [];
  const companyCerts = data?.certifications ?? [];
  const allLocations = getAllLocations();

  useEffect(() => {
    if (company && !editing) {
      setEditName(company.name);
      setEditPhone(company.phone || "");
      setEditEmail(company.email || "");
      setEditWebsite(company.website || "");
      setEditIndustry(company.industry || "");
      setEditNotes(company.notes || "");
    }
  }, [company, editing]);

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, string | number | null | undefined>) =>
      apiRequest("PATCH", `/api/admin/companies/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies"] });
      toast({ title: "Company updated" });
      setEditing(false);
    },
    onError: (err: Error) => {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    },
  });

  const addContactMutation = useMutation({
    mutationFn: (payload: Record<string, string | number | boolean | null>) =>
      apiRequest("POST", `/api/admin/companies/${id}/contacts`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies", id] });
      toast({ title: "Contact added" });
      setShowAddContact(false);
      setContactFirst(""); setContactLast(""); setContactEmail("");
      setContactPhone(""); setContactTitle(""); setContactRole("other");
    },
    onError: (err: Error) => {
      toast({ title: "Failed to add contact", description: err.message, variant: "destructive" });
    },
  });

  const linkUserMutation = useMutation({
    mutationFn: async ({ contactId, userId }: { contactId: number; userId: number | null }) => {
      await apiRequest("PATCH", `/api/admin/contacts/${contactId}/link-user`, { userId });
      return userId;
    },
    onSuccess: (linkedUserId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies", id] });
      toast({ title: linkedUserId ? t("adminCompany.userLinked") : t("adminCompany.userUnlinked") });
      setLinkingContactId(null);
      setUserSearchEmail("");
      setUserSearchResults([]);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateTagsMutation = useMutation({
    mutationFn: async ({ contactId, tags }: { contactId: number; tags: string[] }) => {
      await apiRequest("PATCH", `/api/admin/contacts/${contactId}`, { tags });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies", id] });
      toast({ title: t("adminCompany.tagsUpdated") });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  async function searchUsers(email: string) {
    if (email.length < 3) { setUserSearchResults([]); return; }
    setSearchingUsers(true);
    try {
      const res = await fetch(`/api/admin/users/search?email=${encodeURIComponent(email)}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUserSearchResults(data.users || []);
      }
    } catch { /* ignore */ }
    setSearchingUsers(false);
  }

  function handleSave() {
    updateMutation.mutate({
      name: editName,
      phone: editPhone || null,
      email: editEmail || null,
      website: editWebsite || null,
      industry: editIndustry || null,
      notes: editNotes || null,
    });
  }

  function handleAddContact() {
    if (!contactFirst.trim() || !contactLast.trim()) return;
    addContactMutation.mutate({
      firstName: contactFirst.trim(),
      lastName: contactLast.trim(),
      email: contactEmail || null,
      phone: contactPhone || null,
      title: contactTitle || null,
      role: contactRole,
    });
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4 max-w-4xl">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (isError || !company) {
    return (
      <AdminLayout>
        <div className="max-w-4xl">
          <p className="text-destructive" data-testid="text-not-found">Company not found.</p>
          <Button variant="ghost" asChild className="mt-4">
            <Link href="/admin/companies">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Companies
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
            <Link href="/admin/companies">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-company-title">
              <Building2 className="h-5 w-5" />
              {company.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Added {new Date(company.createdAt).toLocaleDateString()}
            </p>
          </div>
          {!editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} data-testid="button-edit-company">
              Edit
            </Button>
          )}
        </div>

        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            Company Details
          </h2>
          {editing ? (
            <div className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input value={editName} onChange={e => setEditName(e.target.value)} data-testid="input-edit-name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Phone</Label>
                  <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={editEmail} onChange={e => setEditEmail(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Website</Label>
                  <Input value={editWebsite} onChange={e => setEditWebsite(e.target.value)} />
                </div>
                <div>
                  <Label>Industry</Label>
                  <Input value={editIndustry} onChange={e => setEditIndustry(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={updateMutation.isPending} data-testid="button-save-company">
                  {updateMutation.isPending ? "Saving..." : "Save"}
                </Button>
                <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {company.phone && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Phone</p>
                  <p className="font-medium flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{company.phone}</p>
                </div>
              )}
              {company.email && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Email</p>
                  <p className="font-medium flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{company.email}</p>
                </div>
              )}
              {company.website && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Website</p>
                  <p className="font-medium flex items-center gap-1"><Globe className="h-3.5 w-3.5" />{company.website}</p>
                </div>
              )}
              {company.industry && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Industry</p>
                  <p className="font-medium flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{company.industry}</p>
                </div>
              )}
              {(company.billingCity || company.billingState) && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Location</p>
                  <p className="font-medium flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {[company.billingStreet, company.billingCity, company.billingState, company.billingZip].filter(Boolean).join(", ")}
                  </p>
                </div>
              )}
              {company.employeeCount && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Employees</p>
                  <p className="font-medium flex items-center gap-1"><Users className="h-3.5 w-3.5" />{company.employeeCount}</p>
                </div>
              )}
              {company.notes && (
                <div className="sm:col-span-2">
                  <p className="text-muted-foreground text-xs mb-1">Notes</p>
                  <div className="bg-muted rounded-md p-3 text-sm whitespace-pre-wrap">{company.notes}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {summaryStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3" data-testid="panel-company-summary">
            <div className="bg-card border rounded-xl p-4 text-center">
              <DollarSign className="h-4 w-4 mx-auto text-green-600 mb-1" />
              <p className="text-lg font-bold" data-testid="text-total-revenue">
                ${summaryStats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground">{t("adminCompany.revenue")}</p>
            </div>
            <div className="bg-card border rounded-xl p-4 text-center">
              <ShoppingCart className="h-4 w-4 mx-auto text-blue-600 mb-1" />
              <p className="text-lg font-bold" data-testid="text-order-count">{summaryStats.orderCount}</p>
              <p className="text-xs text-muted-foreground">{t("adminCompany.paidOrders")}</p>
            </div>
            <div className="bg-card border rounded-xl p-4 text-center">
              <ClipboardList className="h-4 w-4 mx-auto text-sky-600 mb-1" />
              <p className="text-lg font-bold" data-testid="text-lead-count">{summaryStats.leadCount}</p>
              <p className="text-xs text-muted-foreground">{t("adminCompany.leads")}</p>
            </div>
            <div className="bg-card border rounded-xl p-4 text-center">
              <Calendar className="h-4 w-4 mx-auto text-purple-600 mb-1" />
              <p className="text-lg font-bold" data-testid="text-event-count">{summaryStats.trainingEventCount}</p>
              <p className="text-xs text-muted-foreground">{t("adminCompany.events")}</p>
            </div>
            <div className="bg-card border rounded-xl p-4 text-center">
              <GraduationCap className="h-4 w-4 mx-auto text-indigo-600 mb-1" />
              <p className="text-lg font-bold" data-testid="text-active-learners">{summaryStats.activeLearners}</p>
              <p className="text-xs text-muted-foreground">{t("adminCompany.activeLearners")}</p>
            </div>
            <div className="bg-card border rounded-xl p-4 text-center">
              <Award className="h-4 w-4 mx-auto text-amber-600 mb-1" />
              <p className="text-lg font-bold" data-testid="text-total-certs">{summaryStats.totalCertifications}</p>
              <p className="text-xs text-muted-foreground">{t("adminCompany.certifications")}</p>
            </div>
            <div className="bg-card border rounded-xl p-4 text-center">
              <AlertTriangle className="h-4 w-4 mx-auto text-orange-500 mb-1" />
              <p className="text-lg font-bold" data-testid="text-expiring-certs">{summaryStats.expiringCertifications}</p>
              <p className="text-xs text-muted-foreground">{t("adminCompany.expiring90d")}</p>
            </div>
          </div>
        )}

        <div className="bg-card border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Contacts
              <span className="text-xs text-muted-foreground font-normal">({companyContacts.length})</span>
            </h2>
            <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" data-testid="button-add-contact">
                  <Plus className="h-4 w-4 mr-1" /> Add Contact
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Contact</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>First Name *</Label>
                      <Input value={contactFirst} onChange={e => setContactFirst(e.target.value)} data-testid="input-contact-first" />
                    </div>
                    <div>
                      <Label>Last Name *</Label>
                      <Input value={contactLast} onChange={e => setContactLast(e.target.value)} data-testid="input-contact-last" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Email</Label>
                      <Input value={contactEmail} onChange={e => setContactEmail(e.target.value)} data-testid="input-contact-email" />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input value={contactPhone} onChange={e => setContactPhone(e.target.value)} data-testid="input-contact-phone" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Title</Label>
                      <Input value={contactTitle} onChange={e => setContactTitle(e.target.value)} data-testid="input-contact-title" />
                    </div>
                    <div>
                      <Label>Role</Label>
                      <Select value={contactRole} onValueChange={setContactRole}>
                        <SelectTrigger data-testid="select-contact-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="decision_maker">Decision Maker</SelectItem>
                          <SelectItem value="training_manager">Training Manager</SelectItem>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={handleAddContact} disabled={!contactFirst.trim() || !contactLast.trim() || addContactMutation.isPending} className="w-full" data-testid="button-submit-contact">
                    {addContactMutation.isPending ? "Adding..." : "Add Contact"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {companyContacts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No contacts yet.</p>
          ) : (
            <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>{t("adminCompany.tags")}</TableHead>
                  <TableHead>{t("adminCompany.linkedUser")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companyContacts.map(c => (
                  <TableRow key={c.id} data-testid={`row-contact-${c.id}`}>
                    <TableCell className="font-medium">
                      {c.firstName} {c.lastName}
                      {c.isPrimary && <Badge variant="secondary" className="ml-2 text-[10px]">Primary</Badge>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.email || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.phone || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.title || "—"}</TableCell>
                    <TableCell>
                      {c.role && <Badge variant="outline" className="text-xs capitalize">{c.role.replace(/_/g, " ")}</Badge>}
                    </TableCell>
                    <TableCell data-testid={`cell-contact-tags-${c.id}`}>
                      <div className="flex flex-wrap gap-1 items-center">
                        {(c.tags || []).map(tag => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-[10px] cursor-pointer hover:bg-destructive/20"
                            onClick={() => {
                              const newTags = (c.tags || []).filter(tg => tg !== tag);
                              updateTagsMutation.mutate({ contactId: c.id, tags: newTags });
                            }}
                            data-testid={`badge-tag-${c.id}-${tag}`}
                          >
                            {t(TAG_LABEL_KEYS[tag] ?? tag)}
                            <X className="h-2.5 w-2.5 ml-1" />
                          </Badge>
                        ))}
                        <Select
                          value=""
                          onValueChange={(val) => {
                            if (val && !(c.tags || []).includes(val)) {
                              updateTagsMutation.mutate({ contactId: c.id, tags: [...(c.tags || []), val] });
                            }
                          }}
                        >
                          <SelectTrigger className="h-6 w-6 p-0 border-dashed" data-testid={`button-add-tag-${c.id}`}>
                            <Plus className="h-3 w-3" />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABLE_TAGS
                              .filter(tag => !(c.tags || []).includes(tag))
                              .map(tag => (
                                <SelectItem key={tag} value={tag} data-testid={`option-tag-${tag}`}>
                                  {t(TAG_LABEL_KEYS[tag] ?? tag)}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell data-testid={`text-contact-linked-user-${c.id}`}>
                      {c.userId ? (
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary" className="text-xs">
                            {t("adminCompany.linkedUserLabel", { id: c.userId })}
                          </Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-5 w-5"
                            onClick={() => linkUserMutation.mutate({ contactId: c.id, userId: null })}
                            disabled={linkUserMutation.isPending}
                            data-testid={`button-unlink-user-${c.id}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7"
                          onClick={() => {
                            setLinkingContactId(c.id);
                            setUserSearchEmail(c.email || "");
                            if (c.email) searchUsers(c.email);
                          }}
                          data-testid={`button-link-user-${c.id}`}
                        >
                          {t("adminCompany.linkUser")}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Dialog open={linkingContactId !== null} onOpenChange={(open) => { if (!open) { setLinkingContactId(null); setUserSearchEmail(""); setUserSearchResults([]); } }}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("adminCompany.linkUserTitle")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>{t("adminCompany.searchByEmail")}</Label>
                    <Input
                      value={userSearchEmail}
                      onChange={e => { setUserSearchEmail(e.target.value); searchUsers(e.target.value); }}
                      placeholder={t("adminCompany.searchPlaceholder")}
                      data-testid="input-search-user-email"
                    />
                  </div>
                  {searchingUsers && <p className="text-xs text-muted-foreground">{t("adminCompany.searching")}</p>}
                  {userSearchResults.length > 0 && (
                    <div className="border rounded-md max-h-48 overflow-y-auto">
                      {userSearchResults.map(u => (
                        <div
                          key={u.id}
                          className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer text-sm"
                          onClick={() => linkUserMutation.mutate({ contactId: linkingContactId!, userId: u.id })}
                          data-testid={`button-select-user-${u.id}`}
                        >
                          <div>
                            <div className="font-medium">{u.name}</div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                          </div>
                          <Badge variant="outline" className="text-xs">{t("adminCompany.select")}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  {!searchingUsers && userSearchEmail.length >= 3 && userSearchResults.length === 0 && (
                    <p className="text-xs text-muted-foreground">{t("adminCompany.noUsersFound")}</p>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            </>
          )}
        </div>

        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            Training Requests
            <span className="text-xs text-muted-foreground font-normal">({requests.length})</span>
          </h2>
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No training requests linked to this company.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Trainees</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map(r => (
                  <TableRow key={r.id} data-testid={`row-request-${r.id}`} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <Link href={`/admin/onsite-requests/${r.id}`} className="text-primary hover:underline">
                        #{r.id}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">{r.contactName}</TableCell>
                    <TableCell className="text-sm">{r.trainingType}</TableCell>
                    <TableCell className="text-sm">{r.traineeCount}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_BADGE_STYLES[r.status] || ""}>
                        {STATUS_LABELS[r.status] || r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Training Events
            <span className="text-xs text-muted-foreground font-normal">({companyEvents.length})</span>
          </h2>
          {companyEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-training-events">No training events linked to this company.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Scheduled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companyEvents.map(evt => (
                  <TableRow key={evt.id} data-testid={`row-training-event-${evt.id}`} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <Link href={`/admin/training-events/${evt.id}`} className="text-primary hover:underline font-medium">
                        {evt.title}
                      </Link>
                      <span className="text-xs text-muted-foreground ml-1">#{evt.id}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">
                        {EVENT_STATUS_LABELS[evt.status] || evt.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {evt.locationType === "facility"
                        ? allLocations.find(l => l.slug === evt.locationSlug)?.displayName ?? "Facility"
                        : evt.onsiteCity && evt.onsiteState
                          ? `${evt.onsiteCity}, ${evt.onsiteState}`
                          : "On-Site"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {evt.scheduledStart
                        ? `${new Date(evt.scheduledStart).toLocaleDateString()} ${new Date(evt.scheduledStart).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
                        : "Not scheduled"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <CompanyQuotesPanel companyId={Number(id)} />

        {orders.length > 0 && (
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              Orders
              <span className="text-xs text-muted-foreground font-normal">({orders.length})</span>
            </h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(o => (
                  <TableRow key={o.id} data-testid={`row-order-${o.id}`}>
                    <TableCell className="font-medium">{o.orderNumber}</TableCell>
                    <TableCell>${parseFloat(o.total).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={o.status === "paid" ? "default" : "secondary"} className="capitalize">
                        {o.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Award className="h-4 w-4 text-muted-foreground" />
            {t("adminCompany.certifications")}
            <span className="text-xs text-muted-foreground font-normal">({companyCerts.length})</span>
          </h2>
          {companyCerts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-certs-empty">
              {t("adminCompany.noCertificationsYet")}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("adminCompany.certificateNumber")}</TableHead>
                  <TableHead>{t("adminCompany.learner")}</TableHead>
                  <TableHead>{t("adminCompany.course")}</TableHead>
                  <TableHead>{t("adminCompany.status")}</TableHead>
                  <TableHead>{t("adminCompany.issued")}</TableHead>
                  <TableHead>{t("adminCompany.expires")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companyCerts.map((cert) => {
                  const isExpiring = cert.expiresAt && new Date(cert.expiresAt) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) && new Date(cert.expiresAt) >= new Date();
                  return (
                    <TableRow key={cert.id} data-testid={`row-cert-${cert.id}`}>
                      <TableCell className="font-mono text-sm" data-testid={`text-cert-number-${cert.id}`}>
                        <Link href={`/admin/certifications/${cert.id}`} className="text-primary hover:underline">
                          {cert.certificateNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm" data-testid={`text-cert-learner-${cert.id}`}>
                        <Link href={`/admin/users/${cert.userId}`} className="text-primary hover:underline">
                          {cert.learnerName}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm" data-testid={`text-cert-course-${cert.id}`}>
                        {cert.courseName}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={cert.status === "issued" ? "default" : "secondary"}
                          className={cert.status === "revoked" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" : ""}
                          data-testid={`badge-cert-status-${cert.id}`}
                        >
                          {cert.status}
                        </Badge>
                        {isExpiring && (
                          <Badge variant="outline" className="ml-1 text-orange-600 border-orange-300" data-testid={`badge-cert-expiring-${cert.id}`}>
                            {t("adminCompany.expiring")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(cert.issuedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {cert.expiresAt ? new Date(cert.expiresAt).toLocaleDateString() : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

interface CompanyQuoteRow {
  id: number;
  title: string;
  status: QuoteStatus;
  total: number;
  createdAt: string;
  linkedTrainingEventId: number | null;
}

function CompanyQuotesPanel({ companyId }: { companyId: number }) {
  const { data, isLoading } = useQuery<{ quotes: CompanyQuoteRow[] }>({
    queryKey: ["/api/admin/quotes", { companyId }],
    queryFn: () =>
      fetch(`/api/admin/quotes?companyId=${companyId}`, { credentials: "include" }).then((r) => r.json()),
    enabled: Number.isFinite(companyId) && companyId > 0,
  });

  const quotes = data?.quotes ?? [];
  const formatMoney = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((cents ?? 0) / 100);

  return (
    <div className="bg-card border rounded-xl p-6 space-y-4" data-testid="company-quotes-panel">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          Quotes
          <span className="text-xs text-muted-foreground font-normal">({quotes.length})</span>
        </h2>
        <Link href={`/admin/quotes/new?companyId=${companyId}`}>
          <Button variant="outline" size="sm" data-testid="button-create-quote-from-company">
            <Plus className="h-3 w-3 mr-1" />
            New Quote
          </Button>
        </Link>
      </div>
      {isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : quotes.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-quotes">
          No quotes for this company yet.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quote</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.map((q) => (
              <TableRow key={q.id} className="cursor-pointer hover:bg-muted/50" data-testid={`row-company-quote-${q.id}`}>
                <TableCell>
                  <Link href={`/admin/quotes/${q.id}`} className="text-primary hover:underline font-medium">
                    {q.title}
                  </Link>
                  <span className="text-xs text-muted-foreground ml-1">#{q.id}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">{QUOTE_STATUS_LABELS[q.status]}</Badge>
                </TableCell>
                <TableCell className="text-sm">{formatMoney(q.total)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(q.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
