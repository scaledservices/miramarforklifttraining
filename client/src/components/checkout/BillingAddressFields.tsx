import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { US_STATES, type BillingAddressInput } from "@shared/billing-address";

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
}: {
  value: BillingAddressInput;
  onChange: (next: BillingAddressInput) => void;
  disabled?: boolean;
  missing?: Array<keyof BillingAddressInput>;
  idPrefix?: string;
}) {
  const { t } = useTranslation();
  const set = (k: keyof BillingAddressInput, v: string) => onChange({ ...value, [k]: v });
  const bad = (k: keyof BillingAddressInput) => (missing.includes(k) ? "border-destructive" : "");
  return (
    <div className="space-y-3" data-testid="billing-address-fields">
      <div className="text-sm font-medium">{t("checkout.billingAddress", { defaultValue: "Billing address" })}</div>
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
    </div>
  );
}
