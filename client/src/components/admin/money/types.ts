export interface MoneyPeriodSummary {
  start: string;
  end: string;
  collected: number;
  refunded: number;
  outstanding: number;
}

export interface MoneySummary {
  week: MoneyPeriodSummary;
  month: MoneyPeriodSummary;
  totalOutstanding: number;
}

export interface RevenueSplitConfig {
  albertoCommissionPercent: number;
  newCustomerCommissionPercent: number;
  newCustomerAlbertoSharePercent: number;
}

export interface SplitConfigResponse {
  config: RevenueSplitConfig;
  defaults: RevenueSplitConfig;
}

export interface PartySplit {
  alberto: number;
  scaled: number;
  miramar: number;
}

export interface StatementLineItem {
  paymentId: number;
  date: string;
  orderId: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  provider: string;
  amount: number;
  isRefund: boolean;
  isNewCustomer: boolean;
  classificationSource?: "legacy_email" | "legacy_domain" | "not_on_legacy_list" | "no_email" | "override";
  split: PartySplit;
}

export interface StatementTotals {
  revenue: number;
  alberto: number;
  scaled: number;
  miramar: number;
  newCustomerRevenue: number;
  returningRevenue: number;
}

export interface StatementExpenseItem {
  expenseId: number;
  date: string;
  orderId: number | null;
  orderNumber: string | null;
  bookingId: number | null;
  trainingEventId: number | null;
  customerName: string | null;
  category: string;
  description: string | null;
  source: "admin" | "assistant";
  amount: number;
  isNewCustomer: boolean;
  linkedToOrder: boolean;
  split: PartySplit;
  reimbursement: number;
}

export interface MonthlyStatementData {
  expenseItems?: StatementExpenseItem[];
  expenseTotals?: { expenses: number; reimbursedToAlberto: number };
  expenseRule?: string;
  month: string;
  config: RevenueSplitConfig;
  newCustomerRule: string;
  lineItems: StatementLineItem[];
  totals: StatementTotals;
  parties: {
    alberto: { name: string; total: number };
    scaled: { name: string; total: number };
    miramar: { name: string; total: number };
  };
}

export function formatMoney(n: number): string {
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
