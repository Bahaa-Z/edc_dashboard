import { apiRequest } from "@/lib/queryClient";
import type { Connector, InsertConnector, DataspaceSettings, InsertDataspaceSettings, Stats, LoginCredentials } from "@shared/schema";

export const api = {
  // Auth
  login: async (credentials: LoginCredentials) => {
    const response = await apiRequest("POST", "/api/login", credentials);
    return response.json();
  },

  // Stats
  getStats: async (): Promise<Stats> => {
    const response = await apiRequest("GET", "/api/stats");
    return response.json();
  },

  // Connectors
  getConnectors: async (): Promise<Connector[]> => {
    const response = await apiRequest("GET", "/api/connectors");
    return response.json();
  },

  createConnector: async (connector: InsertConnector): Promise<Connector> => {
    const response = await apiRequest("POST", "/api/connectors", connector);
    return response.json();
  },

  updateConnector: async (id: string, updates: Partial<InsertConnector>): Promise<Connector> => {
    const response = await apiRequest("PUT", `/api/connectors/${id}`, updates);
    return response.json();
  },

  deleteConnector: async (id: string): Promise<void> => {
    await apiRequest("DELETE", `/api/connectors/${id}`);
  },

  // Dataspace Settings
  getDataspaceSettings: async (): Promise<DataspaceSettings> => {
    const response = await apiRequest("GET", "/api/settings/dataspace");
    return response.json();
  },

  saveDataspaceSettings: async (settings: InsertDataspaceSettings): Promise<DataspaceSettings> => {
    const response = await apiRequest("POST", "/api/settings/dataspace", settings);
    return response.json();
  },

  // SDE
  getSdeStats: async () => {
    const response = await apiRequest("GET", "/api/sde/stats");
    return response.json();
  },
};
