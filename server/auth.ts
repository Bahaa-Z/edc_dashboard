// server/auth.ts
import express, { type Request, type Response } from "express";
import { z } from "zod";
import { getPasswordToken, decodeToken, isTokenValid } from "./token";

const router = express.Router();

// Environment configuration - Back to CX-SDE for systematic debugging
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

  // SYSTEMATIC DEBUGGING for CX-SDE Client
  console.log("[DEBUG] CX-SDE Client - Systematic Analysis:");
  console.log("- Realm:", keycloakConfig.KC_REALM);
  console.log("- Client ID:", keycloakConfig.KC_CLIENT_ID);
  console.log("- Token URL:", tokenUrl);
  console.log("- Original username:", username);
  console.log("- Password length:", password?.length);
  
  // Test multiple username formats systematically
  const testFormats = [
    { format: "email", value: username },
    { format: "UUID", value: emailToUsernameMap[username.toLowerCase()] || username },
    { format: "lowercase-email", value: username.toLowerCase() },
  ];
  
  console.log("[DEBUG] Testing username formats:");
  testFormats.forEach((format, i) => {
    console.log(`  ${i+1}. ${format.format}: ${format.value}`);
  });
  
  let accessToken: string | null = null;
  let successFormat = "";
  
  // Try each format
  for (const format of testFormats) {
    try {
      console.log(`[LOGIN] Attempting format: ${format.format} (${format.value})`);
      accessToken = await getPasswordToken({
        tokenUrl,
        clientId: keycloakConfig.KC_CLIENT_ID,
        clientSecret: keycloakConfig.KC_CLIENT_SECRET,
        username: format.value,
        password,
        scope: "openid",
      });
      successFormat = format.format;
      console.log(`[LOGIN] SUCCESS with format: ${format.format}!`);
      break;
    } catch (error: any) {
      console.log(`[LOGIN] Failed with ${format.format}:`, error?.message);
    }
  }
  
  if (!accessToken) {
    console.log("[DEBUG] All username formats failed. Possible causes:");
    console.log("1. Password is incorrect");
    console.log("2. User account is disabled/locked");
    console.log("3. User doesn't exist in CX-Central realm");
    console.log("4. CX-SDE client has additional restrictions");
    return res.status(401).json({ 
      message: "Authentication failed",
      details: "All username formats tested, none worked"
    });
  }
    
  console.log(`[LOGIN] FINAL SUCCESS with format: ${successFormat}!`);
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