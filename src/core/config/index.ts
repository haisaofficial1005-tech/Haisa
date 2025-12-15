/**
 * Configuration module exports
 */

export * from './auth.config';
export * from './google.env';
export * from './payment.config';
export * from './whatsapp.config';

/**
 * App-wide configuration
 */
export interface AppConfig {
  appUrl: string;
  rateLimitMaxRequests: number;
  rateLimitWindowMs: number;
}

function getEnvVar(key: string, required = true): string {
  const value = process.env[key];
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value ?? '';
}

export function loadAppConfig(): AppConfig {
  return {
    appUrl: getEnvVar('APP_URL', false) || 'http://localhost:3000',
    rateLimitMaxRequests: parseInt(getEnvVar('RATE_LIMIT_MAX_REQUESTS', false) || '5', 10),
    rateLimitWindowMs: parseInt(getEnvVar('RATE_LIMIT_WINDOW_MS', false) || '3600000', 10),
  };
}

let cachedAppConfig: AppConfig | null = null;

export function getAppConfig(): AppConfig {
  if (!cachedAppConfig) {
    cachedAppConfig = loadAppConfig();
  }
  return cachedAppConfig;
}
