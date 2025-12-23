/**
 * Logout API
 * Clears session cookie
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // Clear session cookie
    const cookieStore = cookies();
    cookieStore.delete('haisa-session');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Support GET for logout links
  return POST();
}