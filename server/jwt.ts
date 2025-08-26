import { expressjwt as jwt } from "express-jwt";
import jwks from "jwks-rsa";

const ISSUER = "https://centralidp.arena2036-x.de/auth/realms/CX-Central"; // 👈 gleich wie SDE

export const jwtCheck = jwt({
  secret: jwks.expressJwtSecret({
    jwksUri: `${ISSUER}/protocol/openid-connect/certs`,
    cache: true,
    rateLimit: true,
  }) as any,
  issuer: ISSUER,
  algorithms: ["RS256"],
});