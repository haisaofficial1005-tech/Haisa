/**
 * NextAuth.js configuration options
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

import { PrismaAdapter } from '@auth/prisma-adapter';
import { type NextAuthOptions } from 'next-auth';
import { type Adapter } from 'next-auth/adapters';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/core/db';
import { getAuthConfig } from '@/core/config/auth.config';

/**
 * Extended session type to include user role
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
      role: string;
    };
  }

  interface User {
    role: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
  }
}

/**
 * Creates NextAuth options with Google provider
 * Implements Requirements 1.1, 1.2, 1.3, 1.4
 */
export function createAuthOptions(): NextAuthOptions {
  const config = getAuthConfig();

  return {
    adapter: PrismaAdapter(prisma) as Adapter,
    providers: [
      GoogleProvider({
        clientId: config.googleClientId,
        clientSecret: config.googleClientSecret,
      }),
    ],
    callbacks: {
      /**
       * Sign-in callback - creates or retrieves user profile
       * Requirement 1.2: Create or retrieve customer profile on successful auth
       */
      async signIn({ user }) {
        if (!user.email) {
          return false;
        }
        return true;
      },

      /**
       * Session callback - adds user role to session
       * Requirement 1.2: Establish session with user data
       */
      async session({ session, user }) {
        if (session.user) {
          session.user.id = user.id;
          session.user.role = user.role;
        }
        return session;
      },

      /**
       * Redirect callback - handles post-auth redirects
       * Requirement 1.1, 1.4: Handle redirects after auth actions
       */
      async redirect({ url, baseUrl }) {
        // Allow relative URLs
        if (url.startsWith('/')) {
          return `${baseUrl}${url}`;
        }
        // Allow URLs on the same origin
        if (new URL(url).origin === baseUrl) {
          return url;
        }
        return baseUrl;
      },
    },
    pages: {
      signIn: '/auth/signin',
      error: '/auth/error',
    },
    session: {
      strategy: 'database',
    },
    secret: config.nextAuthSecret,
  };
}

export const authOptions = createAuthOptions();
