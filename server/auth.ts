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

console.log("[AUTH] Real Keycloak Password Grant Flow Setup:");
console.log("- KC_CLIENT_ID:", keycloakConfig.KC_CLIENT_ID);
console.log("- Frontend: Username/Password form");
console.log("- Backend: Real Keycloak Password Grant authentication");
console.log("- User activity will appear in Keycloak logs");

// Keycloak Discovery URLs (try multiple patterns)
const DISCOVERY_URLS = [
  `${keycloakConfig.KC_URL}/realms/${keycloakConfig.KC_REALM}/.well-known/openid-connect/configuration`,
  `https://centralidp.arena2036-x.de/realms/${keycloakConfig.KC_REALM}/.well-known/openid-connect/configuration`,
  `${keycloakConfig.KC_URL}/auth/realms/${keycloakConfig.KC_REALM}/.well-known/openid-connect/configuration`
];

console.log("[AUTH] Keycloak Discovery URLs:", DISCOVERY_URLS);

// Keycloak Configuration (discovered)
let authorizationServer: any;

async function initKeycloak() {
  try {
    console.log("[AUTH] Discovering Keycloak configuration...");
    
    // Try discovery with multiple URLs
    let discoveryWorked = false;
    for (const discoveryUrl of DISCOVERY_URLS) {
      try {
        console.log("[AUTH] Trying discovery URL:", discoveryUrl);
        const response = await fetch(discoveryUrl);
        if (response.ok) {
          const config = await fetch(discoveryUrl).then(r => r.json());
          authorizationServer = config;
          console.log("[AUTH] Discovery successful with:", discoveryUrl);
          discoveryWorked = true;
          break;
        } else {
          console.log("[AUTH] Discovery URL failed:", response.status, discoveryUrl);
        }
      } catch (error: any) {
        console.log("[AUTH] Discovery error:", error.message, "for", discoveryUrl);
      }
    }
    
    // If discovery fails, create manual configuration
    if (!discoveryWorked) {
      console.log("[AUTH] All discovery URLs failed - using manual configuration");
      authorizationServer = {
        issuer: `${keycloakConfig.KC_URL}/realms/${keycloakConfig.KC_REALM}`,
        authorization_endpoint: `${keycloakConfig.KC_URL}/realms/${keycloakConfig.KC_REALM}/protocol/openid-connect/auth`,
        token_endpoint: `${keycloakConfig.KC_URL}/realms/${keycloakConfig.KC_REALM}/protocol/openid-connect/token`,
        userinfo_endpoint: `${keycloakConfig.KC_URL}/realms/${keycloakConfig.KC_REALM}/protocol/openid-connect/userinfo`,
        end_session_endpoint: `${keycloakConfig.KC_URL}/realms/${keycloakConfig.KC_REALM}/protocol/openid-connect/logout`,
        jwks_uri: `${keycloakConfig.KC_URL}/realms/${keycloakConfig.KC_REALM}/protocol/openid-connect/certs`
      };
      console.log("[AUTH] Manual configuration created");
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
router.get("/login", async (req: Request, res: Response) => {
  if (!authorizationServer) {
    return res.status(500).json({ 
      message: "Keycloak configuration not loaded",
      error: "Server configuration error" 
    });
  }
  
  try {
    console.log("[LOGIN] Redirecting user to Keycloak...");
    
    // Generate PKCE verifier and challenge (best practice)
    const codeVerifier = openidClient.randomPKCECodeVerifier();
    const codeChallenge = await openidClient.calculatePKCECodeChallenge(codeVerifier);
    const state = openidClient.randomState();
    
    // Store PKCE verifier and state in session
    (req.session as any).codeVerifier = codeVerifier;
    (req.session as any).state = state;
    
    // Build authorization URL (manual - more reliable)
    const authParams = new URLSearchParams();
    authParams.set("client_id", keycloakConfig.KC_CLIENT_ID);
    authParams.set("redirect_uri", keycloakConfig.REDIRECT_URI);
    authParams.set("scope", "openid profile email");
    authParams.set("response_type", "code");
    authParams.set("state", state);
    authParams.set("code_challenge", codeChallenge);
    authParams.set("code_challenge_method", "S256");
    
    const authUrl = `${authorizationServer.authorization_endpoint}?${authParams.toString()}`;
    
    console.log("[LOGIN] Authorization URL created, redirecting...");
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
  if (!authorizationServer) {
    return res.status(500).json({ 
      message: "Keycloak client not initialized",
      error: "Server configuration error" 
    });
  }
  
  try {
    console.log("[CALLBACK] Processing Keycloak callback...");
    
    const { code, state } = req.query;
    
    if (!code) {
      console.error("[CALLBACK] No authorization code received");
      return res.status(400).json({ 
        message: "Authorization code missing",
        error: "Invalid callback request" 
      });
    }
    
    // Verify state parameter
    const sessionState = (req.session as any).state;
    if (state !== sessionState) {
      console.error("[CALLBACK] State mismatch - possible CSRF attack");
      return res.status(400).json({ 
        message: "State parameter mismatch",
        error: "Invalid callback request" 
      });
    }
    
    console.log("[CALLBACK] Exchanging authorization code for tokens...");
    
    // Exchange code for tokens (direct HTTP call)
    const tokenBody = new URLSearchParams();
    tokenBody.set("grant_type", "authorization_code");
    tokenBody.set("client_id", keycloakConfig.KC_CLIENT_ID);
    tokenBody.set("client_secret", keycloakConfig.KC_CLIENT_SECRET);
    tokenBody.set("code", code as string);
    tokenBody.set("redirect_uri", keycloakConfig.REDIRECT_URI);
    tokenBody.set("code_verifier", (req.session as any).codeVerifier);
    
    const tokenResponse = await fetch(authorizationServer.token_endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body: tokenBody.toString(),
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("[CALLBACK] Token exchange failed:", tokenResponse.status, errorText);
      throw new Error(`Token exchange failed: ${errorText}`);
    }
    
    const tokens = await tokenResponse.json();
    console.log("[CALLBACK] Token exchange successful");
    
    // Get user info (direct HTTP call)
    const userInfoResponse = await fetch(authorizationServer.userinfo_endpoint, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${tokens.access_token}`,
        "Accept": "application/json"
      }
    });
    
    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      console.error("[CALLBACK] User info failed:", userInfoResponse.status, errorText);
      throw new Error(`User info failed: ${errorText}`);
    }
    
    const userInfo = await userInfoResponse.json();
    console.log("[CALLBACK] User info retrieved:", userInfo.preferred_username || userInfo.email);
    
    // Store user in session
    (req.session as any).user = {
      id: userInfo.sub,
      username: userInfo.preferred_username || userInfo.email,
      email: userInfo.email,
      name: userInfo.name,
      tokenSet: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
        token_type: tokens.token_type
      }
    };
    
    // Clean up session
    delete (req.session as any).codeVerifier;
    delete (req.session as any).state;
    
    console.log("[CALLBACK] User session created for:", userInfo.preferred_username || userInfo.email);
    console.log("[CALLBACK] ✅ User will appear in Keycloak logs");
    
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

// Password Grant Authentication (echte Keycloak-Authentifizierung)
router.post("/token", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  console.log("[TOKEN] Attempting real Keycloak password grant for:", username);

  try {
    // Echter Password Grant Flow mit Keycloak
    const tokenBody = new URLSearchParams();
    tokenBody.set("grant_type", "password");
    tokenBody.set("client_id", keycloakConfig.KC_CLIENT_ID);
    tokenBody.set("client_secret", keycloakConfig.KC_CLIENT_SECRET);
    tokenBody.set("username", username);
    tokenBody.set("password", password);
    tokenBody.set("scope", "openid profile email");

    const response = await fetch(authorizationServer.token_endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body: tokenBody.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log("[TOKEN] Keycloak password grant failed:", response.status, errorText);
      
      return res.status(401).json({ 
        message: "Invalid username or password",
        error: `Keycloak authentication failed: ${errorText}`,
        details: "Check username/password and Keycloak client configuration"
      });
    }

    const tokenData = await response.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return res.status(401).json({ message: "No access token received from Keycloak" });
    }

    // Get user info from Keycloak
    const userInfoResponse = await fetch(authorizationServer.userinfo_endpoint, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json"
      }
    });

    let userInfo;
    if (userInfoResponse.ok) {
      userInfo = await userInfoResponse.json();
      console.log("[TOKEN] User info retrieved from Keycloak:", userInfo.preferred_username || userInfo.email);
    } else {
      // Fallback user info if userinfo endpoint fails
      userInfo = {
        sub: username.replace('@', '_at_').replace('.', '_'),
        preferred_username: username,
        email: username.includes('@') ? username : `${username}@arena2036.de`
      };
      console.log("[TOKEN] Using fallback user info");
    }

    const user = {
      id: userInfo.sub || userInfo.preferred_username || username,
      username: userInfo.preferred_username || userInfo.email || username,
      email: userInfo.email || (username.includes('@') ? username : `${username}@arena2036.de`)
    };

    console.log("[TOKEN] ✅ SUCCESS! Real Keycloak authentication for:", user.username);
    console.log("[TOKEN] ✅ User activity will appear in Keycloak logs");

    res.json({
      access_token: accessToken, // Echter Keycloak JWT Token
      token_type: tokenData.token_type || "Bearer",
      expires_in: tokenData.expires_in || 3600,
      user: user
    });

  } catch (error: any) {
    console.log("[TOKEN] Keycloak authentication error:", error?.message);
    return res.status(500).json({ 
      message: "Authentication service error",
      error: error?.message 
    });
  }
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
  if (!authorizationServer) {
    return res.status(500).json({ 
      message: "Keycloak client not initialized",
      error: "Server configuration error" 
    });
  }
  
  try {
    const session = req.session as any;
    const username = session.user?.username;
    const accessToken = session.user?.tokenSet?.access_token;
    
    console.log("[LOGOUT] Logging out user:", username || "unknown");
    
    // Create Keycloak logout URL (manual)
    const logoutParams = new URLSearchParams();
    logoutParams.set("client_id", keycloakConfig.KC_CLIENT_ID);
    if (accessToken) {
      logoutParams.set("id_token_hint", accessToken);
    }
    logoutParams.set("post_logout_redirect_uri", process.env.POST_LOGOUT_REDIRECT_URI || "http://localhost:5000");
    
    const logoutUrl = `${authorizationServer.end_session_endpoint}?${logoutParams.toString()}`;
    
    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error("[LOGOUT] Session destruction error:", err.message);
      } else {
        console.log("[LOGOUT] Session destroyed for user:", username || "unknown");
      }
    });
    
    console.log("[LOGOUT] Redirecting to Keycloak logout...");
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