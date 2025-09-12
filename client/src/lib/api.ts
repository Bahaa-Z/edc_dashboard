// client/src/lib/api.ts
import { apiRequest } from "@/lib/queryClient";
import type {
  Connector,
  InsertConnector,
  DataspaceSettings,
  InsertDataspaceSettings,
  Stats,
} from "@shared/schema";

/** sicheres JSON-Parsing */
async function safeJson<T>(res: Response): Promise<T> {
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Expected JSON but got ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export const api = {
  // ---------- OIDC Authentication via Keycloak (No API endpoints needed) ----------
  // All authentication is handled via keycloak.ts
  // API calls automatically include Bearer tokens via queryClient.ts

  // ---------- Stats ----------
  getStats: async (): Promise<Stats> => {
    const res = await apiRequest("GET", "/api/stats");
    return safeJson<Stats>(res);
  },

  // ---------- SDE Stats (optional mit Fallback) ----------
  getSdeStats: async (): Promise<Stats> => {
    try {
      const res = await apiRequest("GET", "/api/sde/stats");
      return safeJson<Stats>(res);
    } catch {
      const res2 = await apiRequest("GET", "/api/stats");
      return safeJson<Stats>(res2);
    }
  },

  // ---------- Connectors ----------
  getConnectors: async (): Promise<Connector[]> => {
    const res = await apiRequest("GET", "/api/connectors");
    return safeJson<Connector[]>(res);
  },

  createConnector: async (connector: InsertConnector): Promise<Connector> => {
    const res = await apiRequest("POST", "/api/connectors", connector);
    return safeJson<Connector>(res);
  },

  updateConnector: async (id: string, updates: Partial<InsertConnector>): Promise<Connector> => {
    const res = await apiRequest("PUT", `/api/connectors/${encodeURIComponent(id)}`, updates);
    return safeJson<Connector>(res);
  },

  deleteConnector: async (id: string): Promise<void> => {
    const res = await apiRequest("DELETE", `/api/connectors/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`Delete failed ${res.status}`);
  },

  // ---------- Dataspace Settings ----------
  getDataspaceSettings: async (): Promise<DataspaceSettings> => {
    const res = await apiRequest("GET", "/api/settings/dataspace");
    return safeJson<DataspaceSettings>(res);
  },

  saveDataspaceSettings: async (settings: InsertDataspaceSettings): Promise<DataspaceSettings> => {
    const res = await apiRequest("POST", "/api/settings/dataspace", settings);
    return safeJson<DataspaceSettings>(res);
  },
};