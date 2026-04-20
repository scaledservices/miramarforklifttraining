import { brand } from "@shared/config/brand";

export const SHIPPING_RATES = {
  standard: 4.99,
  expedited: 9.99,
} as const;

export const PASSWORD_RESET_TTL_MINUTES = 60;
export const INVITE_TTL_DAYS = 14;

export const ORDER_NUMBER_PREFIX = brand.prefixes.orderNumber;
export const INVOICE_NUMBER_PREFIX = brand.prefixes.invoiceNumber;

export const EXAM_SUBMIT_RATE_LIMIT = 10;
export const AUTH_LOGIN_RATE_LIMIT = 5;
export const AUTH_RESET_REQUEST_RATE_LIMIT = 3;
export const VERIFY_RATE_LIMIT = 10;

export const VERIFY_CACHE_TTL_SECONDS = 60;

export const ABANDONED_CHECKOUT_DELAY_MINUTES = 30;

export const WEBHOOK_BACKOFF_MINUTES = [2, 10, 30] as const;
export const WEBHOOK_MAX_RETRIES = 3;

export const JOB_SCHEDULER_INTERVAL_MS = 2 * 60 * 1000;
