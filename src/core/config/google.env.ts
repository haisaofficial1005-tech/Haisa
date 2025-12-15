/**
 * Google-related environment variables loader
 */

export interface GoogleEnvConfig {
  // OAuth
  clientId: string;
  clientSecret: string;
  
  // Service Account
  serviceAccountEmail: string;
  serviceAccountPrivateKey: string;
  
  // Drive
  driveRootFolderId: string;
  
  // Apps Script
  appsScriptUrl: string;
  syncSecret: string;
}

function getEnvVar(key: string): string {
  return process.env[key] ?? '';
}

export function loadGoogleEnv(): GoogleEnvConfig {
  return {
    clientId: getEnvVar('GOOGLE_CLIENT_ID'),
    clientSecret: getEnvVar('GOOGLE_CLIENT_SECRET'),
    serviceAccountEmail: getEnvVar('GOOGLE_SERVICE_ACCOUNT_EMAIL'),
    serviceAccountPrivateKey: getEnvVar('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY'),
    driveRootFolderId: getEnvVar('GOOGLE_DRIVE_ROOT_FOLDER_ID'),
    appsScriptUrl: getEnvVar('GOOGLE_APPS_SCRIPT_URL'),
    syncSecret: getEnvVar('GOOGLE_SYNC_SECRET'),
  };
}

let cachedConfig: GoogleEnvConfig | null = null;

export function getGoogleEnv(): GoogleEnvConfig {
  if (!cachedConfig) {
    cachedConfig = loadGoogleEnv();
  }
  return cachedConfig;
}
