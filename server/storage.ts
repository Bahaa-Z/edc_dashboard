// server/storage.ts
import {
  type User,
  type InsertUser,
  type Connector,
  type InsertConnector,
  type DataspaceSettings,
  type InsertDataspaceSettings,
  type Stats,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Connectors
  getConnectors(): Promise<Connector[]>;
  getConnector(id: string): Promise<Connector | undefined>;
  createConnector(connector: InsertConnector): Promise<Connector>;
  updateConnector(id: string, connector: Partial<InsertConnector>): Promise<Connector | undefined>;
  deleteConnector(id: string): Promise<boolean>;
  setConnectorStatus(id: string, status: Connector["status"]): Promise<Connector | undefined>;

  // Dataspace Settings
  getDataspaceSettings(): Promise<DataspaceSettings | undefined>;
  upsertDataspaceSettings(settings: InsertDataspaceSettings): Promise<DataspaceSettings>;

  // Stats
  getStats(): Promise<Stats>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private connectors: Map<string, Connector>;
  private dataspaceSettings: DataspaceSettings | undefined;

  constructor() {
    this.users = new Map();
    this.connectors = new Map();
    this.dataspaceSettings = undefined;

    // Default-Admin
    //void this.createUser({ username: "admin", password: "admin123" });

    // DEMO-Connectors (nur Felder aus dem Schema!)
    void this.createConnector({
      name: "Provider EDC",
      version: "0.6.0",
      bpn: "BPNL00000003AYRE",
      endpoint: "http://localhost:8080/management",
    });
    void this.createConnector({
      name: "Consumer EDC",
      version: "0.6.0",
      bpn: "BPNL00000003BXYZ",
      endpoint: "http://localhost:8082/management",
    });
    void this.createConnector({
      name: "DTR Service",
      version: "0.6.0",
      bpn: "BPNL00000003DTR1",
      endpoint: "http://localhost:8089",
    });
  }

  // ---------- Users ----------
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((u) => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // --------- Connectors ---------
  async getConnectors(): Promise<Connector[]> {
    return Array.from(this.connectors.values());
  }

  async getConnector(id: string): Promise<Connector | undefined> {
    return this.connectors.get(id);
  }

  async createConnector(insertConnector: InsertConnector): Promise<Connector> {
    const id = randomUUID();
    const connector: Connector = {
      id,
      name: insertConnector.name,
      version: insertConnector.version,
      bpn: insertConnector.bpn,
      endpoint: insertConnector.endpoint,
      status: "Connected",
    };
    this.connectors.set(id, connector);
    return connector;
  }

  async updateConnector(id: string, updates: Partial<InsertConnector>): Promise<Connector | undefined> {
    const existing = this.connectors.get(id);
    if (!existing) return undefined;

    const updated: Connector = {
      ...existing,
      name: updates.name ?? existing.name,
      version: updates.version ?? existing.version,
      bpn: updates.bpn ?? existing.bpn,
      endpoint: updates.endpoint ?? existing.endpoint,
      // status bleibt unverändert hier
    };
    this.connectors.set(id, updated);
    return updated;
  }

  async deleteConnector(id: string): Promise<boolean> {
    return this.connectors.delete(id);
  }

  async setConnectorStatus(id: string, status: Connector["status"]): Promise<Connector | undefined> {
    const existing = this.connectors.get(id);
    if (!existing) return undefined;
    const updated: Connector = { ...existing, status };
    this.connectors.set(id, updated);
    return updated;
  }

  // ----- Dataspace Settings -----
  private normalizeDataspaceSettings(
    settings: InsertDataspaceSettings,
    id: string
  ): DataspaceSettings {
    return {
      id,
      walletUrl: settings.walletUrl ?? null,
      portalUrl: settings.portalUrl ?? null,
      centralIdpUrl: settings.centralIdpUrl ?? null,
    };
  }

  async getDataspaceSettings(): Promise<DataspaceSettings | undefined> {
    if (!this.dataspaceSettings) {
      this.dataspaceSettings = {
        id: randomUUID(),
        walletUrl: null,
        portalUrl: null,
        centralIdpUrl: null,
      };
    }
    return this.dataspaceSettings;
  }

  async upsertDataspaceSettings(settings: InsertDataspaceSettings): Promise<DataspaceSettings> {
    const id = this.dataspaceSettings?.id || randomUUID();
    this.dataspaceSettings = this.normalizeDataspaceSettings(settings, id);
    return this.dataspaceSettings;
  }

  // ------------- Stats -------------
  async getStats(): Promise<Stats> {
    const list = Array.from(this.connectors.values());
    const connectorsCount = list.length;

    return {
      id: "stats",
      connectors: connectorsCount,
      assets: connectorsCount * 3 + 2,
      policies: connectorsCount * 2,
      contracts: Math.max(1, Math.floor(connectorsCount * 1.5)),
      contractAgreements: Math.max(1, Math.floor(connectorsCount * 2)),
      dataOffers: Math.max(1, Math.floor(connectorsCount * 2.5)),
    };
  }
}

export const storage = new MemStorage();