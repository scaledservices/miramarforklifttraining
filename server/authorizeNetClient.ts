/**
 * Authorize.net client module.
 *
 * Handles credential loading, transaction creation, and refunds via the
 * Authorize.net REST API. Uses Accept.js (Accept UI iframe) on the client side
 * to generate payment nonces — card data never touches our server.
 *
 * PCI scope: SAQ-A (Accept UI iframe variant). Card data is entered directly
 * into an Authorize.net-hosted iframe; our server only receives the opaque
 * payment nonce.
 *
 * Environment variables:
 * - AUTHORIZE_API_LOGIN_ID  — Merchant API Login ID (server-side secret)
 * - AUTHORIZE_TRANSACTION_KEY — Merchant Transaction Key (server-side secret)
 * - AUTHORIZE_CLIENT_KEY — Public client key (safe for browser, used by Accept.js)
 * - AUTHORIZE_ENVIRONMENT — "sandbox" or "production"
 */

const API_LOGIN_ID = process.env.AUTHORIZE_API_LOGIN_ID;
const TRANSACTION_KEY = process.env.AUTHORIZE_TRANSACTION_KEY;
const CLIENT_KEY = process.env.AUTHORIZE_CLIENT_KEY;
const ENVIRONMENT = process.env.AUTHORIZE_ENVIRONMENT || "sandbox";

const SANDBOX_URL = "https://apitest.authorize.net/xml/v1/request.api";
const PRODUCTION_URL = "https://api.authorize.net/xml/v1/request.api";

function getApiUrl(): string {
  return ENVIRONMENT === "production" ? PRODUCTION_URL : SANDBOX_URL;
}

export function isAuthorizeNetConfigured(): boolean {
  return !!(API_LOGIN_ID && TRANSACTION_KEY && CLIENT_KEY);
}

export function getAuthorizeNetClientKey(): string | undefined {
  return CLIENT_KEY;
}

export function getAuthorizeNetApiLoginID(): string | undefined {
  return API_LOGIN_ID;
}

export function getAuthorizeNetEnvironment(): string {
  return ENVIRONMENT;
}

interface TransactionResult {
  success: boolean;
  transactionId?: string;
  errorMessage?: string;
  rawResponse?: unknown;
}

/**
 * Create a transaction from an Accept.js payment nonce.
 * The nonce is generated client-side by Accept UI — it contains the encrypted
 * card data and is single-use. Our server never sees raw card numbers.
 */
export interface BillingAddress {
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

// ─── Receipt details (Alberto 2026-10-30) ─────────────────────────────
// The merchant receipt Simon gets from Authorize.net only shows what we send
// with the charge. Without these fields it showed an approved amount and
// nothing else (no name, phone, course, date). Everything here is optional
// and descriptive; none of it changes what is charged.

export interface ReceiptLineItem {
  itemId: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
}

export interface ReceiptDetails {
  customer?: { name?: string | null; email?: string | null; phone?: string | null; company?: string | null };
  /** One line: what was bought, where, when, how many. */
  description?: string;
  lineItems?: ReceiptLineItem[];
}

/** Authorize.net rejects some markup characters and enforces field lengths. */
function clean(v: unknown, max: number): string {
  return String(v ?? "").replace(/[<>&"]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = clean(name, 101).split(" ").filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts[parts.length - 1] };
}

/**
 * Build the createTransactionRequest.transactionRequest body. Pure, so the
 * field order and contents can be unit tested. Authorize.net's JSON API is
 * schema-ordered: order, lineItems, customer, billTo, userFields must appear
 * in that sequence.
 *
 * Billing-zip safety: the card's zip travels inside the Accept.js nonce, and
 * ANY billTo replaces it. So billTo is only sent when it carries the zip (the
 * card form passes the typed zip as billingZip) or a street address.
 *
 * The customer's email goes in a merchant-defined field, NOT customer.email,
 * so Authorize.net never starts emailing its own receipts to customers.
 */
export function buildTransactionRequest(
  paymentNonce: string,
  amount: number,
  orderId: number,
  orderNumber: string,
  billTo?: BillingAddress,
  details?: ReceiptDetails
): Record<string, unknown> {
  const tx: Record<string, unknown> = {
    transactionType: "authCaptureTransaction",
    amount: amount.toFixed(2),
    payment: {
      opaqueData: {
        // Accept.js dispatchData nonces always carry this descriptor.
        dataDescriptor: "COMMON.ACCEPT.INAPP.PAYMENT",
        dataValue: paymentNonce,
      },
    },
  };

  const order: Record<string, string> = { invoiceNumber: orderNumber.slice(0, 20) };
  const description = clean(details?.description, 255);
  if (description) order.description = description;
  tx.order = order;

  const items = (details?.lineItems || []).filter((li) => li.quantity > 0 && li.unitPrice >= 0).slice(0, 30);
  if (items.length) {
    tx.lineItems = {
      lineItem: items.map((li) => {
        const out: Record<string, string> = {
          itemId: clean(li.itemId, 31) || "item",
          name: clean(li.name, 31) || "Item",
        };
        const d = clean(li.description ?? li.name, 255);
        if (d) out.description = d;
        out.quantity = String(Number(li.quantity.toFixed(4)));
        out.unitPrice = li.unitPrice.toFixed(2);
        return out;
      }),
    };
  }

  tx.customer = { type: "individual", id: String(orderId) };

  // billTo: explicit address (card orders) wins; otherwise the buyer's name,
  // company and phone. Empty values are omitted (see zip note above).
  const c = details?.customer;
  const fromName = billTo?.firstName || billTo?.lastName
    ? { firstName: billTo?.firstName || "", lastName: billTo?.lastName || "" }
    : splitName(c?.name || "");
  const bill: Array<[string, string]> = [
    ["firstName", clean(fromName.firstName, 50)],
    ["lastName", clean(fromName.lastName, 50)],
    ["company", clean(c?.company, 50)],
    ["address", clean(billTo?.address, 60)],
    ["city", clean(billTo?.city, 40)],
    ["state", clean(billTo?.state, 40)],
    ["zip", clean(billTo?.zip, 20)],
    ["country", billTo?.address || billTo?.zip ? clean(billTo?.country || "US", 60) : ""],
    ["phoneNumber", clean(c?.phone, 25)],
  ];
  const billObj = Object.fromEntries(bill.filter(([, v]) => v));
  // Sending billTo replaces the zip carried in the Accept.js nonce (verified
  // in sandbox 2026-11-02). Only send it when it carries a zip or street
  // address; otherwise the name/company ride in merchant-defined fields.
  const billHasAvs = !!(billObj.zip || billObj.address);
  if (billHasAvs) tx.billTo = billObj;

  const fields: Array<{ name: string; value: string }> = [];
  if (!billHasAvs) {
    const fullName = clean(`${fromName.firstName} ${fromName.lastName}`, 255);
    if (fullName) fields.push({ name: "customer_name", value: fullName });
    if (c?.company) fields.push({ name: "customer_company", value: clean(c.company, 255) });
  }
  if (c?.email) fields.push({ name: "customer_email", value: clean(c.email, 255) });
  if (c?.phone) fields.push({ name: "customer_phone", value: clean(c.phone, 255) });
  if (fields.length) tx.userFields = { userField: fields };

  return tx;
}

export async function createTransactionFromNonce(
  paymentNonce: string,
  amount: number,
  orderId: number,
  orderNumber: string,
  isCardPayment: boolean = true,
  billTo?: BillingAddress,
  details?: ReceiptDetails
): Promise<TransactionResult> {
  if (!isAuthorizeNetConfigured()) {
    return {
      success: false,
      errorMessage: "Authorize.net is not configured. Set AUTHORIZE_API_LOGIN_ID, AUTHORIZE_TRANSACTION_KEY, and AUTHORIZE_CLIENT_KEY.",
    };
  }

  const merchantAuthentication = {
    name: API_LOGIN_ID,
    transactionKey: TRANSACTION_KEY,
  };

  const transactionRequest = buildTransactionRequest(paymentNonce, amount, orderId, orderNumber, billTo, details);

  const requestBody = {
    createTransactionRequest: {
      merchantAuthentication,
    },
  };

  // Add transactionRequest at the top level of createTransactionRequest
  (requestBody.createTransactionRequest as Record<string, unknown>).transactionRequest = transactionRequest;

  try {
    const response = await fetch(getApiUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    // Authorize.net returns transactionResponse with responseCode
    // "1" = approved, "2" = declined, "3" = error
    const txResponse = data?.transactionResponse;
    const responseCode = txResponse?.responseCode;
    const transId = txResponse?.transId;

    if (responseCode === "1" || responseCode === "4") {
      // responseCode 4 = held for review (fraud suspect) — treat as success for now
      return {
        success: true,
        transactionId: transId,
        rawResponse: data,
      };
    }

    // Handle decline or error
    const message = txResponse?.errors?.[0]?.errorText
      || data?.messages?.message?.[0]?.text
      || "The card was declined.";

    return {
      success: false,
      errorMessage: message,
      rawResponse: data,
    };
  } catch (error: any) {
    return {
      success: false,
      errorMessage: error.message || "Network error communicating with Authorize.net",
    };
  }
}

/** Authorize.net error text lives at messages.message[0].text (not messages[0]). */
export function anetErrorText(data: any): string | undefined {
  return data?.transactionResponse?.errors?.[0]?.errorText
    || data?.messages?.message?.[0]?.text;
}

async function anetPost(body: unknown): Promise<any> {
  const response = await fetch(getApiUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  // Authorize.net prefixes JSON responses with a UTF-8 BOM.
  return JSON.parse((await response.text()).replace(/^\uFEFF/, ""));
}

/** Not-yet-settled statuses: the charge must be VOIDED, not refunded. */
export const VOIDABLE_STATUSES = ["capturedPendingSettlement", "authorizedPendingCapture", "FDSPendingReview", "FDSAuthorizedPendingReview"];

/**
 * Decide how to reverse a charge from its Authorize.net status.
 * Same-day charges (pending settlement) are voided in full; settled charges
 * are refunded (needs the card's last 4 from the transaction details).
 */
export function reversalMethodFor(status: string | undefined): "void" | "refund" | "none" {
  if (!status) return "none";
  if (VOIDABLE_STATUSES.includes(status)) return "void";
  if (status === "settledSuccessfully") return "refund";
  return "none";
}

/**
 * Refund (or void) a transaction. Meeting 2026-10-14 fix: the old request
 * sent an invalid payment field (Authorize.net rejected it), never voided
 * same-day charges, and read the error from the wrong path ("response code
 * undefined").
 */
export async function refundTransaction(
  originalTransactionId: string,
  amount: number,
  orderId: number
): Promise<TransactionResult & { method?: "void" | "refund" }> {
  if (!isAuthorizeNetConfigured()) {
    return { success: false, errorMessage: "Authorize.net is not configured." };
  }
  const merchantAuthentication = { name: API_LOGIN_ID, transactionKey: TRANSACTION_KEY };

  try {
    const details = await anetPost({ getTransactionDetailsRequest: { merchantAuthentication, transId: originalTransactionId } });
    const tx = details?.transaction;
    if (!tx) {
      return { success: false, errorMessage: anetErrorText(details) || "Could not find the original card transaction.", rawResponse: details };
    }
    const status: string = tx.transactionStatus;
    const method = reversalMethodFor(status);
    if (method === "none") {
      const already = /void|refund/i.test(status);
      return {
        success: false,
        errorMessage: already
          ? "This charge was already voided or refunded in Authorize.net."
          : `This charge can't be refunded right now (Authorize.net status: ${status}).`,
        rawResponse: details,
      };
    }

    const transactionRequest: Record<string, unknown> = method === "void"
      ? { transactionType: "voidTransaction", refTransId: originalTransactionId }
      : {
          transactionType: "refundTransaction",
          amount: amount.toFixed(2),
          payment: {
            creditCard: {
              // Refunds need the last 4 digits (as returned, e.g. "XXXX0027") and a masked expiry.
              cardNumber: String(tx.payment?.creditCard?.cardNumber || "").slice(-4),
              expirationDate: "XXXX",
            },
          },
          refTransId: originalTransactionId,
          order: { invoiceNumber: String(orderId).slice(0, 20) },
        };

    const data = await anetPost({ createTransactionRequest: { merchantAuthentication, transactionRequest } });
    if (data?.transactionResponse?.responseCode === "1") {
      return { success: true, transactionId: data.transactionResponse.transId || originalTransactionId, rawResponse: data, method };
    }
    return {
      success: false,
      errorMessage: anetErrorText(data) || `${method === "void" ? "Void" : "Refund"} was not approved by Authorize.net.`,
      rawResponse: data,
      method,
    };
  } catch (error: any) {
    return { success: false, errorMessage: error.message || "Network error during refund" };
  }
}

// The rate constant lives in shared/config/bookingPricing.ts so the client
// display math and this server charge math can never disagree. Re-exported
// here for the existing import sites.
export { CARD_SURCHARGE_RATE } from "@shared/config/bookingPricing";
import { CARD_SURCHARGE_RATE } from "@shared/config/bookingPricing";

/**
 * Calculate the card surcharge. Returns the surcharge amount.
 */
export function calculateCardSurcharge(orderTotal: number): number {
  return Number((orderTotal * CARD_SURCHARGE_RATE).toFixed(2));
}
