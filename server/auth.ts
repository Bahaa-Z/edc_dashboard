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

console.log("[AUTH] Using improved Keycloak authentication for all users");

// Keycloak Configuration
const KEYCLOAK_BASE = "https://centralidp.arena2036-x.de/auth/realms/CX-Central";
const TOKEN_URL = `${KEYCLOAK_BASE}/protocol/openid-connect/token`;

console.log("[AUTH] Keycloak Configuration:");
console.log("- Token URL:", TOKEN_URL);
console.log("- Supports all registered Keycloak users");

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

// Legacy OAuth2 endpoints (kept for backward compatibility but not used)
router.get("/authorize", (req: Request, res: Response) => {
  res.redirect('/login');
});

router.get("/callback", (req: Request, res: Response) => {
  res.redirect('/login');
});

// Improved login endpoint with real Keycloak authentication
router.post("/login", async (req: Request, res: Response) => {
  let body: LoginBody;
  try {
    body = loginBodySchema.parse(req.body);
  } catch (e) {
    return res.status(400).json({ message: "Invalid request data" });
  }

  const { username, password, rememberMe = false } = body;

  console.log("[LOGIN] Authenticating user with Keycloak:", username);
  
  try {
    // Use Resource Owner Password Credentials Grant to authenticate user
    const userTokenBody = new URLSearchParams();
    userTokenBody.set("grant_type", "password");
    userTokenBody.set("client_id", keycloakConfig.KC_CLIENT_ID);
    userTokenBody.set("client_secret", keycloakConfig.KC_CLIENT_SECRET!);
    userTokenBody.set("username", username);
    userTokenBody.set("password", password);
    userTokenBody.set("scope", "openid profile email");
    
    const userTokenResponse = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body: userTokenBody.toString(),
    });
    
    if (!userTokenResponse.ok) {
      const errorText = await userTokenResponse.text();
      console.log("[LOGIN] User authentication failed:", userTokenResponse.status, errorText);
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    const userTokenData = await userTokenResponse.json();
    const userAccessToken = userTokenData.access_token;
    
    if (!userAccessToken) {
      console.log("[LOGIN] No user access token received");
      return res.status(401).json({ message: "Authentication failed" });
    }
    
    // Parse user information from the user's token
    const user = parseUserFromToken(userAccessToken);
    
    console.log("[LOGIN] SUCCESS! User authenticated:", user.username);
    
    // Store user session
    req.session.user = user;
    req.session.accessToken = userAccessToken;
    
    // Set cookie duration based on rememberMe
    if (rememberMe) {
      req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    } else {
      req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 1 day
    }
    
    console.log("[LOGIN] Session created for user:", user.username);
    
    res.json({ 
      message: "Login successful", 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email 
      } 
    });
    
  } catch (error: any) {
    console.log("[LOGIN] Authentication error:", error?.message);
    return res.status(500).json({ message: "Authentication service error" });
  }
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