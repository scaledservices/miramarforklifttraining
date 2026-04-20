export const ONSITE_STATUSES = [
  "new_lead",
  "contacted",
  "quoted",
  "quote_accepted",
  "quote_declined",
  "scheduled",
  "confirmed",
  "completed",
  "invoiced",
  "unresponsive",
  "cancelled",
] as const;

export type OnsiteStatus = (typeof ONSITE_STATUSES)[number];

export const VALID_TRANSITIONS: Record<OnsiteStatus, OnsiteStatus[]> = {
  new_lead: ["contacted", "quoted", "unresponsive", "cancelled"],
  contacted: ["quoted", "scheduled", "unresponsive", "cancelled"],
  quoted: ["quote_accepted", "quote_declined", "unresponsive", "cancelled"],
  quote_accepted: ["scheduled", "confirmed", "cancelled"],
  quote_declined: [],
  scheduled: ["confirmed", "completed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: ["invoiced"],
  invoiced: [],
  unresponsive: [],
  cancelled: [],
};

export const TERMINAL_STATUSES: OnsiteStatus[] = [
  "invoiced",
  "quote_declined",
  "unresponsive",
  "cancelled",
];

export const STATUS_LABELS: Record<OnsiteStatus, string> = {
  new_lead: "New Lead",
  contacted: "Contacted",
  quoted: "Quoted",
  quote_accepted: "Quote Accepted",
  quote_declined: "Quote Declined",
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  completed: "Completed",
  invoiced: "Invoiced",
  unresponsive: "Unresponsive",
  cancelled: "Cancelled",
};

export const LEGACY_STATUS_MAP: Record<string, OnsiteStatus> = {
  pending: "new_lead",
  reviewing: "contacted",
  approved: "scheduled",
  declined: "cancelled",
  scheduled: "scheduled",
};
