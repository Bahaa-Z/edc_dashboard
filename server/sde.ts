// server/sde.ts
import { Router } from "express";
import fetch from "node-fetch";

const router = Router();

/**
 * Erwartet ENV: SDE_BASE_URL, optional SDE_API_KEY / SDE_API_KEY_HEADER
 * Beispiel: SDE_BASE_URL=http://localhost:8080
 */
const SDE_BASE_URL = process.env.SDE_BASE_URL || "http://localhost:8080";
const SDE_API_KEY = process.env.SDE_API_KEY;
const SDE_API_KEY_HEADER = process.env.SDE_API_KEY_HEADER || "X-Api-Key";

// Hilfsfunktion: Header aufbauen
function buildHeaders() {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (SDE_API_KEY) headers[SDE_API_KEY_HEADER] = SDE_API_KEY;
  return headers;
}

// KPI-Proxy
router.get("/sde/stats", async (_req, res) => {
    try {
      const url = `${SDE_BASE_URL}/api/stats`;
      const r = await fetch(url, { headers: buildHeaders() });
  
      if (!r.ok) {
        const text = await r.text();
        return res.status(r.status).json({ message: `SDE error: ${text}` });
      }
  
      // 👇 Typ casten
      const raw = (await r.json()) as any;
  
      const mapped = {
        connectors: raw.connectors ?? raw.numberOfConnectors ?? 0,
        assets: raw.assets ?? 0,
        policies: raw.policies ?? 0,
        contracts: raw.contracts ?? 0,
        contractAgreements: raw.contractAgreements ?? 0,
        dataOffers: raw.dataOffers ?? 0,
      };
  
      res.json(mapped);
    } catch (e: any) {
      console.error("[/api/sde/stats] failed:", e?.message || e);
      res.status(500).json({ message: "Failed to fetch SDE stats" });
    }
  });

export default router;