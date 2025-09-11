// client/src/auth/keycloak.ts
// REMOVED: All keycloak-js dependencies removed as per requirements
// Authentication is now handled via backend Password Grant flow

// Dummy exports to prevent import errors during cleanup
export function initKeycloak(): Promise<boolean> {
  return Promise.resolve(false);
}

export function login() {
  return Promise.resolve();
}

export function logout() {
  return Promise.resolve();
}

export function getToken() {
  return undefined;
}

export function updateToken() {
  return Promise.resolve(true);
}

export function hasRealmRole(): boolean {
  return false;
}

export function getUserProfile() {
  return {};
}

export const keycloak = {
  authenticated: false,
  token: null,
  subject: null,
};