/**
 * Quote Lifecycle State Model
 *
 * SEPARATION FROM CRM AND FULFILLMENT:
 * - CRM pipeline state lives on onsite_training_requests.status
 * - Fulfillment state lives on training_events.status
 * - Quote lifecycle lives on quotes.status — independent of both
 * - Creating, sending, or approving a quote does NOT advance the originating lead status
 * - Converting a quote to a training event creates a new event but does not advance the lead
 *
 * LIFECYCLE:
 * draft -> sent | canceled
 * sent -> approved | declined | expired | canceled
 * approved -> converted | canceled
 *
 * TERMINAL STATES:
 * declined, expired, converted, canceled
 *
 * TIMESTAMPS:
 * - sentAt: set when status becomes sent
 * - approvedAt: set when status becomes approved
 * - declinedAt: set when status becomes declined
 * - respondedAt: set the first time status becomes approved or declined
 * - updatedAt: maintained on every edit
 *
 * ACTIVITY LOGGING:
 * When originatingLeadId is set, these lead_activity records are emitted:
 * - quote_created on POST create
 * - quote_sent when status becomes sent
 * - quote_approved when status becomes approved
 * - quote_declined when status becomes declined
 * - quote_converted when /convert succeeds
 */
export const QUOTE_STATUSES = [
  "draft",
  "sent",
  "approved",
  "declined",
  "expired",
  "converted",
  "canceled",
] as const;

export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const VALID_QUOTE_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  draft: ["sent", "canceled"],
  sent: ["approved", "declined", "expired", "canceled"],
  approved: ["converted", "canceled"],
  declined: [],
  expired: [],
  converted: [],
  canceled: [],
};

export const TERMINAL_QUOTE_STATUSES: QuoteStatus[] = [
  "declined",
  "expired",
  "converted",
  "canceled",
];

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  approved: "Approved",
  declined: "Declined",
  expired: "Expired",
  converted: "Converted",
  canceled: "Canceled",
};

export function isQuoteTerminal(status: QuoteStatus): boolean {
  return TERMINAL_QUOTE_STATUSES.includes(status);
}

export function canTransitionQuote(from: QuoteStatus, to: QuoteStatus): boolean {
  return (VALID_QUOTE_TRANSITIONS[from] ?? []).includes(to);
}
