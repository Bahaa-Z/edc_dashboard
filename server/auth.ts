// server/auth.ts - Authorization Code Grant Flow
import express, { type Request, type Response } from "express";
import { Issuer, Client } from "openid-client";

const router = express.Router();

// Keycloak Config (Ihre bestehenden Einstellungen)
const keycloakConfig = {
  KC_URL: "https://centralidp.arena2036-x.de/auth",
  KC_REALM: "CX-Central", 
  KC_CLIENT_ID: "CX-EDC",
  KC_CLIENT_SECRET: "kwe2FC3EXDPUuUEoVhI6igUnRAmzkuwN",
  REDIRECT_URI: "http://localhost:8080/api/auth/callback"
};

console.log("[AUTH] Authorization Code Grant Flow");
console.log("[AUTH] Client ID:", keycloakConfig.KC_CLIENT_ID);

let keycloakClient: Client;

// Initialize Keycloak Client für Authorization Code Flow
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

    console.log("[AUTH] ✅ Keycloak Client initialized for Authorization Code Grant");
    return keycloakClient;
  } catch (error: any) {
    console.error("[AUTH] Keycloak init failed:", error.message);
    throw error;
  }
}

// Initialize on startup
initKeycloak().catch(console.error);

// LOGIN - Authorization Code Grant
router.post("/login", async (req: Request, res: Response) => {
  const { isDemo } = req.body;

  // Demo Login für Testing
  if (isDemo === true) {
    console.log("[LOGIN] Demo login requested");
    const demoUser = {
      id: "demo-user-123",
      username: "demo@catena-x.net",
      email: "demo@catena-x.net",
      name: "Demo User"
    };

    // Store in session
    (req.session as any).user = demoUser;
    console.log("[LOGIN] ✅ Demo user logged in");

    return res.json({
      success: true,
      user: demoUser,
      token: "demo-token-123",
      message: "Demo login successful"
    });
  }

  // Authorization Code Grant - Redirect to Keycloak
  if (!keycloakClient) {
    return res.status(500).json({ 
      success: false,
      message: "Keycloak not initialized" 
    });
  }

  try {
    console.log("[LOGIN] Starting Authorization Code Grant Flow...");
    
    // Generate state and store in session
    const state = 'auth-state-' + Date.now();
    (req.session as any).auth_state = state;
    
    // Create authorization URL mit Standard Scopes
    const authUrl = keycloakClient.authorizationUrl({
      scope: 'openid profile email', // Standard OpenID Connect Scopes
      state: state
    });

    console.log("[LOGIN] Redirect URL created with state:", state);
    
    res.json({
      success: true,
      redirect: true,
      authUrl: authUrl,
      message: "Redirecting to Keycloak..."
    });

  } catch (error: any) {
    console.log("[LOGIN] Authorization Code Flow failed:", error.message);
    
    return res.status(500).json({ 
      success: false,
      message: "Authorization setup failed",
      error: error.message
    });
  }
});

// CALLBACK - Handle Authorization Code
router.get("/callback", async (req: Request, res: Response) => {
  if (!keycloakClient) {
    console.error("[CALLBACK] Keycloak client not initialized");
    return res.redirect('/?login=error&reason=no_client');
  }

  try {
    console.log("[CALLBACK] Processing authorization code...");
    console.log("[CALLBACK] Query params:", req.query);
    
    const params = keycloakClient.callbackParams(req);
    console.log("[CALLBACK] Parsed params:", params);
    
    // Proper state validation
    const sessionState = (req.session as any).auth_state;
    console.log("[CALLBACK] Session state:", sessionState);
    console.log("[CALLBACK] Received state:", params.state);
    
    const tokenSet = await keycloakClient.callback(
      keycloakConfig.REDIRECT_URI, 
      params,
      { state: sessionState } // Proper state validation
    );

    console.log("[CALLBACK] Token exchange successful");
    console.log("[CALLBACK] Access token received:", !!tokenSet.access_token);
    console.log("[CALLBACK] Refresh token:", !!tokenSet.refresh_token);

    // Get user info
    const userInfo = await keycloakClient.userinfo(tokenSet.access_token!);
    console.log("[CALLBACK] User info retrieved:", userInfo.preferred_username || userInfo.email);
    
    const user = {
      id: userInfo.sub,
      username: userInfo.preferred_username || userInfo.email,
      email: userInfo.email,
      name: userInfo.name
    };

    // Store in session mit Refresh Token
    (req.session as any).user = {
      ...user,
      tokenSet: {
        access_token: tokenSet.access_token,
        refresh_token: tokenSet.refresh_token,
        expires_at: tokenSet.expires_at,
        token_type: tokenSet.token_type
      }
    };

    console.log("[CALLBACK] ✅ User logged in:", user.username);
    console.log("[CALLBACK] ✅ User will appear in Keycloak logs");
    
    // Redirect to app
    console.log("[CALLBACK] Redirecting to dashboard...");
    res.redirect('/?login=success');
    
  } catch (error: any) {
    console.error("[CALLBACK] Auth failed:", error.message);
    console.error("[CALLBACK] Full error:", error);
    res.redirect('/?login=error&reason=' + encodeURIComponent(error.message));
  }
});

// REFRESH TOKEN
router.post("/refresh", async (req: Request, res: Response) => {
  const session = req.session as any;
  
  if (!session.user || !session.user.tokenSet?.refresh_token) {
    return res.status(401).json({ 
      success: false,
      message: "No refresh token available" 
    });
  }

  if (!keycloakClient) {
    return res.status(500).json({ 
      success: false,
      message: "Keycloak not initialized" 
    });
  }

  try {
    console.log("[REFRESH] Refreshing access token...");
    
    const tokenSet = await keycloakClient.refresh(session.user.tokenSet.refresh_token);
    
    // Update session
    session.user.tokenSet = {
      access_token: tokenSet.access_token,
      refresh_token: tokenSet.refresh_token || session.user.tokenSet.refresh_token,
      expires_at: tokenSet.expires_at,
      token_type: tokenSet.token_type
    };

    console.log("[REFRESH] ✅ Token refreshed");

    res.json({
      success: true,
      token: tokenSet.access_token,
      message: "Token refreshed"
    });

  } catch (error: any) {
    console.error("[REFRESH] Token refresh failed:", error.message);
    
    // Clear session if refresh fails
    delete session.user;
    
    res.status(401).json({ 
      success: false,
      message: "Token refresh failed",
      error: error.message
    });
  }
});

// USER INFO
router.get("/me", (req: Request, res: Response) => {
  const session = req.session as any;
  
  if (!session.user) {
    return res.status(401).json({ 
      success: false,
      message: "Not authenticated" 
    });
  }

  res.json({ 
    success: true,
    user: {
      id: session.user.id,
      username: session.user.username,
      email: session.user.email,
      name: session.user.name
    }
  });
});

// LOGOUT
router.post("/logout", async (req: Request, res: Response) => {
  const session = req.session as any;
  const username = session.user?.username;
  
  console.log("[LOGOUT] Logging out user:", username || "unknown");
  
  req.session.destroy((err) => {
    if (err) {
      console.error("[LOGOUT] Session error:", err.message);
      return res.status(500).json({ 
        success: false,
        message: "Logout failed" 
      });
    }
    
    console.log("[LOGOUT] ✅ User logged out");
    res.json({ 
      success: true,
      message: "Logged out successfully" 
    });
  });
});

// AUTH MIDDLEWARE
export function requireAuth(req: Request, res: Response, next: any) {
  const session = req.session as any;
  
  if (!session.user) {
    return res.status(401).json({ 
      success: false,
      message: "Authentication required" 
    });
  }
  
  (req as any).user = session.user;
  next();
}

export default router;