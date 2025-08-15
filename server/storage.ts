import { type User, type InsertUser, type Connector, type InsertConnector, type DataspaceSettings, type InsertDataspaceSettings, type Stats } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getConnectors(): Promise<Connector[]>;
  getConnector(id: string): Promise<Connector | undefined>;
  createConnector(connector: InsertConnector): Promise<Connector>;
  updateConnector(id: string, connector: Partial<InsertConnector>): Promise<Connector | undefined>;
  deleteConnector(id: string): Promise<boolean>;
  
  getDataspaceSettings(): Promise<DataspaceSettings | undefined>;
  upsertDataspaceSettings(settings: InsertDataspaceSettings): Promise<DataspaceSettings>;
  
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
    
    // Create default admin user
    this.createUser({ username: "admin", password: "admin123" });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getConnectors(): Promise<Connector[]> {
    return Array.from(this.connectors.values());
  }

  async getConnector(id: string): Promise<Connector | undefined> {
    return this.connectors.get(id);
  }

  async createConnector(insertConnector: InsertConnector): Promise<Connector> {
    const id = randomUUID();
    const connector: Connector = { 
      ...insertConnector, 
      id,
      status: "Connected"
    };
    this.connectors.set(id, connector);
    return connector;
  }

  async updateConnector(id: string, updates: Partial<InsertConnector>): Promise<Connector | undefined> {
    const existing = this.connectors.get(id);
    if (!existing) return undefined;
    
    const updated: Connector = { ...existing, ...updates };
    this.connectors.set(id, updated);
    return updated;
  }

  async deleteConnector(id: string): Promise<boolean> {
    return this.connectors.delete(id);
  }

  async getDataspaceSettings(): Promise<DataspaceSettings | undefined> {
    return this.dataspaceSettings;
  }

  async upsertDataspaceSettings(settings: InsertDataspaceSettings): Promise<DataspaceSettings> {
    const id = this.dataspaceSettings?.id || randomUUID();
    this.dataspaceSettings = { ...settings, id };
    return this.dataspaceSettings;
  }

  async getStats(): Promise<Stats> {
    const connectorsCount = this.connectors.size;
    return {
      id: "stats",
      connectors: connectorsCount,
      assets: connectorsCount * 2,
      policies: connectorsCount * 1,
      contracts: connectorsCount * 2,
      contractAgreements: connectorsCount * 2,
      dataOffers: connectorsCount * 1,
    };
  }
}

export const storage = new MemStorage();
