import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertConnectorSchema, insertDataspaceSettingsSchema, loginSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // In a real app, you'd set up proper session management
      res.json({ user: { id: user.id, username: user.username } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Stats route
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Connector routes
  app.get("/api/connectors", async (req, res) => {
    try {
      const connectors = await storage.getConnectors();
      res.json(connectors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch connectors" });
    }
  });

  app.post("/api/connectors", async (req, res) => {
    try {
      const connectorData = insertConnectorSchema.parse(req.body);
      const connector = await storage.createConnector(connectorData);
      res.status(201).json(connector);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid connector data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create connector" });
    }
  });

  app.put("/api/connectors/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertConnectorSchema.partial().parse(req.body);
      
      const connector = await storage.updateConnector(id, updates);
      if (!connector) {
        return res.status(404).json({ message: "Connector not found" });
      }
      
      res.json(connector);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid connector data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update connector" });
    }
  });

  app.delete("/api/connectors/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteConnector(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Connector not found" });
      }
      
      res.json({ message: "Connector deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete connector" });
    }
  });

  // Dataspace settings routes
  app.get("/api/settings/dataspace", async (req, res) => {
    try {
      const settings = await storage.getDataspaceSettings();
      res.json(settings || { walletUrl: "", portalUrl: "", centralIdpUrl: "" });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dataspace settings" });
    }
  });

  app.post("/api/settings/dataspace", async (req, res) => {
    try {
      const settingsData = insertDataspaceSettingsSchema.parse(req.body);
      const settings = await storage.upsertDataspaceSettings(settingsData);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid settings data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save dataspace settings" });
    }
  });

  // SDE proxy route
  app.get("/api/sde/stats", async (req, res) => {
    try {
      // Mock SDE stats for now
      res.json({
        assets: 5,
        policies: 2,
        contracts: 3,
        catalogs: 1
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch SDE stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
