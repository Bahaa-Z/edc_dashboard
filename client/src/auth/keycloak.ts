// client/src/auth/keycloak.ts
import Keycloak, { KeycloakConfig, KeycloakInitOptions } from 'keycloak-js';

// Keycloak Configuration for Central IDP
const keycloakConfig: KeycloakConfig = {
  url: 'https://centralidp.arena2036-x.de/auth',
  realm: 'CX-Central',
  clientId: 'CX-EDC',
};

// Initialize Keycloak with Authorization Code + PKCE
const keycloakInitOptions: KeycloakInitOptions = {
  onLoad: 'check-sso', // or 'login-required' for automatic login
  flow: 'standard', // Authorization Code Flow
  pkceMethod: 'S256', // PKCE with SHA256
  checkLoginIframe: false, // Disable iframe checks for better compatibility
  silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
};

// Create Keycloak instance
export const keycloak = new Keycloak(keycloakConfig);

// Initialize Keycloak
export async function initKeycloak(): Promise<boolean> {
  try {
    console.log('[KEYCLOAK] Initializing with Central IDP...');
    const authenticated = await keycloak.init(keycloakInitOptions);
    
    if (authenticated) {
      console.log('[KEYCLOAK] User authenticated:', keycloak.subject);
      console.log('[KEYCLOAK] Token expires in:', keycloak.tokenParsed?.exp);
    } else {
      console.log('[KEYCLOAK] User not authenticated');
    }
    
    return authenticated;
  } catch (error) {
    console.error('[KEYCLOAK] Failed to initialize:', error);
    return false;
  }
}

// Login function
export function login(): Promise<void> {
  return keycloak.login({
    redirectUri: window.location.origin,
  });
}

// Logout function
export function logout(): Promise<void> {
  return keycloak.logout({
    redirectUri: window.location.origin,
  });
}

// Get current access token
export function getToken(): string | undefined {
  return keycloak.token;
}

// Update token (refresh if needed)
export async function updateToken(minValidity: number = 30): Promise<boolean> {
  try {
    const refreshed = await keycloak.updateToken(minValidity);
    if (refreshed) {
      console.log('[KEYCLOAK] Token refreshed');
    }
    return true;
  } catch (error) {
    console.error('[KEYCLOAK] Failed to refresh token:', error);
    return false;
  }
}

// Check if user has realm role
export function hasRealmRole(role: string): boolean {
  return keycloak.hasRealmRole(role);
}

// Get user profile
export function getUserProfile() {
  return keycloak.tokenParsed || {};
}

// Get user info
export async function getUserInfo() {
  try {
    if (keycloak.authenticated) {
      return await keycloak.loadUserInfo();
    }
    return null;
  } catch (error) {
    console.error('[KEYCLOAK] Failed to load user info:', error);
    return null;
  }
}

// Setup token refresh intervals
export function setupTokenRefresh() {
  // Refresh token every 10 minutes
  setInterval(async () => {
    if (keycloak.authenticated) {
      await updateToken(60); // Refresh if expires in 1 minute
    }
  }, 10 * 60 * 1000);
}

export default keycloak;