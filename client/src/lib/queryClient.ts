import { QueryClient, type QueryFunctionContext } from "@tanstack/react-query";

/** wirf mit Klartext, falls Response nicht ok ist */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text().catch(() => "")) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/** API-Request Helper (Session-based) */
export async function apiRequest(method: string, url: string, data?: unknown) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json",
  };

  const res = await fetch(url, {
    method,
    headers,
    credentials: "include", // Include session cookies
    body: data ? JSON.stringify(data) : undefined,
  });
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

/** Default QueryFn für React Query (Session-based) */
export function getQueryFn<T>({ on401 }: { on401: UnauthorizedBehavior }) {
  return async ({ queryKey }: QueryFunctionContext): Promise<T | null> => {
    const url = String(queryKey.join("/"));
    const headers: Record<string, string> = { Accept: "application/json" };

    const res = await fetch(url, {
      headers,
      credentials: "include", // Include session cookies
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