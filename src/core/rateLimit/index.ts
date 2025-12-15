/**
 * Rate Limiting Module
 * Requirements: 12.1
 */

export {
  checkRateLimit,
  recordRequest,
  rateLimitMiddleware,
  createRateLimitHeaders,
  resetRateLimit,
  clearAllRateLimits,
  getRateLimitStatus,
  DEFAULT_RATE_LIMIT,
  type RateLimitConfig,
  type RateLimitResult,
} from './rateLimit';
