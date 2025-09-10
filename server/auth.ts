// server/auth.ts - EINFACHER Keycloak OIDC AUTH wie im Medium Artikel
import express, { type Request, type Response } from "express";
import { Issuer, Client, type TokenSet } from "openid-client";

const router = express.Router();

// Keycloak Config (EINFACH)
const keycloakConfig = {
  KC_URL: "https://centralidp.arena2036-x.de/auth",
  KC_REALM: "CX-Central", 
  KC_CLIENT_ID: "CX-EDC",
  KC_CLIENT_SECRET: "kwe2FC3EXDPUuUEoVhI6igUnRAmzkuwN",
  REDIRECT_URI: "http://localhost:5000/api/auth/callback"
};

console.log("[SIMPLE AUTH] Keycloak Client ID:", keycloakConfig.KC_CLIENT_ID);

let keycloakClient: Client;

// Initialize Keycloak Client (wie im Artikel)
async function initKeycloak() {
  try {
    const keycloakIssuer = await Issuer.discover(
      `${keycloakConfig.KC_URL}/realms/${keycloakConfig.KC_REALM}`
    );

    keycloakClient = new keycloakIssuer.Client({
      client_id: keycloakConfig.KC_CLIENT_ID,
      client_secret: keycloakConfig.KC_CLIENT_SECRET,
      redirect_uris: [keycloakConfig.REDIRECT_URI],
      response_types: ['code'],
    });

    console.log("[SIMPLE AUTH] ✅ Keycloak Client initialized");
    return keycloakClient;
  } catch (error: any) {
    console.error("[SIMPLE AUTH] Keycloak init failed:", error.message);
    throw error;
  }
}

// Initialize on startup
initKeycloak().catch(console.error);

// 1. LOGIN - Redirect to Keycloak (wie im Artikel)
router.get("/login", (req: Request, res: Response) => {
  if (!keycloakClient) {
    return res.status(500).json({ message: "Keycloak not initialized" });
  }

  console.log("[LOGIN] Redirecting to Keycloak...");
  
  const authUrl = keycloakClient.authorizationUrl({
    scope: 'openid profile email',
    state: 'randomstate123'
  });

  res.redirect(authUrl);
});

// 2. CALLBACK - Handle Keycloak response (wie im Artikel)
router.get("/callback", async (req: Request, res: Response) => {
  if (!keycloakClient) {
    return res.status(500).json({ message: "Keycloak not initialized" });
  }

  try {
    console.log("[CALLBACK] Processing Keycloak callback...");
    
    const params = keycloakClient.callbackParams(req);
    const tokenSet: TokenSet = await keycloakClient.callback(
      keycloakConfig.REDIRECT_URI, 
      params,
      { state: 'randomstate123' }
    );

    // Get user info
    const userInfo = await keycloakClient.userinfo(tokenSet.access_token!);
    
    // Store in session (wie im Artikel)
    (req.session as any).user = {
      id: userInfo.sub,
      username: userInfo.preferred_username || userInfo.email,
      email: userInfo.email,
      name: userInfo.name,
      tokenSet: tokenSet
    };

    console.log("[CALLBACK] ✅ User logged in:", userInfo.preferred_username || userInfo.email);
    
    // Redirect to app
    res.redirect('/');
  } catch (error: any) {
    console.error("[CALLBACK] Auth failed:", error.message);
    res.status(500).json({ message: "Authentication failed" });
  }
});

// 3. LOGOUT (wie im Artikel)
router.get("/logout", async (req: Request, res: Response) => {
  const session = req.session as any;
  const username = session.user?.username;
  
  console.log("[LOGOUT] Logging out user:", username || "unknown");
  
  // Destroy session
  req.session.destroy((err) => {
    if (err) {
      console.error("[LOGOUT] Session error:", err.message);
    }
    console.log("[LOGOUT] ✅ User logged out");
    res.redirect('/');
  });
});

// 4. USER INFO (einfach)
router.get("/me", (req: Request, res: Response) => {
  const session = req.session as any;
  
  if (!session.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  res.json({ 
    user: {
      id: session.user.id,
      username: session.user.username,
      email: session.user.email,
      name: session.user.name
    }
  });
});

// AUTH MIDDLEWARE (einfach)
export function requireAuth(req: Request, res: Response, next: any) {
  const session = req.session as any;
  
  if (!session.user) {
    return res.status(401).json({ 
      message: "Authentication required",
      redirect: "/api/auth/login"
    });
  }
  
  (req as any).user = session.user;
  next();
}

export default router;