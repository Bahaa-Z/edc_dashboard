import Keycloak from 'keycloak-js';

// Keycloak OIDC Configuration - Using CX-EDC client
const keycloakConfig = {
  url: 'https://centralidp.arena2036-x.de/auth',
  realm: 'CX-Central',
  clientId: 'CX-EDC', // User requested client
};

console.log('[KEYCLOAK] Initializing OIDC Authorization Code + PKCE Flow');
console.log('- Client ID:', keycloakConfig.clientId);
console.log('- Client Type: Public (no client secret)');
console.log('- Flow: Authorization Code + PKCE');

// Keycloak Instance (OIDC mit PKCE) - Singleton Pattern
let keycloak: Keycloak | null = null;

function getKeycloakInstance(): Keycloak {
  if (!keycloak) {
    keycloak = new Keycloak({
      url: keycloakConfig.url,
      realm: keycloakConfig.realm,
      clientId: keycloakConfig.clientId,
    });
  }
  return keycloak!; // Non-null assertion since we create it if it doesn't exist
}

// Interface für User Info
export interface KeycloakUser {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

// Keycloak Initialization State Management
let initPromise: Promise<boolean> | null = null;

// Keycloak Initialisierung mit PKCE (Singleton with Promise Caching)
export const initKeycloak = async (): Promise<boolean> => {
  // Prevent multiple initialization attempts
  if (initPromise) {
    console.log('[KEYCLOAK] Using cached initialization promise');
    return initPromise;
  }

  initPromise = (async () => {
    try {
      console.log('[KEYCLOAK] Starting OIDC initialization...');
      
      const kc = getKeycloakInstance();
      
      // Check if already initialized
      if (kc.authenticated !== undefined) {
        console.log('[KEYCLOAK] Already initialized, authenticated:', kc.authenticated);
        return kc.authenticated || false;
      }
      
      const authenticated = await kc.init({
        onLoad: 'check-sso', // Check if already logged in
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
        pkceMethod: 'S256', // PKCE mit SHA256
        flow: 'standard', // Authorization Code Flow
      });

      if (authenticated) {
        console.log('[KEYCLOAK] User already authenticated via OIDC');
        console.log('[KEYCLOAK] Access Token expires in:', kc.tokenParsed?.exp ? 
          new Date(kc.tokenParsed.exp * 1000).toLocaleString() : 'Unknown');
      } else {
        console.log('[KEYCLOAK] User not authenticated - ready for login redirect');
      }

      // Token Refresh Setup (only once)
      if (!kc.onTokenExpired) {
        kc.onTokenExpired = () => {
          console.log('[KEYCLOAK] Token expired, refreshing...');
          kc.updateToken(70).then((refreshed) => {
            if (refreshed) {
              console.log('[KEYCLOAK] Token refreshed successfully');
            } else {
              console.log('[KEYCLOAK] Token not refreshed, valid for', 
                Math.round((kc.tokenParsed?.exp || 0) + (kc.timeSkew || 0) - new Date().getTime() / 1000) + ' seconds');
            }
          }).catch(() => {
            console.log('[KEYCLOAK] Failed to refresh token, redirecting to login');
            kc.login();
          });
        };
      }

      return authenticated;
    } catch (error) {
      console.error('[KEYCLOAK] Initialization failed:', error);
      return false;
    }
  })();

  return initPromise;
};

// Login - Redirect zu Keycloak (mit Theme)
export const login = () => {
  console.log('[KEYCLOAK] Redirecting to Keycloak login page (Authorization Code + PKCE)');
  console.log('[KEYCLOAK] Current location:', window.location.href);
  
  // Use default redirect (current location) - no custom redirectUri needed
  getKeycloakInstance().login();
};

// Logout - Redirect zu Keycloak Logout
export const logout = () => {
  console.log('[KEYCLOAK] Redirecting to Keycloak logout page');
  console.log('[KEYCLOAK] Current location:', window.location.href);
  
  // Use default redirect (current location) - no custom redirectUri needed
  getKeycloakInstance().logout();
};

// Get Access Token für API Calls
export const getAccessToken = (): string | undefined => {
  return getKeycloakInstance().token;
};

// Check if authenticated
export const isAuthenticated = (): boolean => {
  return getKeycloakInstance().authenticated || false;
};

// Get User Info from Token
export const getUser = (): KeycloakUser | null => {
  const kc = getKeycloakInstance();
  if (!kc.tokenParsed) return null;

  const token = kc.tokenParsed as any;
  return {
    id: token.sub || 'unknown',
    username: token.preferred_username || token.email || 'user',
    email: token.email || '',
    firstName: token.given_name,
    lastName: token.family_name,
  };
};

// Update Token (refresh if needed)
export const updateToken = (minValidity: number = 30): Promise<boolean> => {
  return getKeycloakInstance().updateToken(minValidity);
};

// Export keycloak instance for advanced usage
export default getKeycloakInstance;