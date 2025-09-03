// server/auth-middleware.ts - JWT Resource Server Middleware (SDE Style)
import type { Request, Response, NextFunction } from "express";
import { validateJWT } from "./auth";

/**
 * JWT Authentication Middleware (like SDE backend)
 * Validates JWT tokens from Authorization header instead of sessions
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Use JWT validation instead of session-based auth
  validateJWT(req, res, next);
}