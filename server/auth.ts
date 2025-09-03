// server/auth.ts - OAuth2 Authorization Code Flow
import express, { type Request, type Response } from "express";
import { z } from "zod";
import { getPasswordToken, decodeToken, isTokenValid } from "./token";
import crypto from "crypto";

const router = express.Router();

// Environment configuration - Using CX-EDC Client Credentials
const keycloakConfig = {
  KC_URL: process.env.KC_URL || "https://centralidp.arena2036-x.de/auth",
  KC_REALM: process.env.KC_REALM || "CX-Central", 
  KC_CLIENT_ID: "CX-EDC", // Using working CX-EDC client
  KC_CLIENT_SECRET: process.env.KC_CLIENT_SECRET_EDC || "kwe2FC3EXDPUuUEoVhI6igUnRAmzkuwN",
};

// Debug configuration
console.log("[AUTH] Client Configuration:");
console.log("- KC_CLIENT_ID:", keycloakConfig.KC_CLIENT_ID);
console.log("- KC_CLIENT_SECRET:", keycloakConfig.KC_CLIENT_SECRET ? "SET" : "NOT_SET");
console.log("- Client Type:", keycloakConfig.KC_CLIENT_SECRET ? "Confidential" : "Public");

console.log("[AUTH] Using OAuth2 Authorization Code Flow for user authentication");

// OAuth2 Configuration
const KEYCLOAK_BASE = "https://centralidp.arena2036-x.de/auth/realms/CX-Central";
const AUTHORIZATION_URL = `${KEYCLOAK_BASE}/protocol/openid-connect/auth`;
const TOKEN_URL = `${KEYCLOAK_BASE}/protocol/openid-connect/token`;
const REDIRECT_URI = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000/api/auth/callback'
  : `https://${process.env.REPLIT_DOMAIN || 'your-app'}/api/auth/callback`;

console.log("[AUTH] OAuth2 Configuration:");
console.log("- Authorization URL:", AUTHORIZATION_URL);
console.log("- Token URL:", TOKEN_URL);
console.log("- Redirect URI:", REDIRECT_URI);

// Legacy schema (kept for compatibility)
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

// Step 1: Initialize OAuth2 Authorization (Redirect to Keycloak)
router.get("/authorize", (req: Request, res: Response) => {
  // Generate PKCE challenge (recommended for security)
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  const state = crypto.randomBytes(32).toString('hex');
  
  // Store in session for callback verification
  req.session.oauthState = state;
  req.session.codeVerifier = codeVerifier;
  
  // Build authorization URL
  const params = new URLSearchParams({
    client_id: keycloakConfig.KC_CLIENT_ID,
    response_type: 'code',
    scope: 'openid profile email',
    redirect_uri: REDIRECT_URI,
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });
  
  const authUrl = `${AUTHORIZATION_URL}?${params.toString()}`;
  console.log("[AUTH] Redirecting to Keycloak:", authUrl);
  
  res.redirect(authUrl);
});

// Step 2: Handle OAuth2 Callback (Exchange code for token)
router.get("/callback", async (req: Request, res: Response) => {
  const { code, state, error } = req.query;
  
  if (error) {
    console.log("[CALLBACK] OAuth error:", error);
    return res.redirect('/login?error=oauth_error');
  }
  
  if (!code || !state) {
    console.log("[CALLBACK] Missing code or state parameter");
    return res.redirect('/login?error=missing_params');
  }
  
  // Verify state parameter (CSRF protection)
  if (state !== req.session.oauthState) {
    console.log("[CALLBACK] Invalid state parameter");
    return res.redirect('/login?error=invalid_state');
  }
  
  try {
    console.log("[CALLBACK] Exchanging authorization code for tokens...");
    
    // Exchange authorization code for access token
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: keycloakConfig.KC_CLIENT_ID,
      client_secret: keycloakConfig.KC_CLIENT_SECRET!,
      code: code as string,
      redirect_uri: REDIRECT_URI,
      code_verifier: req.session.codeVerifier!
    });
    
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: body.toString()
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log("[CALLBACK] Token exchange failed:", response.status, errorText);
      return res.redirect('/login?error=token_exchange_failed');
    }
    
    const tokenData = await response.json();
    const accessToken = tokenData.access_token;
    
    if (!accessToken) {
      console.log("[CALLBACK] No access token in response");
      return res.redirect('/login?error=no_access_token');
    }
    
    // Parse user information from token
    const user = parseUserFromToken(accessToken);
    
    console.log("[CALLBACK] SUCCESS! User authenticated:", user.username);
    
    // Store in session
    req.session.user = user;
    req.session.accessToken = accessToken;
    req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    // Clean up OAuth state
    delete req.session.oauthState;
    delete req.session.codeVerifier;
    
    console.log("[CALLBACK] Session created for user:", user.username);
    
    // Redirect to dashboard
    res.redirect('/');
    
  } catch (error: any) {
    console.log("[CALLBACK] Error during token exchange:", error?.message);
    return res.redirect('/login?error=server_error');
  }
});

// Legacy login endpoint (kept for compatibility)
router.post("/login", async (req: Request, res: Response) => {
  // For Authorization Code Flow, redirect to /authorize endpoint
  res.json({ 
    message: "Use authorization code flow",
    redirectTo: "/api/auth/authorize"
  });
});

// Logout endpoint
router.post("/logout", (req: Request, res: Response) => {
  if (req.session.user) {
    const username = req.session.user.username;
    req.session.destroy((err) => {
      if (err) {
        console.error("[LOGOUT] Session destroy error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      console.log("[LOGOUT] Session destroyed for user:", username);
      res.json({ message: "Logout successful" });
    });
  } else {
    res.json({ message: "No active session" });
  }
});

// Check authentication status
router.get("/me", (req: Request, res: Response) => {
  if (req.session.user) {
    res.json({ 
      user: { 
        id: req.session.user.id, 
        username: req.session.user.username, 
        email: req.session.user.email 
      } 
    });
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
});

export default router;