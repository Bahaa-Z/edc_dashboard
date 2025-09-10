// server/auth.ts - Authorization Code Flow mit openid-client v6+
import express, { type Request, type Response } from "express";
import * as openidClient from "openid-client";

const router = express.Router();

// Keycloak Configuration für EDC Management Console
const keycloakConfig = {
  KC_URL: process.env.KC_URL || "https://centralidp.arena2036-x.de/auth",
  KC_REALM: process.env.KC_REALM || "CX-Central", 
  KC_CLIENT_ID: "cx-edc",
  KC_CLIENT_SECRET: "VTe8wJlLWOJ8tRJwDTMlQfWTp2VgSQLt",
  REDIRECT_URI: process.env.REDIRECT_URI || "http://localhost:5000/api/auth/callback"
};

console.log("[AUTH] Authorization Code Flow Keycloak Setup (openid-client v6):");
console.log("- KC_CLIENT_ID:", keycloakConfig.KC_CLIENT_ID);
console.log("- Redirect URI:", keycloakConfig.REDIRECT_URI);
console.log("- Real Keycloak authentication with user activity in logs");

// Keycloak Discovery URL
const DISCOVERY_URL = `${keycloakConfig.KC_URL}/realms/${keycloakConfig.KC_REALM}/.well-known/openid-connect/configuration`;

console.log("[AUTH] Keycloak Discovery URL:", DISCOVERY_URL);

// Keycloak Configuration (discovered)
let authorizationServer: any;

async function initKeycloak() {
  try {
    console.log("[AUTH] Discovering Keycloak configuration...");
    
    // Discover Keycloak authorization server (v6+ API)
    try {
      authorizationServer = await openidClient.discovery(new URL(DISCOVERY_URL));
    } catch (error: any) {
      console.warn("[AUTH] Discovery failed, trying legacy URL:", error.message);
      // Try legacy discovery URL (older Keycloak versions)
      const legacyUrl = `${keycloakConfig.KC_URL}/auth/realms/${keycloakConfig.KC_REALM}/.well-known/openid-connect/configuration`;
      authorizationServer = await openidClient.discovery(new URL(legacyUrl));
    }
    
    console.log("[AUTH] Discovered Keycloak issuer:", authorizationServer.issuer);
    console.log("[AUTH] Authorization endpoint:", authorizationServer.authorization_endpoint);
    console.log("[AUTH] Token endpoint:", authorizationServer.token_endpoint);
    console.log("[AUTH] Keycloak configuration loaded successfully");
    
    return authorizationServer;
  } catch (error: any) {
    console.error("[AUTH] Keycloak discovery failed:", error.message);
    throw error;
  }
}

// Initialize configuration
initKeycloak().then(config => {
  authorizationServer = config;
  console.log("[AUTH] Client ready for authentication");
}).catch(err => {
  console.error("[AUTH] Failed to initialize Keycloak:", err.message);
});

// Authorization Code Flow Routen

// 1. Login Route - Redirect zu Keycloak
router.get("/login", (req: Request, res: Response) => {
  if (!client) {
    return res.status(500).json({ 
      message: "Keycloak client not initialized",
      error: "Server configuration error" 
    });
  }
  
  try {
    console.log("[LOGIN] Redirecting user to Keycloak...");
    
    const authUrl = client.authorizationUrl({
      scope: 'openid profile email',
      response_type: 'code',
    });
    
    console.log("[LOGIN] Authorization URL:", authUrl);
    res.redirect(authUrl);
  } catch (error: any) {
    console.error("[LOGIN] Error creating authorization URL:", error.message);
    res.status(500).json({ 
      message: "Failed to create login URL",
      error: error.message 
    });
  }
});

// 2. Callback Route - Handle Keycloak response
router.get("/callback", async (req: Request, res: Response) => {
  if (!client) {
    return res.status(500).json({ 
      message: "Keycloak client not initialized",
      error: "Server configuration error" 
    });
  }
  
  try {
    console.log("[CALLBACK] Processing Keycloak callback...");
    
    const params = client.callbackParams(req);
    console.log("[CALLBACK] Received params:", Object.keys(params));
    
    // Exchange code for tokens
    const tokenSet = await client.callback(keycloakConfig.REDIRECT_URI, params);
    console.log("[CALLBACK] Token exchange successful");
    
    // Get user info
    const userInfo = await client.userinfo(tokenSet.access_token!);
    console.log("[CALLBACK] User info retrieved:", userInfo.preferred_username || userInfo.email);
    
    // Store user in session
    (req.session as any).user = {
      id: userInfo.sub,
      username: userInfo.preferred_username || userInfo.email,
      email: userInfo.email,
      name: userInfo.name,
      tokenSet: {
        access_token: tokenSet.access_token,
        refresh_token: tokenSet.refresh_token,
        expires_at: tokenSet.expires_at
      }
    };
    
    console.log("[CALLBACK] User session created for:", userInfo.preferred_username || userInfo.email);
    
    // Redirect to dashboard
    res.redirect('/');
  } catch (error: any) {
    console.error("[CALLBACK] Authentication failed:", error.message);
    res.status(500).json({ 
      message: `Authentication failed: ${error.message}`,
      error: "Callback processing error"
    });
  }
});

// Legacy token endpoint (for backwards compatibility)
router.post("/token", (req: Request, res: Response) => {
  res.status(410).json({ 
    message: "Password grant flow disabled. Use Authorization Code Flow via /api/auth/login",
    redirect: "/api/auth/login"
  });
});

// Session-based Authentication Middleware
export function requireAuthentication(req: Request, res: Response, next: any) {
  const session = req.session as any;
  
  if (!session.user) {
    console.log("[AUTH] No user session found - redirecting to login");
    return res.status(401).json({ 
      message: "Authentication required",
      redirect: "/api/auth/login"
    });
  }
  
  // Check token expiry
  const tokenSet = session.user.tokenSet;
  if (tokenSet && tokenSet.expires_at && tokenSet.expires_at < Date.now() / 1000) {
    console.log("[AUTH] Token expired for user:", session.user.username);
    delete session.user;
    return res.status(401).json({ 
      message: "Token expired - please login again",
      redirect: "/api/auth/login"
    });
  }
  
  // Add user to request
  (req as any).user = session.user;
  console.log("[AUTH] Authenticated user:", session.user.username);
  next();
}

// Legacy JWT validation (for backwards compatibility)
export function validateJWT(req: Request, res: Response, next: any) {
  // Redirect to session-based auth
  return requireAuthentication(req, res, next);
}

// 3. User Info Route - Get current user
router.get("/me", requireAuthentication, (req: Request, res: Response) => {
  const user = (req as any).user;
  console.log("[ME] Returning user info for:", user.username);
  
  res.json({ 
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name
    }
  });
});

// 4. Logout Route - Destroy session and redirect to Keycloak logout
router.get("/logout", async (req: Request, res: Response) => {
  if (!client) {
    return res.status(500).json({ 
      message: "Keycloak client not initialized",
      error: "Server configuration error" 
    });
  }
  
  try {
    const session = req.session as any;
    const username = session.user?.username;
    
    console.log("[LOGOUT] Logging out user:", username || "unknown");
    
    // Create Keycloak logout URL
    const logoutUrl = client.endSessionUrl({
      post_logout_redirect_uri: process.env.POST_LOGOUT_REDIRECT_URI || "http://localhost:5000"
    });
    
    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error("[LOGOUT] Session destruction error:", err.message);
      } else {
        console.log("[LOGOUT] Session destroyed for user:", username || "unknown");
      }
    });
    
    console.log("[LOGOUT] Redirecting to Keycloak logout:", logoutUrl);
    res.redirect(logoutUrl);
  } catch (error: any) {
    console.error("[LOGOUT] Logout error:", error.message);
    res.status(500).json({ 
      message: "Logout failed",
      error: error.message 
    });
  }
});

// Legacy logout endpoint (POST) 
router.post("/logout", (req: Request, res: Response) => {
  console.log("[LOGOUT] Legacy POST logout - redirecting to GET /logout");
  res.redirect("/api/auth/logout");
});
export default router;