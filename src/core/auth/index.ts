/**
 * Authentication module exports
 */

export { authOptions, createAuthOptions } from './auth.options';
export {
  getSession,
  getCurrentUser,
  isAuthenticated,
  hasRole,
  isAdmin,
  isAgentOrAdmin,
} from './session';
export { SessionProvider } from './SessionProvider';
export {
  findOrCreateUser,
  createInMemoryUserRepository,
  type GoogleUserData,
  type AuthenticatedUser,
  type UserRepository,
  type UserRole,
} from './user.service';
