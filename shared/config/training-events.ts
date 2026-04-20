/**
 * Training Event Fulfillment State Model
 *
 * SEPARATION FROM CRM PIPELINE:
 * - CRM pipeline state lives on onsite_training_requests.status (new_lead → contacted → … → invoiced)
 * - Fulfillment state lives on training_events.status (unscheduled → … → completed/canceled)
 * - Creating a training event does NOT move the originating lead to "scheduled"
 * - Lead pipeline transitions are explicit, managed through CRM routes only
 *
 * TWO DISTINCT "UNSCHEDULED" CONCEPTS:
 * - "Lead needing scheduling" = an active CRM lead with no linked training event
 *   (derived at runtime: leads NOT in terminal CRM states AND NOT linked to any training_events row)
 * - "Unscheduled training event" = a training_events row with status="unscheduled"
 *   (fulfillment record exists but dates/logistics not yet assigned)
 *
 * ACTIVITY LOGGING:
 * When originatingLeadId is set, these lead_activity records are emitted:
 * - training_event_created: on POST create
 * - training_event_status_changed: on PATCH status transition
 * - training_event_updated: on PATCH when material fields change (dates, location, company, contact)
 * Non-material changes (e.g. adminNotes only) do not emit activity records.
 */
export const TRAINING_EVENT_STATUSES = [
  "unscheduled",
  "scheduling_in_progress",
  "scheduled",
  "awaiting_confirmation",
  "completed",
  "canceled",
] as const;

export type TrainingEventStatus = (typeof TRAINING_EVENT_STATUSES)[number];

export const VALID_EVENT_TRANSITIONS: Record<TrainingEventStatus, TrainingEventStatus[]> = {
  unscheduled: ["scheduling_in_progress", "scheduled", "canceled"],
  scheduling_in_progress: ["scheduled", "canceled"],
  scheduled: ["awaiting_confirmation", "completed", "canceled"],
  awaiting_confirmation: ["scheduled", "completed", "canceled"],
  completed: [],
  canceled: [],
};

export const TERMINAL_EVENT_STATUSES: TrainingEventStatus[] = ["completed", "canceled"];

export const EVENT_STATUS_LABELS: Record<TrainingEventStatus, string> = {
  unscheduled: "Unscheduled",
  scheduling_in_progress: "Scheduling In Progress",
  scheduled: "Scheduled",
  awaiting_confirmation: "Awaiting Confirmation",
  completed: "Completed",
  canceled: "Canceled",
};
