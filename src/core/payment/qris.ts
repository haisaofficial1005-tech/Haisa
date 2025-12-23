/**
 * QRIS Payment Utilities
 * Generate unique code for QRIS payments
 */

/**
 * Generate 3 digit unique code for QRIS payment
 * Returns a random number between 100-999 (always 3 digits)
 */
export function generateQrisUniqueCode(): string {
  // Generate random 3 digit number (100-999)
  const min = 100;
  const max = 999;
  const code = Math.floor(Math.random() * (max - min + 1)) + min;
  return code.toString();
}

/**
 * Calculate QRIS amount with unique code
 * @param baseAmount - Base amount in IDR (e.g., 50000)
 * @param uniqueCode - 2-3 digit unique code (e.g., "123")
 * @returns Total amount with unique code (e.g., 50123)
 */
export function calculateQrisAmount(baseAmount: number, uniqueCode: string): number {
  return baseAmount + parseInt(uniqueCode, 10);
}

/**
 * Format amount to IDR currency
 */
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get base price for Gmail sale (fixed at 50k for now)
 */
export function getGmailSaleBasePrice(): number {
  return 50000; // 50k IDR
}
