/**
 * WhatsApp configuration
 */

export interface WhatsAppConfig {
  teamNumber: string;
  sessionPath: string;
  maxRetries: number;
}

function getEnvVar(key: string, required = true): string {
  const value = process.env[key];
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value ?? '';
}

export function loadWhatsAppConfig(): WhatsAppConfig {
  return {
    teamNumber: getEnvVar('WHATSAPP_TEAM_NUMBER'),
    sessionPath: getEnvVar('WHATSAPP_SESSION_PATH', false) || './whatsapp-session',
    maxRetries: parseInt(getEnvVar('WHATSAPP_MAX_RETRIES', false) || '3', 10),
  };
}

let cachedConfig: WhatsAppConfig | null = null;

export function getWhatsAppConfig(): WhatsAppConfig {
  if (!cachedConfig) {
    cachedConfig = loadWhatsAppConfig();
  }
  return cachedConfig;
}
