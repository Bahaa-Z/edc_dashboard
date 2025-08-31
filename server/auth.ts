// server/auth.ts
import express, { type Request, type Response } from "express";
import { z } from "zod";
import { getPasswordToken, decodeToken, isTokenValid } from "./token";

const router = express.Router();

// Environment configuration with defaults
const keycloakConfig = {
  KC_URL: process.env.KC_URL || "https://centralidp.arena2036-x.de/auth",
  KC_REALM: process.env.KC_REALM || "CX-Central", 
  KC_CLIENT_ID: process.env.KC_CLIENT_ID || "CX-SDE",
  KC_CLIENT_SECRET: process.env.KC_CLIENT_SECRET,
};

// Info: Using default Keycloak configuration
if (!process.env.KC_CLIENT_ID) {
  console.log("[AUTH] Using default KC_CLIENT_ID: CX-SDE");
}

console.log("[AUTH] Using Public Client configuration (no client secret)");

// Body-Validierung
const loginBodySchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

type LoginBody = z.infer<typeof loginBodySchema>;

function parseUserFromToken(accessToken: string) {
  const decoded = decodeToken<Record<string, any>>(accessToken) || {};
  const username =
    decoded?.preferred_username ||
    decoded?.preferredUsername ||
    decoded?.sub ||
    "user";
  const email = decoded?.email as string | undefined;
  return { id: username, username, email };
}

// ACHTUNG: In index.ts mountest du mit app.use("/api", authRoutes)
// -> dieser Pfad hier ergibt zusammen /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  let body: LoginBody;
  try {
    body = loginBodySchema.parse(req.body);
  } catch (e) {
    return res.status(400).json({ message: "Invalid request data" });
  }

  const { username, password, rememberMe = false } = body;

  // Build token URL
  const tokenUrl = `${keycloakConfig.KC_URL}/realms/${keycloakConfig.KC_REALM}/protocol/openid-connect/token`;

  // Debug logging (ohne sensitive Daten)
  console.log("[LOGIN] Debug Info:");
  console.log("- Token URL:", tokenUrl);
  console.log("- Client ID:", keycloakConfig.KC_CLIENT_ID);
  console.log("- Username:", username);
  console.log("- Has Client Secret:", !!keycloakConfig.KC_CLIENT_SECRET);
  
  // Test different username formats
  const alternativeUsernames = [
    username, // Original: devaji.patil@arena2036.de
    username.split('@')[0], // Just: devaji.patil
    username.toLowerCase(), // Lowercase version
  ];
  
  console.log("- Alternative usernames to try:", alternativeUsernames);

  try {
    // Try different username formats
    let accessToken: string | null = null;
    let lastError: any = null;
    
    for (const testUsername of alternativeUsernames) {
      try {
        console.log(`[LOGIN] Trying username: ${testUsername}`);
        accessToken = await getPasswordToken({
          tokenUrl,
          clientId: keycloakConfig.KC_CLIENT_ID,
          clientSecret: undefined, // Public Client - kein Secret senden
          username: testUsername,
          password,
          scope: "openid",
        });
        console.log(`[LOGIN] SUCCESS with username: ${testUsername}`);
        break; // Success - exit loop
      } catch (error: any) {
        console.log(`[LOGIN] FAILED with username: ${testUsername} - ${error.message}`);
        lastError = error;
        continue; // Try next username format
      }
    }
    
    if (!accessToken) {
      throw lastError || new Error("All username formats failed");
    }
    console.log("[LOGIN] token acquired, length:", accessToken?.length);

    if (!isTokenValid(accessToken)) {
      return res.status(401).json({ message: "Invalid token received" });
    }

    const user = parseUserFromToken(accessToken);

    // Session-Cookie setzen (HttpOnly)
    res.cookie("edc_session", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : undefined, // 30 Tage oder Session
    });

    return res.json({ user });
  } catch (e: any) {
    console.error("[LOGIN] error:", e?.message, e?.stack);
    return res.status(401).json({ message: e?.message ?? "Login failed (Keycloak)" });
  }
});

// POST /api/auth/logout
router.post("/logout", (req: Request, res: Response) => {
  res.clearCookie("edc_session");
  return res.json({ message: "Logged out successfully" });
});

// GET /api/auth/me
router.get("/me", (req: Request, res: Response) => {
  const token = req.cookies?.edc_session as string | undefined;
  
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!isTokenValid(token)) {
    res.clearCookie("edc_session");
    return res.status(401).json({ message: "Token expired" });
  }

  const user = parseUserFromToken(token);
  return res.json({ user });
});

export default router;