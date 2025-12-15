/**
 * Sign-in page - Redirect to WhatsApp login
 */

import { redirect } from 'next/navigation';

export default function SignInPage() {
  redirect('/login');
}
