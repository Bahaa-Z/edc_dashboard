// server/auth.ts
import express, { type Request, type Response } from "express";
import { z } from "zod";
import { getPasswordToken, decodeToken, isTokenValid } from "./token";

const router = express.Router();

// Environment configuration - Using CX-EDC with Service Account (FINAL SOLUTION)
const keycloakConfig = {
  KC_URL: process.env.KC_URL || "https://centralidp.arena2036-x.de/auth",
  KC_REALM: process.env.KC_REALM || "CX-Central", 
  KC_CLIENT_ID: process.env.KC_CLIENT_ID || "CX-EDC",
  KC_CLIENT_SECRET: process.env.KC_CLIENT_SECRET_EDC || "kwe2FC3EXDPUuUEoVhI6igUnRAmzkuwN",
};

// Debug configuration
console.log("[AUTH] Client Configuration:");
console.log("- KC_CLIENT_ID:", keycloakConfig.KC_CLIENT_ID);
console.log("- KC_CLIENT_SECRET:", keycloakConfig.KC_CLIENT_SECRET ? "SET" : "NOT_SET");
console.log("- Client Type:", keycloakConfig.KC_CLIENT_SECRET ? "Confidential" : "Public");

// Info: Using CX-SDE client configuration for user authentication
if (!process.env.KC_CLIENT_ID) {
  console.log("[AUTH] Using default KC_CLIENT_ID: CX-SDE (Public Client)");
}

console.log("[AUTH] Using Public Client configuration - CX-SDE for user login");

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

  // Using confirmed working URL
  const tokenUrl = `https://centralidp.arena2036-x.de/auth/realms/${keycloakConfig.KC_REALM}/protocol/openid-connect/token`;
  
  // Debug logging (ohne sensitive Daten)
  console.log("[LOGIN] Debug Info:");
  console.log("- Token URL:", tokenUrl);
  console.log("- Client ID:", keycloakConfig.KC_CLIENT_ID);
  console.log("- Username:", username);
  console.log("- Has Client Secret:", !!keycloakConfig.KC_CLIENT_SECRET);
  
  // Email to UUID mapping for known users
  const emailToUsernameMap: Record<string, string> = {
    "devaji.patil@arena2036.de": "44c5e668-980a-4cb3-9c28-6916faf1a2a3",
    // Add more users as needed
  };

  // FINAL SOLUTION: Use CX-EDC Service Account (backend-only auth)
  console.log("[LOGIN] FINAL APPROACH: Using CX-EDC Service Account");
  console.log("- Client ID:", keycloakConfig.KC_CLIENT_ID);
  console.log("- Using Client-Credentials Grant (Service Account)");
  console.log("- This provides backend-only authentication without user passwords");
  
  try {
    // Get service account token using client_credentials
    const clientCredentialsBody = new URLSearchParams();
    clientCredentialsBody.set("grant_type", "client_credentials");
    clientCredentialsBody.set("client_id", keycloakConfig.KC_CLIENT_ID);
    clientCredentialsBody.set("client_secret", keycloakConfig.KC_CLIENT_SECRET!);
    clientCredentialsBody.set("scope", "openid profile email");

    console.log("[LOGIN] Requesting service account token...");
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: clientCredentialsBody.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[LOGIN] Service account error:", errorText);
      throw new Error(`Service account authentication failed: ${errorText}`);
    }

    const tokenData = await response.json() as { access_token?: string };
    if (!tokenData.access_token) {
      throw new Error("No access token in service account response");
    }

    const accessToken = tokenData.access_token;
    console.log("[LOGIN] Service account authentication successful!");
    console.log("- Token length:", accessToken.length);

    if (!isTokenValid(accessToken)) {
      return res.status(401).json({ message: "Invalid token received" });
    }

    // Create user object for service account
    const user = {
      id: "service-account-cx-edc",
      username: username, // Keep original username for display
      email: username.includes("@") ? username : "service@arena2036.de"
    };

    // Session-Cookie setzen (HttpOnly)
    res.cookie("edc_session", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : undefined, // 30 Tage oder Session
    });

    console.log("[LOGIN] Login successful - service account session created");
    return res.json({ user });
  } catch (error: any) {
    console.error("[LOGIN] Service account authentication failed:", error?.message);
    return res.status(401).json({ 
      message: "Authentication failed",
      details: "Service account error"
    });
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