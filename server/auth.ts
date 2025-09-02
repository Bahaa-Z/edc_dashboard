// server/auth.ts
import express, { type Request, type Response } from "express";
import { z } from "zod";
import { getPasswordToken, decodeToken, isTokenValid } from "./token";

const router = express.Router();

// Environment configuration with new CX-EDC client
const keycloakConfig = {
  KC_URL: process.env.KC_URL || "https://centralidp.arena2036-x.de/auth",
  KC_REALM: process.env.KC_REALM || "CX-Central", 
  KC_CLIENT_ID: process.env.KC_CLIENT_ID || "CX-EDC",
  KC_CLIENT_SECRET: process.env.KC_CLIENT_SECRET_EDC, // New client secret
};

// Debug environment variables
console.log("[AUTH] Environment Debug:");
console.log("- KC_CLIENT_SECRET_EDC exists:", !!process.env.KC_CLIENT_SECRET_EDC);
console.log("- KC_CLIENT_SECRET_EDC length:", process.env.KC_CLIENT_SECRET_EDC?.length || 0);
console.log("- keycloakConfig.KC_CLIENT_SECRET:", !!keycloakConfig.KC_CLIENT_SECRET);

// Info: Using new CX-EDC client configuration
if (!process.env.KC_CLIENT_ID) {
  console.log("[AUTH] Using default KC_CLIENT_ID: CX-EDC");
}

if (keycloakConfig.KC_CLIENT_SECRET) {
  console.log("[AUTH] Using Confidential Client configuration (with client secret)");
} else {
  console.log("[AUTH] Using Public Client configuration (no client secret)");
}

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

  // Use UUID if email is mapped, otherwise use original username
  const mappedUsername = emailToUsernameMap[username.toLowerCase()] || username;
  
  console.log("- Mapped username:", mappedUsername);

  try {
    // Single login attempt with correct client configuration
    console.log(`[LOGIN] Attempting login with ${keycloakConfig.KC_CLIENT_SECRET ? 'Confidential' : 'Public'} client`);
    
    const accessToken = await getPasswordToken({
      tokenUrl,
      clientId: keycloakConfig.KC_CLIENT_ID,
      clientSecret: keycloakConfig.KC_CLIENT_SECRET, // Now using client secret for confidential client
      username: mappedUsername,
      password,
      scope: "openid",
    });
    
    console.log(`[LOGIN] SUCCESS with username: ${mappedUsername}`);
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