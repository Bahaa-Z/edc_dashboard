import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

// Keycloak JWKS Configuration
const KEYCLOAK_URL = 'https://centralidp.arena2036-x.de/auth';
const KEYCLOAK_REALM = 'CX-Central';
const KEYCLOAK_CLIENT_ID = 'CX-EDC';

const ISSUER_URL = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`;
const JWKS_URL = `${ISSUER_URL}/protocol/openid-connect/certs`;

console.log('[JWT_MIDDLEWARE] Keycloak JWKS Validation Setup:');
console.log('- Issuer:', ISSUER_URL);
console.log('- JWKS URL:', JWKS_URL);
console.log('- Client ID:', KEYCLOAK_CLIENT_ID);

// JWKS Client für Public Key Retrieval
const jwksClientInstance = jwksClient({
  jwksUri: JWKS_URL,
  requestHeaders: {},
  timeout: 30000,
});

// Function to get signing key from JWKS
const getKey = (header: any, callback: any) => {
  jwksClientInstance.getSigningKey(header.kid, (err, key) => {
    if (err) {
      console.log('[JWT] JWKS key retrieval error:', err.message);
      return callback(err);
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
};

// Interface für User im Request
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

// JWT Validation Middleware für OIDC Tokens
export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[JWT] No Bearer token provided');
    return res.status(401).json({ 
      message: 'Access token required',
      error: 'MISSING_TOKEN'
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer '

  // Validate Keycloak JWT Token via JWKS
  jwt.verify(token, getKey, {
    // Allow audience array or single value containing cx-edc
    audience: [KEYCLOAK_CLIENT_ID, 'account'], // Allow common Keycloak audiences
    issuer: ISSUER_URL,
    algorithms: ['RS256'], // Keycloak uses RS256
  }, (err: any, decoded: any) => {
    if (err) {
      console.log('[JWT] Token validation failed:', err.message);
      
      // Specific error messages für debugging
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Access token expired',
          error: 'TOKEN_EXPIRED'
        });
      }
      
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          message: 'Invalid access token',
          error: 'INVALID_TOKEN'
        });
      }

      return res.status(401).json({ 
        message: 'Token validation failed',
        error: 'VALIDATION_FAILED'
      });
    }

    // Token successfully validated
    const user = {
      id: decoded.sub || 'unknown',
      username: decoded.preferred_username || decoded.email || 'user',
      email: decoded.email || '',
      firstName: decoded.given_name,
      lastName: decoded.family_name,
    };

    req.user = user;
    console.log('[JWT] Token validated for user:', user.username);
    next();
  });
};

// Optional: Extract user info without requiring auth (for optional auth endpoints)
export const extractUser = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // Continue without user info
  }

  const token = authHeader.substring(7);

  jwt.verify(token, getKey, {
    audience: KEYCLOAK_CLIENT_ID,
    issuer: ISSUER_URL,
    algorithms: ['RS256'],
  }, (err: any, decoded: any) => {
    if (!err && decoded) {
      req.user = {
        id: decoded.sub || 'unknown',
        username: decoded.preferred_username || decoded.email || 'user',
        email: decoded.email || '',
        firstName: decoded.given_name,
        lastName: decoded.family_name,
      };
    }
    next(); // Continue regardless of token validity
  });
};