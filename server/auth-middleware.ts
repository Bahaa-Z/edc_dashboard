// server/auth-middleware.ts - EINFACH Session-based Auth
import type { Request, Response, NextFunction } from "express";

// Simple session-based auth middleware
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = req.session as any;
  
  if (!session.user) {
    console.log("[AUTH] No user session - redirect to login");
    return res.status(401).json({ 
      message: "Authentication required",
      redirect: "/api/auth/login"
    });
  }
  
  // Add user to request
  (req as any).user = session.user;
  console.log("[AUTH] User authenticated:", session.user.username);
  next();
}