// server/types/express-session.d.ts
import "express-session";

declare module "express-session" {
  interface SessionData {
    user?: { id: string; username: string; name?: string; email?: string };
    accessToken?: string;
    // OAuth2 Authorization Code Flow state
    oauthState?: string;
    codeVerifier?: string;
  }
}