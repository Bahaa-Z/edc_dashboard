// server/auth-middleware.ts
import type { Request, Response, NextFunction } from "express";
import { isTokenValid, decodeToken } from "./token";

/**
 * Liest das HttpOnly-Cookie "edc_session", prüft das JWT
 * und hängt decoded User an req.user.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.edc_session as string | undefined;
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  if (!isTokenValid(token)) return res.status(401).json({ message: "Token expired/invalid" });

  const decoded = decodeToken<Record<string, any>>(token);
  if (!decoded) return res.status(401).json({ message: "Invalid token" });

  (req as any).user = {
    id: decoded.preferred_username || decoded.sub || "user",
    email: decoded.email,
  };
  next();
}