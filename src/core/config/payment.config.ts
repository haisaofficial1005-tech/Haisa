/**
 * Payment gateway configuration
 */

export type PaymentProviderType = 'midtrans' | 'yukk';

export interface PaymentConfig {
  provider: PaymentProviderType;
  // Midtrans config
  serverKey: string;
  clientKey: string;
  isProduction: boolean;
  // Yukk config
  yukkClientId: string;
  yukkClientSecret: string;
  yukkApiKey: string;
  // Common
  amount: number;
  currency: string;
}

function getEnvVar(key: string): string {
  return process.env[key] ?? '';
}

export function loadPaymentConfig(): PaymentConfig {
  const provider = getEnvVar('PAYMENT_PROVIDER') || 'yukk';

  return {
    provider: provider as PaymentProviderType,
    // Midtrans
    serverKey: getEnvVar('MIDTRANS_SERVER_KEY'),
    clientKey: getEnvVar('MIDTRANS_CLIENT_KEY'),
    isProduction: getEnvVar('PAYMENT_IS_PRODUCTION') === 'true',
    // Yukk
    yukkClientId: getEnvVar('YUKK_CLIENT_ID'),
    yukkClientSecret: getEnvVar('YUKK_CLIENT_SECRET'),
    yukkApiKey: getEnvVar('YUKK_API_KEY'),
    // Common
    amount: parseInt(getEnvVar('PAYMENT_AMOUNT') || '49500', 10),
    currency: getEnvVar('PAYMENT_CURRENCY') || 'IDR',
  };
}

let cachedConfig: PaymentConfig | null = null;

export function getPaymentConfig(): PaymentConfig {
  if (!cachedConfig) {
    cachedConfig = loadPaymentConfig();
  }
  return cachedConfig;
}

// Alias for backward compatibility - use getPaymentConfig() instead
export { getPaymentConfig as paymentConfig };
