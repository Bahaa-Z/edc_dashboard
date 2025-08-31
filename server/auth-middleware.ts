// server/auth-middleware.ts
import type { Request, Response, NextFunction } from "express";
import { isTokenValid, decodeToken } from "./token";

/**
 * Liest das HttpOnly-Cookie "edc_session", prüft das JWT
 * und hängt decoded User an req.user.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.edc_session as string | undefined;
  
  if (!token) {
    return res.status(401).json({ message: "Unauthorized - No session token" });
  }
  
  if (!isTokenValid(token)) {
    // Clear invalid cookie
    res.clearCookie("edc_session");
    return res.status(401).json({ message: "Token expired or invalid" });
  }

  const decoded = decodeToken<Record<string, any>>(token);
  if (!decoded) {
    res.clearCookie("edc_session");
    return res.status(401).json({ message: "Invalid token format" });
  }

  // Add user to request for use in route handlers
  (req as any).user = {
    id: decoded.preferred_username || decoded.sub || "user",
    username: decoded.preferred_username || "user",
    email: decoded.email,
  };
  
  next();
}