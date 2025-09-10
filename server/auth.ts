// server/auth.ts - Password Grant Flow ohne Redirect
import express, { type Request, type Response } from "express";
import { Issuer, Client } from "openid-client";

const router = express.Router();

// Keycloak Config
const keycloakConfig = {
  KC_URL: "https://centralidp.arena2036-x.de/auth",
  KC_REALM: "CX-Central", 
  KC_CLIENT_ID: "CX-EDC",
  KC_CLIENT_SECRET: "kwe2FC3EXDPUuUEoVhI6igUnRAmzkuwN"
};

console.log("[AUTH] Keycloak Client ID:", keycloakConfig.KC_CLIENT_ID);

let keycloakClient: Client;

// Initialize Keycloak Client
async function initKeycloak() {
  try {
    const keycloakIssuer = await Issuer.discover(
      `${keycloakConfig.KC_URL}/realms/${keycloakConfig.KC_REALM}`
    );

    keycloakClient = new keycloakIssuer.Client({
      client_id: keycloakConfig.KC_CLIENT_ID,
      client_secret: keycloakConfig.KC_CLIENT_SECRET,
    });

    console.log("[AUTH] ✅ Keycloak Client initialized for Password Grant");
    return keycloakClient;
  } catch (error: any) {
    console.error("[AUTH] Keycloak init failed:", error.message);
    throw error;
  }
}

// Initialize on startup
initKeycloak().catch(console.error);

// PASSWORD GRANT LOGIN - ohne Redirect!
router.post("/login", async (req: Request, res: Response) => {
  const { username, password, isDemo } = req.body;

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

  // Keycloak Password Grant
  if (!username || !password) {
    return res.status(400).json({ 
      success: false,
      message: "Username and password are required" 
    });
  }

  if (!keycloakClient) {
    return res.status(500).json({ 
      success: false,
      message: "Keycloak not initialized" 
    });
  }

  try {
    console.log("[LOGIN] Attempting Keycloak password grant for:", username);

    // Get token with Password Grant
    const tokenSet = await keycloakClient.grant({
      grant_type: 'password',
      username: username,
      password: password,
      scope: 'openid profile email'
    });

    if (!tokenSet.access_token) {
      return res.status(401).json({ 
        success: false,
        message: "No access token received" 
      });
    }

    // Get user info
    const userInfo = await keycloakClient.userinfo(tokenSet.access_token);
    
    const user = {
      id: userInfo.sub,
      username: userInfo.preferred_username || userInfo.email || username,
      email: userInfo.email,
      name: userInfo.name
    };

    // Store in session
    (req.session as any).user = {
      ...user,
      tokenSet: tokenSet
    };

    console.log("[LOGIN] ✅ Keycloak login successful:", user.username);

    res.json({
      success: true,
      user: user,
      token: tokenSet.access_token,
      message: "Login successful"
    });

  } catch (error: any) {
    console.log("[LOGIN] Keycloak login failed:", error.message);
    
    return res.status(401).json({ 
      success: false,
      message: "Invalid username or password",
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
router.post("/logout", (req: Request, res: Response) => {
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