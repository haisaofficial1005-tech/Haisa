/**
 * NextAuth.js API route handler
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/core/auth/auth.options';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
