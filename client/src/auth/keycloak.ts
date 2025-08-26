// client/src/auth/keycloak.ts
import Keycloak, { type KeycloakConfig } from "keycloak-js";

const KC_URL = import.meta.env.VITE_KEYCLOAK_URL ?? "https://centralidp.arena2036-x.de/auth";
const KC_REALM = import.meta.env.VITE_KEYCLOAK_REALM ?? "CX-Central";
const KC_CLIENT = import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? "EDC-MC";

const keycloakConfig: KeycloakConfig = {
  url: KC_URL,
  realm: KC_REALM,
  clientId: KC_CLIENT,
};

export const keycloak = new Keycloak(keycloakConfig);

let keycloakInitialized = false;

export async function initKeycloak(): Promise<boolean> {
  if (keycloakInitialized) {
    return keycloak.authenticated || false;
  }
  
  try {
    const authenticated = await keycloak.init({
      onLoad: "check-sso",
      pkceMethod: "S256", 
      checkLoginIframe: false,
      enableLogging: false, // Reduce console noise
      redirectUri: window.location.origin + window.location.pathname,
    });
    keycloakInitialized = true;
    return authenticated;
  } catch (error) {
    console.error('Keycloak init error:', error);
    keycloakInitialized = true; // Mark as initialized to prevent retries
    return false;
  }
}

export function login() {
  return keycloak.login();
}
export function logout() {
  return keycloak.logout();
}
export function getToken() {
  return keycloak.token ?? undefined;
}
export function updateToken(minValiditySeconds = 30) {
  return keycloak.updateToken(minValiditySeconds);
}
export function hasRealmRole(role: string) {
  return keycloak.hasRealmRole(role);
}
export function getUserProfile() {
  const t = keycloak.tokenParsed as Record<string, any> | undefined;
  return {
    username: t?.preferred_username,
    name: t?.name,
    email: t?.email,
    organisation: t?.organisation,
    bpn: t?.bpn,
    tenant: t?.tenant,
  };
}

// Auto-Refresh
keycloak.onTokenExpired = () => {
  updateToken(60).catch(() => login());
};