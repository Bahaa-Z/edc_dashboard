// server/token.ts
import { jwtDecode } from "jwt-decode";

export interface PasswordTokenParams {
  tokenUrl: string;
  clientId: string;
  clientSecret?: string; // optional für Public-Clients
  username: string;
  password: string;
  scope?: string;
}

/**
 * Holt ein Access-Token per Resource Owner Password Credentials Grant.
 * Funktioniert mit Public-Client (ohne Secret) und mit Confidential-Client (mit Secret).
 */
export async function getPasswordToken(params: PasswordTokenParams): Promise<string> {
  const { tokenUrl, clientId, clientSecret, username, password, scope } = params;

  const body = new URLSearchParams();
  body.set("grant_type", "password");
  body.set("client_id", clientId);
  if (clientSecret && clientSecret.trim() !== "") {
    body.set("client_secret", clientSecret);
  }
  body.set("username", username);
  body.set("password", password);
  if (scope) body.set("scope", scope);

  // Debug: Log the request parameters (without sensitive data)
  console.log("[TOKEN] Request parameters:");
  console.log("- grant_type: password");
  console.log("- client_id:", clientId);
  console.log("- username:", username);
  console.log("- scope:", scope);
  console.log("- has_password:", !!password);
  console.log("- has_client_secret:", !!clientSecret);

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(), // <- string ist ein gültiger Body
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[TOKEN] KC response", res.status, text);
    throw new Error(text || `Token endpoint returned ${res.status}`);
  }

  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("No access_token in response");
  return json.access_token;
}

export function decodeToken<T = unknown>(token: string): T | null {
  try {
    return jwtDecode<T>(token);
  } catch {
    return null;
  }
}

export function isTokenValid(token: string): boolean {
  const decoded = decodeToken<{ exp?: number }>(token);
  if (!decoded?.exp) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  return decoded.exp > nowSec + 40; // 40s Puffer
}