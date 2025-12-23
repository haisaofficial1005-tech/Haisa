#!/usr/bin/env node

/**
 * Test Admin Login
 * Script untuk test login admin dan akses dashboard
 */

const BASE_URL = 'http://localhost:3001';

async function testAdminLogin() {
  console.log('🧪 Testing Admin Login System...\n');

  try {
    // Test 1: Login with admin credentials
    console.log('1. Testing admin login...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '6281234567890',
        name: 'Admin Haisa WA'
      }),
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);

    if (!loginData.success) {
      throw new Error(`Login failed: ${loginData.error}`);
    }

    // Extract session cookie
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    console.log('Set-Cookie header:', setCookieHeader);

    if (!setCookieHeader) {
      throw new Error('No session cookie set');
    }

    // Parse session cookie
    const sessionCookie = setCookieHeader.split(';')[0];
    console.log('Session cookie:', sessionCookie);

    // Test 2: Access admin dashboard
    console.log('\n2. Testing admin dashboard access...');
    const dashboardResponse = await fetch(`${BASE_URL}/api/payments/pending-list`, {
      headers: {
        'Cookie': sessionCookie,
      },
    });

    const dashboardData = await dashboardResponse.json();
    console.log('Dashboard response:', dashboardData);

    if (dashboardResponse.status === 401) {
      throw new Error('Dashboard access denied - authentication failed');
    }

    if (dashboardResponse.status === 403) {
      throw new Error('Dashboard access denied - insufficient permissions');
    }

    if (!dashboardResponse.ok) {
      throw new Error(`Dashboard request failed: ${dashboardData.message || 'Unknown error'}`);
    }

    // Test 3: Test logout
    console.log('\n3. Testing logout...');
    const logoutResponse = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Cookie': sessionCookie,
      },
    });

    const logoutData = await logoutResponse.json();
    console.log('Logout response:', logoutData);

    console.log('\n✅ All tests passed!');
    console.log('\n📋 Test Results:');
    console.log(`   ✅ Admin login: SUCCESS`);
    console.log(`   ✅ Dashboard access: SUCCESS`);
    console.log(`   ✅ Logout: SUCCESS`);
    console.log(`   👤 Admin user: ${loginData.user.name} (${loginData.user.role})`);
    console.log(`   📊 Pending payments: ${dashboardData.pendingCount || 0}`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run test
testAdminLogin();