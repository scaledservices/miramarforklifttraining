import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { localePath } from "@/lib/locale";

interface AvailabilityCheckerProps {
  productSlug?: string;
  compact?: boolean;
  onAreaFound?: (area: any) => void;
}

export default function AvailabilityChecker({ productSlug, compact, onAreaFound }: AvailabilityCheckerProps) {
  const [zip, setZip] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ available: boolean; serviceArea: any } | null>(null);
  const [, navigate] = useLocation();
  const { t } = useTranslation();

  async function checkAvailability() {
    if (!/^\d{5}$/.test(zip)) return;
    setChecking(true);
    try {
      const res = await fetch(`/api/service-areas/check?zip=${zip}`);
      const data = await res.json();
      setResult(data);
      if (data.available && onAreaFound) {
        onAreaFound(data.serviceArea);
      }
    } catch {
      setResult({ available: false, serviceArea: null });
    } finally {
      setChecking(false);
    }
  }

  return (
    <div data-testid="availability-checker" className={compact ? "" : "bg-muted/50 rounded-xl p-6 border"}>
      {!compact && (
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">{t("availabilityChecker.title")}</h3>
        </div>
      )}
      <p className={`text-sm text-muted-foreground ${compact ? "mb-2" : "mb-4"}`}>
        {t("availabilityChecker.intro")}
      </p>
      <div className="flex gap-2">
        <Input
          data-testid="input-zip-check"
          placeholder={t("availabilityChecker.zipPlaceholder")}
          value={zip}
          onChange={(e) => {
            setZip(e.target.value.replace(/\D/g, "").slice(0, 5));
            if (result) setResult(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && checkAvailability()}
          className="max-w-[160px]"
        />
        <Button
          data-testid="button-check-availability"
          onClick={checkAvailability}
          disabled={zip.length !== 5 || checking}
          size={compact ? "sm" : "default"}
        >
          {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : t("availabilityChecker.check")}
        </Button>
      </div>

      {result && (
        <div className={`mt-4 p-4 rounded-lg ${result.available ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"}`}>
          {result.available ? (
            <div>
              <div className="flex items-center gap-2 text-green-700 font-semibold mb-1">
                <CheckCircle className="w-5 h-5" />
                {t("availabilityChecker.available")}
              </div>
              <p className="text-sm text-green-600 mb-3">
                {t("availabilityChecker.serviceArea")} <strong>{result.serviceArea.name}</strong>
              </p>
              <Button
                data-testid="button-request-onsite-training"
                onClick={() => navigate("/request-onsite-training")}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {t("availabilityChecker.requestOnsite")}
              </Button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 text-amber-700 font-semibold mb-1">
                <XCircle className="w-5 h-5" />
                {t("availabilityChecker.unavailable")}
              </div>
              <p className="text-sm text-amber-600">
                {t("availabilityChecker.unavailableBody")}{" "}
                <a href={localePath("/contact")} className="underline hover:text-amber-800">{t("availabilityChecker.contactUs")}</a>{t("availabilityChecker.unavailableTail")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
