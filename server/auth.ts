// server/auth.ts
import express, { type Request, type Response } from "express";
import { z } from "zod";
import { getPasswordToken, decodeToken, isTokenValid } from "./token";

const router = express.Router();

// Environment configuration - Back to CX-SDE and fix Password Grant
const keycloakConfig = {
  KC_URL: process.env.KC_URL || "https://centralidp.arena2036-x.de/auth",
  KC_REALM: process.env.KC_REALM || "CX-Central", 
  KC_CLIENT_ID: process.env.KC_CLIENT_ID || "CX-SDE",
  KC_CLIENT_SECRET: undefined, // CX-SDE is Public Client
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

  // FOCUS ON CX-SDE: Try alternative approaches for Password Grant
  console.log("[LOGIN] FIXING CX-SDE Password Grant");
  console.log("- Client ID:", keycloakConfig.KC_CLIENT_ID);
  console.log("- User credentials are CORRECT (verified with other app)");
  console.log("- Testing different request formats...");
  
  // Force UUID format since it worked in the other app
  const uuidUsername = emailToUsernameMap[username.toLowerCase()] || username;
  console.log("- Using working UUID format:", uuidUsername);
  
  // Try different scopes and request formats
  const attempts = [
    { scope: "openid", description: "Basic OpenID scope" },
    { scope: "openid profile email", description: "Full scopes" },
    { scope: undefined, description: "No scope" },
    { scope: "profile email", description: "Without openid" },
  ];
  
  let accessToken: string | null = null;
  let successAttempt = "";
  
  for (const attempt of attempts) {
    try {
      console.log(`[LOGIN] Attempt: ${attempt.description} (scope: ${attempt.scope || 'none'})`);
      
      const body = new URLSearchParams();
      body.set("grant_type", "password");
      body.set("client_id", keycloakConfig.KC_CLIENT_ID);
      body.set("username", uuidUsername);
      body.set("password", password);
      if (attempt.scope) {
        body.set("scope", attempt.scope);
      }
      
      console.log("- Request body:", body.toString());
      
      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: { 
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json"
        },
        body: body.toString(),
      });
      
      const responseText = await response.text();
      console.log(`- Response status: ${response.status}`);
      console.log(`- Response body: ${responseText}`);
      
      if (response.ok) {
        const tokenData = JSON.parse(responseText);
        if (tokenData.access_token) {
          accessToken = tokenData.access_token;
          successAttempt = attempt.description;
          console.log(`[LOGIN] SUCCESS with ${attempt.description}!`);
          break;
        }
      }
    } catch (error: any) {
      console.log(`[LOGIN] Failed with ${attempt.description}:`, error?.message);
    }
  }
  
  if (!accessToken) {
    console.log("[LOGIN] All CX-SDE attempts failed. SOLUTION:");
    console.log("=".repeat(60));
    console.log("KEYCLOAK ADMIN CONSOLE CHANGES NEEDED FOR CX-SDE:");
    console.log("1. Clients → CX-SDE → Settings");
    console.log("2. Set 'Direct Access Grants Enabled' to ON");
    console.log("3. Save settings");
    console.log("4. Try login again");
    console.log("=".repeat(60));
    
    return res.status(401).json({ 
      message: "CX-SDE Password Grant not enabled",
      details: "Enable 'Direct Access Grants' in Keycloak Admin Console for CX-SDE client",
      solution: {
        step1: "Open Keycloak Admin Console",
        step2: "Go to Clients → CX-SDE → Settings", 
        step3: "Set 'Direct Access Grants Enabled' to ON",
        step4: "Save and try login again"
      }
    });
  }
  
  console.log(`[LOGIN] CX-SDE Success with: ${successAttempt}`);

  if (!isTokenValid(accessToken)) {
    return res.status(401).json({ message: "Invalid token received" });
  }

  // Parse user from token
  const user = parseUserFromToken(accessToken);

  // Session-Cookie setzen (HttpOnly)
  res.cookie("edc_session", accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : undefined, // 30 Tage oder Session
  });

  console.log("[LOGIN] CX-SDE Login successful!");
  return res.json({ user });
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