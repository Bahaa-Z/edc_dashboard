// server/auth.ts - SDE Style JWT Resource Server (Authorization Code Flow)
import express, { type Request, type Response } from "express";
import { z } from "zod";
import { decodeToken } from "./token";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

const router = express.Router();

// Environment configuration - Service Account Client (Working Version)
const keycloakConfig = {
  KC_URL: process.env.KC_URL || "https://centralidp.arena2036-x.de/auth",
  KC_REALM: process.env.KC_REALM || "CX-Central", 
  KC_CLIENT_ID: "cx-edc", // Service account client
  KC_CLIENT_SECRET: "VTe8wJlLWOJ8tRJwDTMlQfWTp2VgSQLt", // Service account secret
};

console.log("[AUTH] REAL Keycloak Password Grant Flow:");
console.log("- KC_CLIENT_ID:", keycloakConfig.KC_CLIENT_ID);
console.log("- Grant Type: password (Resource Owner Password Credentials)");
console.log("- NO MOCK TOKENS - Only real Keycloak authentication");
console.log("- User activity will appear in Keycloak logs");

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

// Password Grant Authentication with Service Account (Working Version)
router.post("/token", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  console.log("[TOKEN] Attempting Keycloak user authentication for:", username);

  try {
    // Real user authentication - uses password grant
    const tokenBody = new URLSearchParams();
    tokenBody.set("grant_type", "password");
    tokenBody.set("client_id", keycloakConfig.KC_CLIENT_ID);
    tokenBody.set("client_secret", keycloakConfig.KC_CLIENT_SECRET);
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
      console.log("[TOKEN] Keycloak password grant failed:", response.status, errorText);
      
      // NO FALLBACK - Only real Keycloak authentication
      return res.status(401).json({ 
        message: "Invalid username or password",
        error: `Keycloak authentication failed: ${errorText}`,
        details: "Check Keycloak client configuration for password grant flow"
      });
    }

    const tokenData = await response.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return res.status(401).json({ message: "No access token received" });
    }

    // Parse service account token and create user info
    const decoded = decodeToken<Record<string, any>>(accessToken);
    const user = {
      id: decoded?.sub || "service-account-cx-edc",
      username: username, // Use the provided username
      email: username.includes('@') ? username : `${username}@arena2036.de`
    };

    console.log("[TOKEN] SUCCESS! Service account authentication for user:", user.username);
    console.log("[TOKEN] Service account appears in Keycloak as:", decoded?.preferred_username || "service-account-cx-edc");

    res.json({
      access_token: accessToken,
      token_type: tokenData.token_type || "Bearer",
      expires_in: tokenData.expires_in || 3600,
      user: user
    });

  } catch (error: any) {
    console.log("[TOKEN] Service account authentication error:", error?.message);
    return res.status(500).json({ message: "Authentication service error" });
  }
});

// Legacy login endpoint
router.post("/login", (req: Request, res: Response) => {
  res.json({ 
    message: "Use /api/auth/token endpoint for authentication"
  });
});

// Validate JWT middleware (like SDE backend validation)
export function validateJWT(req: Request, res: Response, next: any) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Authorization header required" });
  }

  const token = authHeader.substring(7); // Remove 'Bearer '

  // Only validate real Keycloak JWT tokens - NO MOCK TOKENS

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



export default router;