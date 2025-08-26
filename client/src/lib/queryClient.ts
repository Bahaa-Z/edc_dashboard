import { QueryClient, type QueryFunctionContext } from "@tanstack/react-query";

/** wirf mit Klartext, falls Response nicht ok ist */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text().catch(() => "")) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/** API-Request Helper (inkl. Cookies für Session) */
export async function apiRequest(method: string, url: string, data?: unknown) {
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

/** Default QueryFn für React Query (holt JSON) */
export function getQueryFn<T>({ on401 }: { on401: UnauthorizedBehavior }) {
  return async ({ queryKey }: QueryFunctionContext): Promise<T | null> => {
    const url = String(queryKey.join("/"));
    const res = await fetch(url, {
      credentials: "include",
      headers: { Accept: "application/json" },
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