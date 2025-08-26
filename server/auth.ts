// server/auth.ts
import express, { type Request, type Response } from "express";
import { z } from "zod";
import { getPasswordToken, decodeToken, isTokenValid } from "./token";

const router = express.Router();

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

  // ENV robust lesen + prüfen
  const tokenUrl = (process.env.KC_TOKEN_URL || "").trim();
  const clientId = (process.env.KC_CLIENT_ID || "").trim();
  // Public-Client → Secret kann leer sein -> zu undefined normalisieren
  const clientSecret = ((process.env.KC_CLIENT_SECRET || "").trim() || undefined) as
    | string
    | undefined;

  if (!tokenUrl || !clientId) {
    return res.status(500).json({ message: "Keycloak config missing on server." });
  }
  if (!clientId) {
    return res.status(500).json({ message: "KC_CLIENT_ID missing on server" });
  }

  try {
    // Password Grant gegen Keycloak
    const accessToken = await getPasswordToken({
      tokenUrl,
      clientId,
      //clientSecret?, // optional
      username,
      password,
      scope: "openid",
    });
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

export default router;