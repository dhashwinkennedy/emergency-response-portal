import { env } from '../config/env.js';

/**
 * Checks whether an IPv4 string is within private or loopback ranges:
 * - 127.0.0.0/8 (Loopback)
 * - 10.0.0.0/8 (Private Class A)
 * - 172.16.0.0/12 (Private Class B: 172.16.0.0 - 172.31.255.255)
 * - 192.168.0.0/16 (Private Class C)
 * - 169.254.0.0/16 (Link-local / APIPA / Mobile Hotspots)
 */
export function isPrivateIPv4(ip) {
  if (typeof ip !== 'string') return false;
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => isNaN(n) || n < 0 || n > 255)) {
    return false;
  }
  const [a, b] = parts;
  if (a === 127) return true;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  return false;
}

/**
 * Determines whether a requesting origin is permitted.
 *
 * Rules:
 * - If no origin is provided (server-to-server, curl, same-origin), it is allowed.
 * - If the origin matches CLIENT_ORIGIN or any entry in CLIENT_ORIGINS, it is allowed (in both dev & prod).
 * - In production: Only explicitly configured trusted origins are permitted.
 * - In development: Any origin with hostname localhost, 127.0.0.1, IPv6 loopback (::1, [::1]),
 *   or any private IPv4 network address is permitted on any port.
 */
export function isAllowedOrigin(origin, isProduction = env.isProduction) {
  if (!origin) return true;

  const normalized = String(origin).trim().replace(/\/$/, '');

  const configured = [
    env.clientOrigin,
    ...(env.clientOrigins || []),
  ].map((o) => String(o).trim().replace(/\/$/, '')).filter(Boolean);

  if (configured.includes(normalized)) {
    return true;
  }

  // In production, require explicitly configured origins
  if (isProduction) {
    return false;
  }

  // In development, allow localhost, 127.0.0.1, and private LAN/hotspot IPs
  try {
    const url = new URL(normalized);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }
    const host = url.hostname.toLowerCase();

    if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]') {
      return true;
    }

    if (isPrivateIPv4(host)) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export const corsOptions = {
  origin: (origin, callback) => {
    callback(null, isAllowedOrigin(origin));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
};
