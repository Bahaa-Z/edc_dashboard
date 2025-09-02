// server/index.ts
import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import cors from "cors";
import { createServer } from "http";
import authRoutes from "./auth";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import "dotenv/config";

const app = express();
const httpServer = createServer(app);

app.set("trust proxy", 1);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.NODE_ENV === "development" 
      ? [
          "http://localhost:5173", 
          "http://0.0.0.0:5000", 
          "http://localhost:5000",
          "http://127.0.0.1:5000",
          "null" // For direct file:// access
        ] 
      : true,
    credentials: true,
  })
);
app.use(
  session({
    name: process.env.SESSION_NAME || "edc_mc_sid",
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax", secure: false },
  })
);

// 💥 API-Routen VOR Vite/Static mounten
app.use("/api/auth", authRoutes);
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

const port = parseInt(process.env.PORT || "5000", 10);
httpServer.listen(port, "0.0.0.0", () => log(`serving on http://0.0.0.0:${port}`));