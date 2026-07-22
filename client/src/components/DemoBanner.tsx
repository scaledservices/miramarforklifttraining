import { useState } from "react";
import { X, AlertTriangle, Loader2, LogIn, LogOut } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

/**
 * Demo/testing banner with one-click account switching.
 *
 * Renders ONLY when import.meta.env.DEV is true, and the account list comes
 * from /api/dev/demo-accounts - an endpoint registered only when
 * NODE_ENV !== "production". So: no credentials in the client bundle, no
 * endpoint in production, and login still goes through the normal
 * /api/auth/login flow (real session, no auth bypass).
 */
interface DemoAccount {
  role: string;
  email: string;
  password: string;
}

export default function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [switchError, setSwitchError] = useState<string | null>(null);

  const { data: accountData } = useQuery<{ accounts: DemoAccount[] }>({
    queryKey: ["/api/dev/demo-accounts"],
    enabled: import.meta.env.DEV && !dismissed,
    staleTime: Infinity,
    retry: false,
  });
  const accounts = accountData?.accounts ?? [];

  const switchMutation = useMutation({
    mutationFn: async (acct: { email: string; password: string }) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(acct),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Login failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setSwitchError(null);
      // New identity: drop every cached query so no previous user's data
      // (enrollments, orders, admin lists) bleeds into the new session.
      queryClient.clear();
      queryClient.setQueryData(["/api/auth/me"], { user: data.user });
    },
    onError: (err: Error) => setSwitchError(err.message),
  });

  if (!import.meta.env.DEV) return null;
  if (dismissed) return null;

  return (
    <div data-testid="demo-banner" className="bg-amber-500 text-black relative z-50">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-medium truncate">
            Local dev - sandbox payments only.
            {user ? ` Logged in as ${user.name} (${user.role}).` : " Not logged in."}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm underline font-medium hover:text-amber-900 whitespace-nowrap"
            data-testid="demo-banner-toggle"
          >
            {expanded ? "Hide accounts" : "Switch account"}
          </button>
          {user && (
            <button
              onClick={() => logout()}
              className="text-sm underline font-medium hover:text-amber-900 whitespace-nowrap inline-flex items-center gap-1"
              data-testid="demo-banner-logout"
            >
              <LogOut className="h-3 w-3" /> Log out
            </button>
          )}
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
          {switchError && (
            <div className="text-xs font-bold text-red-800 mb-2" data-testid="demo-banner-error">
              Switch failed: {switchError}
            </div>
          )}
          <div className="bg-amber-400/50 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {accounts.map((acct) => {
              const isCurrent = user?.email === acct.email;
              const isPending = switchMutation.isPending && switchMutation.variables?.email === acct.email;
              return (
                <div
                  key={acct.email}
                  className={`text-xs rounded p-2 ${isCurrent ? "bg-amber-200 ring-1 ring-amber-700" : ""}`}
                  data-testid={`demo-account-${acct.role.toLowerCase().replace(/\s/g, "-")}`}
                >
                  <div className="font-bold flex items-center justify-between">
                    {acct.role}
                    {isCurrent && <span className="text-[10px] uppercase">current</span>}
                  </div>
                  <div className="font-mono break-all">{acct.email}</div>
                  <button
                    onClick={() => switchMutation.mutate(acct)}
                    disabled={isCurrent || switchMutation.isPending}
                    className="mt-1 inline-flex items-center gap-1 font-bold underline hover:text-amber-900 disabled:opacity-50 disabled:no-underline"
                    data-testid={`demo-login-${acct.role.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogIn className="h-3 w-3" />}
                    {isCurrent ? "Signed in" : "Log in"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
