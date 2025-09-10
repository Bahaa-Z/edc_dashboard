import { QueryClient, type QueryFunctionContext } from "@tanstack/react-query";

/** wirf mit Klartext, falls Response nicht ok ist */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text().catch(() => "")) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/** API-Request Helper (Keycloak JWT Token based) */
export async function apiRequest(method: string, url: string, data?: unknown) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json",
  };

  // Get Keycloak token - import dynamically to avoid circular dependencies
  const { keycloak } = await import("@/auth/keycloak");
  if (keycloak.token) {
    headers["Authorization"] = `Bearer ${keycloak.token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

/** Default QueryFn für React Query (Keycloak JWT Token based) */
export function getQueryFn<T>({ on401 }: { on401: UnauthorizedBehavior }) {
  return async ({ queryKey }: QueryFunctionContext): Promise<T | null> => {
    const url = String(queryKey.join("/"));
    const headers: Record<string, string> = { Accept: "application/json" };

    // Get Keycloak token for queries - import dynamically to avoid circular dependencies
    const { keycloak } = await import("@/auth/keycloak");
    if (keycloak.token) {
      headers["Authorization"] = `Bearer ${keycloak.token}`;
    }

    const res = await fetch(url, {
      headers,
    });

    if (on401 === "returnNull" && res.status === 401) return null;

    await throwIfResNotOk(res);
    return (await res.json()) as T;
  };
}

/** 👉 benannter Export, damit `import { queryClient } ...` funktioniert */
export const queryClient = new QueryClient({
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