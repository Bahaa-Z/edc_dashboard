// server/cors-config.ts
import type { CorsOptions, CorsOptionsDelegate, CorsRequest } from "cors";

const DEFAULT_ALLOWED = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3001",
  "http://localhost:3030",
];

export function buildCorsOptions(): CorsOptions | CorsOptionsDelegate<CorsRequest> {
  // Allowed Origins aufbauen (ohne über ein Set zu iterieren)
  const allowedSet = new Set(DEFAULT_ALLOWED);
  const extra = (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  extra.forEach((o) => allowedSet.add(o)); // kein for..of über Set

  const allowAll = process.env.CORS_ALLOW_ALL === "true";

  const delegate: CorsOptionsDelegate<CorsRequest> = (req, cb) => {
    const originHeader = (req.headers?.origin as string | undefined) ?? undefined;

    // Wenn komplett offen gewünscht
    if (allowAll) {
      return cb(null, {
        origin: true,
        credentials: true,
      });
    }

    // Ohne Origin-Header (z.B. Curl/Healthcheck): erlaube die Whitelist-Liste explizit
    if (!originHeader) {
      return cb(null, {
        origin: Array.from(allowedSet),
        credentials: true,
      });
    }

    // Check Whitelist
    if (allowedSet.has(originHeader)) {
      return cb(null, {
        origin: true,
        credentials: true,
      });
    }

    // Nicht erlaubt
    return cb(null, { origin: false });
  };

  return delegate;
}