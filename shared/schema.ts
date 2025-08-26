import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const connectors = pgTable("connectors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  version: text("version").notNull(),
  bpn: text("bpn").notNull(),
  endpoint: text("endpoint").notNull(),
  status: text("status").notNull().default("Connected"),
});

export const dataspaceSettings = pgTable("dataspace_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletUrl: text("wallet_url"),
  portalUrl: text("portal_url"),
  centralIdpUrl: text("central_idp_url"),
});

export const stats = pgTable("stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  connectors: integer("connectors").notNull().default(0),
  assets: integer("assets").notNull().default(0),
  policies: integer("policies").notNull().default(0),
  contracts: integer("contracts").notNull().default(0),
  contractAgreements: integer("contract_agreements").notNull().default(0),
  dataOffers: integer("data_offers").notNull().default(0),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertConnectorSchema = createInsertSchema(connectors).omit({
  id: true,
  status: true,
});

export const insertDataspaceSettingsSchema = createInsertSchema(dataspaceSettings).omit({
  id: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertConnector = z.infer<typeof insertConnectorSchema>;
export type Connector = typeof connectors.$inferSelect;
export type InsertDataspaceSettings = z.infer<typeof insertDataspaceSettingsSchema>;
export type DataspaceSettings = typeof dataspaceSettings.$inferSelect;
export type Stats = typeof stats.$inferSelect;
export type LoginCredentials = z.infer<typeof loginSchema>;
