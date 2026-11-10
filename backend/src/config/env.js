import 'dotenv/config';
import path from 'node:path';

const number = (key, fallback) => Number(process.env[key] ?? fallback);
const bool = (key, fallback) => String(process.env[key] ?? fallback) === 'true';
const required = ['MONGODB_URI', 'SESSION_SECRET'];
for (const key of required) if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);

const splitList = (val) =>
  String(val || '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: (process.env.NODE_ENV || 'development') === 'production',
  host: process.env.HOST || '0.0.0.0',
  port: number('PORT', 5000),
  prefix: process.env.API_PREFIX || '/api/v1',
  mongoUri: process.env.MONGODB_URI,
  clientOrigin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').replace(/\/$/, ''),
  clientOrigins: splitList(process.env.CLIENT_ORIGINS),
  sessionSecret: process.env.SESSION_SECRET,
  sessionName: process.env.SESSION_NAME || 'emergency.sid',
  sessionAge: number('SESSION_MAX_AGE_DAYS', 7) * 86400000,
  cookieSecure: bool('COOKIE_SECURE', false),
  cookieSameSite: process.env.COOKIE_SAME_SITE || 'lax',
  geoKey: process.env.GEOAPIFY_API_KEY,
  geoUrl: process.env.GEOAPIFY_BASE_URL || 'https://api.geoapify.com/v1',
  aiEnabled: bool('AI_ENABLED', true),
  openRouterKey: process.env.OPENROUTER_API_KEY,
  openRouterUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  openRouterModel: process.env.OPENROUTER_MODEL,
  aiTimeout: number('OPENROUTER_TIMEOUT_MS', 30000),
  duplicateRadius: number('DUPLICATE_SEARCH_RADIUS_METERS', 5000),
  duplicateHours: number('DUPLICATE_TIME_WINDOW_HOURS', 24),
  duplicateLimit: number('DUPLICATE_CANDIDATE_LIMIT', 10),
  duplicateScore: number('DUPLICATE_MIN_SCORE', 55),
  hotspotRadius: number('HOTSPOT_RADIUS_METERS', 1000),
  hotspotMin: number('HOTSPOT_MIN_INCIDENTS', 3),
  hotspotMax: number('HOTSPOT_MAX_INCIDENTS', 10000),
  uploadDir: path.resolve(process.env.UPLOAD_DIR || './uploads'),
});
