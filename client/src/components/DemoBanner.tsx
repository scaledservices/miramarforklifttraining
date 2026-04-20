import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

const DEMO_ACCOUNTS = [
  { role: "Admin", email: "admin@forkliftcertified.training", password: "DemoPass!234" },
  { role: "Crew Admin", email: "group@forkliftcertified.training", password: "DemoPass!234" },
  { role: "Individual", email: "user@forkliftcertified.training", password: "DemoPass!234" },
  { role: "Member", email: "member1@forkliftcertified.training", password: "DemoPass!234" },
  { role: "Certified", email: "certified@forkliftcertified.training", password: "DemoPass!234" },
];

export default function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (import.meta.env.VITE_DEMO_MODE !== "true") return null;
  if (dismissed) return null;

  return (
    <div
      data-testid="demo-banner"
      className="bg-amber-500 text-black relative z-50"
    >
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-medium truncate">
            Demo Mode — No real payments processed.
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm underline font-medium hover:text-amber-900 whitespace-nowrap"
            data-testid="demo-banner-toggle"
          >
            {expanded ? "Hide credentials" : "Show credentials"}
          </button>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="ml-2 p-1 hover:bg-amber-600 rounded"
          data-testid="demo-banner-dismiss"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {expanded && (
        <div className="max-w-7xl mx-auto px-4 pb-3">
          <div className="bg-amber-400/50 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {DEMO_ACCOUNTS.map((acct) => (
              <div key={acct.email} className="text-xs" data-testid={`demo-account-${acct.role.toLowerCase().replace(/\s/g, "-")}`}>
                <div className="font-bold">{acct.role}</div>
                <div className="font-mono break-all">{acct.email}</div>
                <div className="font-mono">{acct.password}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
