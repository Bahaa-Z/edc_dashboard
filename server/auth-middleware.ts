// server/auth-middleware.ts
import type { Request, Response, NextFunction } from "express";
import { isTokenValid, decodeToken } from "./token";

/**
 * Checks session-based authentication using Express session
 * and attaches user data from session to req.user.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Check if user is logged in via session (created by /api/auth/login)
  if (!req.session.user) {
    return res.status(401).json({ message: "Unauthorized - No active session" });
  }

  // Use the user data from the session (the real user, not service account)
  (req as any).user = req.session.user;
  
  next();
}