// client/src/lib/api.ts
import type {
    Connector,
    InsertConnector,
    DataspaceSettings,
    InsertDataspaceSettings,
    Stats,
    LoginCredentials,
  } from "@shared/schema";
  
  /** Helper: wir schicken Cookies immer mit */
  async function apiFetch(input: RequestInfo, init?: RequestInit) {
    const res = await fetch(input, {
      credentials: "include",
      ...init,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(init?.headers || {}),
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `HTTP ${res.status}`);
    }
    return res;
  }
  
  async function json<T>(res: Response): Promise<T> {
    return (await res.json()) as T;
  }
  
  export const api = {
    // ---- Auth (Username/Passwort → Password Grant im Backend) ----
    login: async (credentials: LoginCredentials) => {
      const res = await apiFetch("/api/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      return json<{ user: { id: string; username: string } }>(res);
    },
  
    // ---- Stats ----
    getStats: async (): Promise<Stats> => {
      const res = await apiFetch("/api/stats");
      return json<Stats>(res);
    },
  
    // Optional: SDE-Stats mit Fallback
    getSdeStats: async (): Promise<Stats> => {
      try {
        const res = await apiFetch("/api/sde/stats");
        return json<Stats>(res);
      } catch {
        const res2 = await apiFetch("/api/stats");
        return json<Stats>(res2);
      }
    },
  
    // ---- Connectors ----
    getConnectors: async (): Promise<Connector[]> => {
      const res = await apiFetch("/api/connectors");
      return json<Connector[]>(res);
    },
  
    createConnector: async (connector: InsertConnector): Promise<Connector> => {
      const res = await apiFetch("/api/connectors", {
        method: "POST",
        body: JSON.stringify(connector),
      });
      return json<Connector>(res);
    },
  
    updateConnector: async (id: string, updates: Partial<InsertConnector>): Promise<Connector> => {
      const res = await apiFetch(`/api/connectors/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      return json<Connector>(res);
    },
  
    deleteConnector: async (id: string): Promise<void> => {
      await apiFetch(`/api/connectors/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
  
    // ---- Dataspace Settings ----
    getDataspaceSettings: async (): Promise<DataspaceSettings> => {
      const res = await apiFetch("/api/settings/dataspace");
      return json<DataspaceSettings>(res);
    },
  
    saveDataspaceSettings: async (
      settings: InsertDataspaceSettings,
    ): Promise<DataspaceSettings> => {
      const res = await apiFetch("/api/settings/dataspace", {
        method: "POST",
        body: JSON.stringify(settings),
      });
      return json<DataspaceSettings>(res);
    },
  };