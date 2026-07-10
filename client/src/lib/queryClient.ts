import { QueryClient, QueryFunction, QueryCache, MutationCache } from "@tanstack/react-query";

export function isAuthError(error: unknown): boolean {
  return error instanceof Error && /^401[:\s]/.test(error.message);
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Session expiry: /api/auth/me is cached and never 401s itself, so without
// this the client keeps believing it's authenticated after the cookie dies
// and surfaces raw "401: ..." strings mid-flow. Any 401 from any query or
// mutation clears the cached auth state, which flips isAuthenticated and lets
// ProtectedRoute / inline-auth components re-prompt for sign-in.
function handleAuthError(error: unknown) {
  if (isAuthError(error)) {
    queryClient.setQueryData(["/api/auth/me"], { user: null });
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleAuthError,
  }),
  mutationCache: new MutationCache({
    onError: handleAuthError,
  }),
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
