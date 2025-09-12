// server/index.ts
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import "dotenv/config";

const app = express();
const httpServer = createServer(app);

app.set("trust proxy", 1);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  cors({
    origin: process.env.NODE_ENV === "development" 
      ? [
          "http://localhost:5173", 
          "http://0.0.0.0:3030", 
          "http://localhost:3030",
          "http://127.0.0.1:3030",
          "null" // For direct file:// access
        ] 
      : true,
    credentials: false, // JWT in Authorization header, no cookies needed
    allowedHeaders: ["Content-Type", "Authorization"], // Allow Authorization header
  })
);
// OIDC Authorization Code + PKCE - No sessions needed (JWT only)

// 💥 API-Routen VOR Vite/Static mounten (NO AUTH ROUTES - Keycloak handles authentication)
await registerRoutes(app); // deine /api/stats, /api/connectors etc.

// 🔎 optional: Wenn eine /api/* Route nicht gefunden wurde → 404 JSON,
//   damit sie NICHT vom SPA-Catch-All (index.html) verschluckt wird.
app.use("/api", (_req, res) => {
  res.status(404).json({ message: "API route not found" });
});

// Fehlerhandler (4-args!)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ message: err.message || "Internal Server Error" });
});

// Jetzt erst Vite/Static (Catch-All)
if (app.get("env") === "development") {
  await setupVite(app, httpServer);
} else {
  serveStatic(app);
}

const port = parseInt(process.env.PORT || "3030", 10);
httpServer.listen(port, "0.0.0.0", () => log(`serving on http://0.0.0.0:${port}`));