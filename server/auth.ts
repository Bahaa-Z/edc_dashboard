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

  // Test different Keycloak URL formats based on user's working auth URL
  const possibleTokenUrls = [
    `https://centralidp.arena2036-x.de/auth/realms/${keycloakConfig.KC_REALM}/protocol/openid-connect/token`, // Based on user's auth URL
    `${keycloakConfig.KC_URL}/realms/${keycloakConfig.KC_REALM}/protocol/openid-connect/token`, // Original config
    `https://centralidp.arena2036-x.de/realms/${keycloakConfig.KC_REALM}/protocol/openid-connect/token`, // Without /auth/
  ];
  
  console.log("- Testing URLs:", possibleTokenUrls);

  // Debug logging (ohne sensitive Daten)
  console.log("[LOGIN] Debug Info:");
  console.log("- Client ID:", keycloakConfig.KC_CLIENT_ID);
  console.log("- Username:", username);
  console.log("- Has Client Secret:", !!keycloakConfig.KC_CLIENT_SECRET);
  
  // Email to UUID mapping for known users
  const emailToUsernameMap: Record<string, string> = {
    "devaji.patil@arena2036.de": "44c5e668-980a-4cb3-9c28-6916faf1a2a3",
    // Add more users as needed
  };

  // Test different username formats including UUID mapping
  const alternativeUsernames = [
    emailToUsernameMap[username.toLowerCase()] || username, // UUID if email is mapped
    username, // Original: devaji.patil@arena2036.de
    username.split('@')[0], // Just: devaji.patil
    username.toLowerCase(), // Lowercase version
  ].filter((u, i, arr) => arr.indexOf(u) === i); // Remove duplicates
  
  console.log("- Alternative usernames to try:", alternativeUsernames);

  try {
    // Try different URL and username combinations
    let accessToken: string | null = null;
    let lastError: any = null;
    let successUrl: string | null = null;
    let successUsername: string | null = null;
    
    // Test each URL with the main username first
    for (const testUrl of possibleTokenUrls) {
      try {
        console.log(`[LOGIN] Trying URL: ${testUrl} with username: ${username}`);
        accessToken = await getPasswordToken({
          tokenUrl: testUrl,
          clientId: keycloakConfig.KC_CLIENT_ID,
          clientSecret: undefined, // Public Client - kein Secret senden
          username: username,
          password,
          scope: "openid",
        });
        console.log(`[LOGIN] SUCCESS with URL: ${testUrl} and username: ${username}`);
        successUrl = testUrl;
        successUsername = username;
        break; // Success - exit loop
      } catch (error: any) {
        console.log(`[LOGIN] FAILED with URL: ${testUrl} - ${error.message}`);
        lastError = error;
        continue; // Try next URL
      }
    }
    
    // If still no success, try alternative usernames with the most likely URL
    if (!accessToken && possibleTokenUrls.length > 0) {
      const mainUrl = possibleTokenUrls[1]; // Try without /auth/ first
      console.log(`[LOGIN] Trying alternative usernames with URL: ${mainUrl}`);
      
      for (const testUsername of alternativeUsernames) {
        try {
          console.log(`[LOGIN] Trying username: ${testUsername}`);
          accessToken = await getPasswordToken({
            tokenUrl: mainUrl,
            clientId: keycloakConfig.KC_CLIENT_ID,
            clientSecret: undefined,
            username: testUsername,
            password,
            scope: "openid",
          });
          console.log(`[LOGIN] SUCCESS with URL: ${mainUrl} and username: ${testUsername}`);
          successUrl = mainUrl;
          successUsername = testUsername;
          break;
        } catch (error: any) {
          console.log(`[LOGIN] FAILED with username: ${testUsername} - ${error.message}`);
          lastError = error;
          continue;
        }
      }
    }
    
    if (!accessToken) {
      throw lastError || new Error("All URL and username combinations failed");
    }
    
    if (successUrl && successUsername) {
      console.log(`[LOGIN] Final success: URL=${successUrl}, Username=${successUsername}`);
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