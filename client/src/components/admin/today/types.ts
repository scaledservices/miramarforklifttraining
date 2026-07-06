// Response shape of GET /api/admin/today (server/routes/today.ts).

export interface TodayBooking {
  id: number;
  bookingNumber: string;
  status: "pending" | "confirmed" | "completed";
  contactName: string;
  contactPhone: string;
  areaName: string;
  productSlug: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  participantCount: number;
  address: string;
  total: number;
  paid: number;
  balanceDue: number;
  createdAt: string;
}

export interface WeekDayGroup {
  areaName: string;
  participants: number;
  revenue: number;
  bookingCount: number;
}

export interface WeekDay {
  date: string;
  groups: WeekDayGroup[];
}

export interface TodayLead {
  type: "onsite_request" | "contact";
  id: number;
  name: string;
  phone: string | null;
  company: string | null;
  detail: string | null;
  status: string | null;
  createdAt: string;
}

export interface TodayData {
  date: string;
  todaySessions: TodayBooking[];
  awaitingConfirmation: TodayBooking[];
  unpaidBalances: TodayBooking[];
  week: WeekDay[];
  newLeads: TodayLead[];
}

/** "standard-forklift-certification-san-diego" -> "Standard Forklift Certification" */
export function productLabel(slug: string): string {
  return slug
    .replace(/-(san-diego|las-vegas|fresno)$/, "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function formatMoney(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** "2026-07-07" -> "Tue, Jul 7" (noon avoids timezone date shifts) */
export function formatDay(date: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" }): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", opts);
}
