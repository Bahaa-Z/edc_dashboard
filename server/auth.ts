// server/auth.ts - SDE Style JWT Resource Server (Authorization Code Flow)
import express, { type Request, type Response } from "express";
import { z } from "zod";
import { decodeToken } from "./token";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

const router = express.Router();

// Environment configuration - Public Client (like working Keycloak clients)
const keycloakConfig = {
  KC_URL: process.env.KC_URL || "https://centralidp.arena2036-x.de/auth",
  KC_REALM: process.env.KC_REALM || "CX-Central", 
  KC_CLIENT_ID: "Cl2-CX-Portal", // Public client with Direct Access Grants enabled
  KC_CLIENT_SECRET: null, // Public client doesn't need secret
};

console.log("[AUTH] Login Form + Real Keycloak Authentication:");
console.log("- KC_CLIENT_ID:", keycloakConfig.KC_CLIENT_ID);
console.log("- Client Type: Public (no client secret)");
console.log("- Direct Access Grants: Enabled for password authentication");

// JWT Resource Server Configuration (like SDE)
const KEYCLOAK_BASE = `${keycloakConfig.KC_URL}/realms/${keycloakConfig.KC_REALM}`;
const TOKEN_URL = `${KEYCLOAK_BASE}/protocol/openid-connect/token`;
const JWKS_URL = `${KEYCLOAK_BASE}/protocol/openid-connect/certs`;
const ISSUER_URL = KEYCLOAK_BASE;

console.log("[AUTH] Keycloak JWT Configuration:");
console.log("- Issuer URL:", ISSUER_URL);
console.log("- JWKS URL:", JWKS_URL);

// JWT validation setup (like SDE backend)
const jwksClientInstance = jwksClient({
  jwksUri: JWKS_URL,
  requestHeaders: {},
  timeout: 30000,
});

function getKey(header: any, callback: any) {
  jwksClientInstance.getSigningKey(header.kid, (err, key) => {
    if (err) {
      console.log("[JWT] Error getting signing key:", err.message);
      return callback(err);
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

// Password Grant Authentication with Public Client
router.post("/token", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  console.log("[TOKEN] Attempting Keycloak authentication for:", username);

  try {
    // Public client password grant (no client_secret)
    const tokenBody = new URLSearchParams();
    tokenBody.set("grant_type", "password");
    tokenBody.set("client_id", keycloakConfig.KC_CLIENT_ID);
    // No client_secret for public client
    tokenBody.set("username", username);
    tokenBody.set("password", password);
    tokenBody.set("scope", "openid profile email");

    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body: tokenBody.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log("[TOKEN] Keycloak authentication failed:", response.status, errorText);
      
      return res.status(401).json({ 
        message: "Invalid username or password",
        keycloakError: errorText
      });
    }

    const tokenData = await response.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return res.status(401).json({ message: "No access token received" });
    }

    // Parse user from real Keycloak token
    const decoded = decodeToken<Record<string, any>>(accessToken);
    const user = {
      id: decoded?.sub || "user",
      username: decoded?.preferred_username || decoded?.email || username,
      email: decoded?.email || username
    };

    console.log("[TOKEN] SUCCESS! Real Keycloak token for user:", user.username);

    res.json({
      access_token: accessToken,
      token_type: tokenData.token_type || "Bearer",
      expires_in: tokenData.expires_in || 3600,
      user: user
    });

  } catch (error: any) {
    console.log("[TOKEN] Authentication error:", error?.message);
    return res.status(500).json({ message: "Authentication service error" });
  }
});

// Legacy login endpoint (redirects to Authorization Code Flow)
router.post("/login", (req: Request, res: Response) => {
  res.json({ 
    message: "Use Authorization Code Flow like SDE",
    redirectUrl: "/api/auth/authorize"
  });
});

// Validate JWT middleware (like SDE backend validation)
export function validateJWT(req: Request, res: Response, next: any) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Authorization header required" });
  }

  const token = authHeader.substring(7); // Remove 'Bearer '

  // Skip mock token validation for public client - use only real Keycloak validation

  // Validate real Keycloak JWT token
  jwt.verify(token, getKey, {
    audience: keycloakConfig.KC_CLIENT_ID,
    issuer: ISSUER_URL,
    algorithms: ['RS256']
  }, (err, decoded: any) => {
    if (err) {
      console.log("[JWT] Real token validation failed:", err.message);
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Extract user info from JWT
    (req as any).user = {
      id: decoded.sub,
      username: decoded.preferred_username || decoded.email,
      email: decoded.email
    };

    console.log("[JWT] Real token validated for user:", (req as any).user.username);
    next();
  });
}

// Get current user info from JWT
router.get("/me", validateJWT, (req: Request, res: Response) => {
  const user = (req as any).user;
  res.json({ user });
});

// Logout endpoint (client-side token removal)
router.post("/logout", (req: Request, res: Response) => {
  res.json({ message: "Logout successful - remove token on client side" });
});

// OAuth2 Authorization Code Flow (for Keycloak users)
router.get("/authorize", (req: Request, res: Response) => {
  const state = require('crypto').randomBytes(16).toString('hex');
  const authUrl = `${KEYCLOAK_BASE}/protocol/openid-connect/auth?` +
    `client_id=${keycloakConfig.KC_CLIENT_ID}&` +
    `response_type=code&` +
    `scope=openid profile email&` +
    `redirect_uri=${encodeURIComponent('http://localhost:5000/api/auth/callback')}&` +
    `state=${state}`;
  
  console.log("[OAUTH] Redirecting to Keycloak for authorization:", authUrl);
  res.redirect(authUrl);
});

// OAuth2 Callback (exchange code for token)
router.get("/callback", async (req: Request, res: Response) => {
  const { code, state } = req.query;
  
  if (!code) {
    console.log("[OAUTH] No authorization code received");
    return res.redirect('/login?error=no_code');
  }

  try {
    console.log("[OAUTH] Exchanging authorization code for tokens");
    
    // Exchange code for tokens
    const tokenBody = new URLSearchParams();
    tokenBody.set("grant_type", "authorization_code");
    tokenBody.set("client_id", keycloakConfig.KC_CLIENT_ID);
    tokenBody.set("client_secret", keycloakConfig.KC_CLIENT_SECRET!);
    tokenBody.set("code", code as string);
    tokenBody.set("redirect_uri", "http://localhost:5000/api/auth/callback");

    const tokenResponse = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body: tokenBody.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.log("[OAUTH] Token exchange failed:", tokenResponse.status, errorText);
      return res.redirect('/login?error=token_exchange_failed');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user info from token
    const decoded = decodeToken<Record<string, any>>(accessToken);
    const user = {
      id: decoded?.sub || "unknown",
      username: decoded?.preferred_username || decoded?.email || "user",
      email: decoded?.email
    };

    console.log("[OAUTH] SUCCESS! OAuth2 flow completed for user:", user.username);

    // Store token in session or redirect with token
    // For now, redirect to frontend with user info
    res.redirect(`/?oauth_success=true&user=${encodeURIComponent(JSON.stringify(user))}&token=${encodeURIComponent(accessToken)}`);

  } catch (error: any) {
    console.log("[OAUTH] OAuth2 callback error:", error?.message);
    res.redirect('/login?error=oauth_failed');
  }
});

export default router;