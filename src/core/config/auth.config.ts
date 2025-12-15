/**
 * Authentication configuration
 */

export interface AuthConfig {
  nextAuthUrl: string;
  nextAuthSecret: string;
  googleClientId: string;
  googleClientSecret: string;
}

function getEnvVar(key: string, required = true): string {
  const value = process.env[key];
  // Don't throw during build time
  if (required && !value && typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
    console.warn(`Warning: Missing environment variable: ${key}`);
  }
  return value ?? '';
}

export function loadAuthConfig(): AuthConfig {
  return {
    nextAuthUrl: getEnvVar('NEXTAUTH_URL', false) || 'http://localhost:3000',
    nextAuthSecret: getEnvVar('NEXTAUTH_SECRET', false) || 'development-secret',
    googleClientId: getEnvVar('GOOGLE_CLIENT_ID', false),
    googleClientSecret: getEnvVar('GOOGLE_CLIENT_SECRET', false),
  };
}

let cachedConfig: AuthConfig | null = null;

export function getAuthConfig(): AuthConfig {
  if (!cachedConfig) {
    cachedConfig = loadAuthConfig();
  }
  return cachedConfig;
}
