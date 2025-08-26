// client/src/auth/keycloak.ts
export async function initKeycloak(): Promise<boolean> {
    return false; // nie direkt über keycloak-js authentifizieren
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
  export function updateToken(_minValiditySeconds = 30) {
    return Promise.resolve(true);
  }
  export function hasRealmRole(_role: string) {
    return false;
  }
  export function getUserProfile() {
    return {};
  }