// client/src/auth/keycloak.ts
import Keycloak from "keycloak-js";
const KeycloakCtor: any = (Keycloak as any)?.default ?? (Keycloak as any) ?? Keycloak;

// Fallback-Konfiguration (aus ENV in Vite extrahieren, falls gewünscht)
const keycloakConfig = {
  url: "https://centralidp.arena2036-x.de/auth",
  realm: "CX-Central",
  clientId: "CX-EDC",
};

// Singleton-Instanz
let keycloak: any | null = null;

// Promise zum Caching der Initialisierung
let initPromise: Promise<boolean> | null = null;

// Hilfsfunktion: ist Browser vorhanden?
function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

// Sichere Instanz-Beschaffung (mit Interop- und SSR-Schutz)
function getKeycloakInstance(): any {
  // In SSR/Node-Umgebungen kein Keycloak erzeugen
  if (!isBrowser()) {
    console.warn("[KEYCLOAK] Kein Browser-Kontext (SSR/Node) – Instanz wird nicht erstellt.");
    return null;
    // Hinweis: In SSR sollte man Keycloak nur clientseitig initialisieren.
  }

  if (!keycloak) {
    if (typeof KeycloakCtor !== "function") {
      console.error("[KEYCLOAK] Keycloak-Konstruktor ist nicht verfügbar (Import/Interop-Problem).");
      return null;
    }
    keycloak = new KeycloakCtor({
      url: keycloakConfig.url,
      realm: keycloakConfig.realm,
      clientId: keycloakConfig.clientId,
    });
  }
  return keycloak;
}

// Typdefinition (optional)
export interface KeycloakUser {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

// Initialisierung (PKCE) mit Caching
export const initKeycloak = async (): Promise<boolean> => {
  if (!isBrowser()) return false;

  if (initPromise) {
    console.log("[KEYCLOAK] Verwende gecachte Initialisierung.");
    return initPromise;
  }

  initPromise = (async () => {
    try {
      console.log("[KEYCLOAK] Starte OIDC-Initialisierung...");
      const kc = getKeycloakInstance();
      if (!kc) {
        console.error("[KEYCLOAK] Keine Instanz – Abbruch.");
        return false;
      }

      // Bereits initialisiert?
      if (kc.authenticated !== undefined) {
        console.log("[KEYCLOAK] Bereits initialisiert, authenticated:", kc.authenticated);
        return Boolean(kc.authenticated);
      }

      const authenticated = await kc.init({
        onLoad: "check-sso",
        silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
        pkceMethod: "S256",
        flow: "standard",
      });

      if (authenticated) {
        console.log("[KEYCLOAK] Benutzer authentifiziert.");
      } else {
        console.log("[KEYCLOAK] Nicht authentifiziert – Login möglich.");
      }

      // Token-Refresh nur einmal setzen
      if (!kc.onTokenExpired) {
        kc.onTokenExpired = () => {
          console.log("[KEYCLOAK] Token abgelaufen – aktualisiere...");
          kc.updateToken(70)
            .then((refreshed: boolean) => {
              if (refreshed) console.log("[KEYCLOAK] Token aktualisiert.");
              else console.log("[KEYCLOAK] Token noch gültig – keine Aktualisierung nötig.");
            })
            .catch(() => {
              console.log("[KEYCLOAK] Aktualisierung fehlgeschlagen – leite zum Login um.");
              // Vorsicht: Nur im Browser aufrufen
              if (typeof kc.login === "function") kc.login();
            });
        };
      }

      return Boolean(authenticated);
    } catch (err) {
      console.error("[KEYCLOAK] Initialisierung fehlgeschlagen:", err);
      return false;
    }
  })();

  return initPromise;
};

// Login (sicher, wartet auf Initialisierung)
export const login = async () => {
  if (!isBrowser()) return;
  const kc = getKeycloakInstance();
  if (!kc || typeof kc.login !== "function") {
    console.error("[KEYCLOAK] login() nicht verfügbar – prüfe Import/Version.");
    return;
  }
  // Optional: vor Login initialisieren
  await initKeycloak();
  kc.login(); // redirectUri standardmäßig aktuelle URL
};

// Logout (sicher, wartet auf Initialisierung)
export const logout = async () => {
  if (!isBrowser()) return;
  const kc = getKeycloakInstance();
  if (!kc || typeof kc.logout !== "function") {
    console.error("[KEYCLOAK] logout() nicht verfügbar – prüfe Import/Version.");
    return;
  }
  // Optional: vor Logout initialisieren
  await initKeycloak();
  kc.logout(); // redirectUri standardmäßig aktuelle URL
};

// Access Token abrufen
export const getAccessToken = (): string | undefined => {
  const kc = getKeycloakInstance();
  return kc?.token;
};

// Ist Benutzer authentifiziert?
export const isAuthenticated = (): boolean => {
  const kc = getKeycloakInstance();
  return Boolean(kc?.authenticated);
};

// Benutzer-Infos aus dem Token
export const getUser = (): KeycloakUser | null => {
  const kc = getKeycloakInstance();
  const token = kc?.tokenParsed as any;
  if (!token) return null;
  return {
    id: token.sub || "unknown",
    username: token.preferred_username || token.email || "user",
    email: token.email || "",
    firstName: token.given_name,
    lastName: token.family_name,
  };
};

// Token aktualisieren (z. B. in API-Helpern)
export const updateToken = (minValidity: number = 30): Promise<boolean> => {
  const kc = getKeycloakInstance();
  return kc?.updateToken ? kc.updateToken(minValidity) : Promise.resolve(false);
};

export default getKeycloakInstance;