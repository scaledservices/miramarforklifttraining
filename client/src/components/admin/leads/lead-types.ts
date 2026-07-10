import type { OnsiteStatus } from "@shared/config/onsite-states";

/** Raw onsite training request lead from GET /api/admin/leads */
export interface OnsiteLead {
  id: number;
  companyName: string | null;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  traineeCount: number;
  trainingType: string;
  equipmentTypes: string[];
  status: OnsiteStatus;
  assignedRepId: number | null;
  repName: string | null;
  leadSource: string | null;
  requestedLocationSlug: string | null;
  nextActionType: string | null;
  nextActionDate: string | null;
  daysSinceActivity: number;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Raw contact form submission from GET /api/admin/contact-submissions */
export interface ContactSubmission {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  trainingType: string | null;
  message: string;
  createdAt: string;
}

export type LeadSourceKind = "onsite" | "contact";

/** One row in the unified leads list. */
export interface UnifiedLead {
  key: string;
  sourceKind: LeadSourceKind;
  id: number;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  /** Onsite pipeline status; null for contact-form inquiries (no status model). */
  status: OnsiteStatus | null;
  /** Detail page path; null when no detail page exists (contact form). */
  detailPath: string | null;
  createdAt: string;
  // Onsite extras
  trainingType: string | null;
  traineeCount: number | null;
  city: string | null;
  state: string | null;
  isOverdue: boolean;
  /** Where the lead came from (?ref= attribution: city page, ad, campaign); null when unknown. */
  leadSource: string | null;
  // Contact extras
  message: string | null;
}

export const SOURCE_LABELS: Record<LeadSourceKind, string> = {
  onsite: "Onsite request",
  contact: "Contact form",
};

export const SOURCE_BADGE_STYLES: Record<LeadSourceKind, string> = {
  onsite: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  contact: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
};

export const STATUS_BADGE_STYLES: Record<string, string> = {
  new_lead: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  contacted: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  quoted: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  quote_accepted: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  quote_declined: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  scheduled: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  confirmed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  completed: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  invoiced: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  unresponsive: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function onsiteToUnified(lead: OnsiteLead): UnifiedLead {
  return {
    key: `onsite-${lead.id}`,
    sourceKind: "onsite",
    id: lead.id,
    name: lead.contactName,
    company: lead.companyName,
    email: lead.email,
    phone: lead.phone || null,
    status: lead.status,
    detailPath: `/admin/onsite-requests/${lead.id}`,
    createdAt: lead.createdAt,
    trainingType: lead.trainingType,
    traineeCount: lead.traineeCount,
    city: lead.city,
    state: lead.state,
    isOverdue: lead.isOverdue,
    leadSource: lead.leadSource,
    message: null,
  };
}

export function contactToUnified(sub: ContactSubmission): UnifiedLead {
  return {
    key: `contact-${sub.id}`,
    sourceKind: "contact",
    id: sub.id,
    name: sub.name,
    company: null,
    email: sub.email,
    phone: sub.phone || null,
    status: null,
    detailPath: null,
    createdAt: sub.createdAt,
    trainingType: sub.trainingType,
    traineeCount: null,
    city: null,
    state: null,
    isOverdue: false,
    leadSource: null,
    message: sub.message,
  };
}
