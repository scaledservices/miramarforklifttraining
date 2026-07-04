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
export async function createTransactionFromNonce(
  paymentNonce: string,
  amount: number,
  orderId: number,
  orderNumber: string,
  isCardPayment: boolean = true
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

  // transactionType: authCapture charges immediately
  const transactionRequest: Record<string, unknown> = {
    transactionType: "authCaptureTransaction",
    amount: amount.toFixed(2),
    payment: {
      opaqueData: {
        dataDescriptor: isCardPayment ? "COMMON.APP.INLINE.PAYMENT" : "COMMON.APP.INLINE.PAYMENT",
        dataValue: paymentNonce,
      },
    },
    order: {
      orderId: orderNumber,
    },
    customer: {
      type: "individual",
      id: String(orderId),
    },
  };

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

    if (responseCode === "1" || responseCode === 4) {
      // responseCode 4 = held for review (fraud suspect) — treat as success for now
      return {
        success: true,
        transactionId: transId,
        rawResponse: data,
      };
    }

    // Handle decline or error
    const message = txResponse?.errors?.[0]?.errorText
      || data?.messages?.[0]?.description
      || `Transaction failed with response code ${responseCode}`;

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

/**
 * Refund a transaction. Must reference the original transaction ID.
 * If the transaction hasn't settled yet, this acts as a void; if settled,
 * it issues a refund.
 */
export async function refundTransaction(
  originalTransactionId: string,
  amount: number,
  orderId: number
): Promise<TransactionResult> {
  if (!isAuthorizeNetConfigured()) {
    return {
      success: false,
      errorMessage: "Authorize.net is not configured.",
    };
  }

  const merchantAuthentication = {
    name: API_LOGIN_ID,
    transactionKey: TRANSACTION_KEY,
  };

  const requestBody = {
    createTransactionRequest: {
      merchantAuthentication,
      transactionRequest: {
        transactionType: "refundTransaction",
        amount: amount.toFixed(2),
        payment: {
          creditCardCardNumber: "XXXXXXXXXXXX", // masked — Authorize.net only needs last 4 for refunds via API
        },
        refTransId: originalTransactionId,
        order: {
          orderId: String(orderId),
        },
      },
    },
  };

  try {
    const response = await fetch(getApiUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    const txResponse = data?.transactionResponse;
    const responseCode = txResponse?.responseCode;

    if (responseCode === "1") {
      return {
        success: true,
        transactionId: txResponse?.transId,
        rawResponse: data,
      };
    }

    const message = txResponse?.errors?.[0]?.errorText
      || data?.messages?.[0]?.description
      || `Refund failed with response code ${responseCode}`;

    return {
      success: false,
      errorMessage: message,
      rawResponse: data,
    };
  } catch (error: any) {
    return {
      success: false,
      errorMessage: error.message || "Network error during refund",
    };
  }
}

/**
 * Calculate the 3% card surcharge.
 * Miramar charges 3% for card payments (no fee for check/ACH).
 * Returns the surcharge amount.
 */
export function calculateCardSurcharge(orderTotal: number): number {
  const rate = 0.03;
  return Number((orderTotal * rate).toFixed(2));
}
