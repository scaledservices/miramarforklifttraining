import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { US_STATES, billingAddressProblems, type BillingAddressInput } from "@shared/billing-address";

/**
 * Billing address on every card payment (2026-11-03). The ZIP is part of the
 * address and is also what Authorize.net checks against the card.
 */
export default function BillingAddressFields({
  value,
  onChange,
  disabled,
  missing = [],
  idPrefix = "bill",
  mailingAddress,
}: {
  value: BillingAddressInput;
  onChange: (next: BillingAddressInput) => void;
  disabled?: boolean;
  missing?: Array<keyof BillingAddressInput>;
  idPrefix?: string;
  /**
   * When the order also mails a photo ID card, offer "Billing address same as
   * mailing address" (checked by default, like OrderCertCard). While checked
   * the billing fields are hidden and mirror the mailing address.
   */
  mailingAddress?: { address: string; city: string; state: string; zip: string } | null;
}) {
  const { t } = useTranslation();
  const [same, setSame] = useState(true);
  const offerSame = !!mailingAddress;
  const useMailing = offerSame && same;
  const m = mailingAddress;
  useEffect(() => {
    if (!useMailing || !m) return;
    const next = { address: m.address.trim(), city: m.city.trim(), state: m.state.trim().toUpperCase(), zip: m.zip.trim() };
    if (next.address !== value.address || next.city !== value.city || next.state !== value.state || next.zip !== value.zip) onChange(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useMailing, m?.address, m?.city, m?.state, m?.zip]);
  const set = (k: keyof BillingAddressInput, v: string) => onChange({ ...value, [k]: v });
  const bad = (k: keyof BillingAddressInput) => (missing.includes(k) ? "border-destructive" : "");
  return (
    <div className="space-y-3" data-testid="billing-address-fields">
      <div className="text-sm font-medium">{t("checkout.billingAddress", { defaultValue: "Billing address" })}</div>
      {offerSame && (
        <div className="flex items-center gap-2">
          <Checkbox id={`${idPrefix}-same`} checked={same} disabled={disabled}
            onCheckedChange={(c) => {
              const on = c === true;
              setSame(on);
              // Unchecking starts the billing fields empty rather than showing a hidden copy.
              if (!on) onChange({ address: "", city: "", state: "", zip: "" });
            }}
            data-testid="checkbox-billing-same-as-mailing" />
          <label htmlFor={`${idPrefix}-same`} className="text-sm cursor-pointer">
            {t("checkout.billingSameAsMailing", { defaultValue: "Billing address same as mailing address" })}
          </label>
        </div>
      )}
      {useMailing ? (
        <p className="text-sm text-muted-foreground" data-testid="text-billing-from-mailing">
          {!value.address
            ? t("checkout.billingFromMailingEmpty", { defaultValue: "Uses the mailing address above." })
            : billingAddressProblems(value).length
              ? <span className="text-destructive">{t("checkout.billingFromMailingInvalid", { defaultValue: "Please check the mailing address above (2-letter state like CA, 5-digit ZIP), or uncheck this box and enter a billing address." })}</span>
              : `${value.address}, ${value.city}, ${value.state} ${value.zip}`}
        </p>
      ) : (<>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-address`}>{t("checkout.billingStreet", { defaultValue: "Street address" })}</Label>
        <Input id={`${idPrefix}-address`} autoComplete="billing street-address" maxLength={60} disabled={disabled}
          className={bad("address")} value={value.address} onChange={(e) => set("address", e.target.value)} data-testid="input-billing-address" />
      </div>
      <div className="grid grid-cols-6 gap-3">
        <div className="col-span-3 space-y-1.5">
          <Label htmlFor={`${idPrefix}-city`}>{t("checkout.billingCity", { defaultValue: "City" })}</Label>
          <Input id={`${idPrefix}-city`} autoComplete="billing address-level2" maxLength={40} disabled={disabled}
            className={bad("city")} value={value.city} onChange={(e) => set("city", e.target.value)} data-testid="input-billing-city" />
        </div>
        <div className="col-span-1 space-y-1.5">
          <Label htmlFor={`${idPrefix}-state`}>{t("checkout.billingState", { defaultValue: "State" })}</Label>
          <select id={`${idPrefix}-state`} autoComplete="billing address-level1" disabled={disabled}
            className={`flex h-10 w-full rounded-md border border-input bg-background px-2 text-sm ${bad("state")}`}
            value={value.state} onChange={(e) => set("state", e.target.value)} data-testid="select-billing-state">
            <option value="">--</option>
            {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor={`${idPrefix}-zip`}>{t("checkout.cardZip", { defaultValue: "ZIP" })}</Label>
          <Input id={`${idPrefix}-zip`} inputMode="numeric" autoComplete="billing postal-code" placeholder="92121" maxLength={5} disabled={disabled}
            className={bad("zip")} value={value.zip} onChange={(e) => set("zip", e.target.value.replace(/\D/g, "").slice(0, 5))} data-testid="input-billing-zip" />
        </div>
      </div>
      </>)}
    </div>
  );
}
