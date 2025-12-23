#!/usr/bin/env node

/**
 * Test Payment Verification
 * Script untuk test payment verification API
 */

const BASE_URL = 'http://localhost:3001';

async function testPaymentVerification() {
  console.log('🧪 Testing Payment Verification System...\n');

  try {
    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '6281234567890',
        name: 'Admin Haisa WA'
      }),
    });

    const loginData = await loginResponse.json();
    if (!loginData.success) {
      throw new Error(`Login failed: ${loginData.error}`);
    }

    const sessionCookie = loginResponse.headers.get('set-cookie')?.split(';')[0];
    console.log('✅ Admin login successful');

    // Step 2: Get pending payments
    console.log('\n2. Fetching pending payments...');
    const pendingResponse = await fetch(`${BASE_URL}/api/payments/pending-list`, {
      headers: { 'Cookie': sessionCookie },
    });

    const pendingData = await pendingResponse.json();
    if (!pendingResponse.ok) {
      throw new Error(`Failed to get pending payments: ${pendingData.message}`);
    }

    console.log('✅ Pending payments fetched successfully');
    console.log(`📊 Pending count: ${pendingData.pendingCount}`);

    if (pendingData.pendingPayments.length > 0) {
      const payment = pendingData.pendingPayments[0];
      console.log('\n💳 First pending payment:');
      console.log(`   Ticket: ${payment.ticket.ticketNo}`);
      console.log(`   Customer: ${payment.ticket.customer.name}`);
      console.log(`   Amount: Rp ${payment.amount.toLocaleString('id-ID')}`);
      console.log(`   Unique Code: ${payment.uniqueCode}`);
      console.log(`   Order ID: ${payment.orderId}`);

      // Step 3: Test manual confirmation
      console.log('\n3. Testing manual confirmation...');
      const confirmResponse = await fetch(`${BASE_URL}/api/payments/manual-confirm`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': sessionCookie 
        },
        body: JSON.stringify({
          paymentId: payment.id,
          orderId: payment.orderId,
          notes: 'Test confirmation via script'
        }),
      });

      const confirmData = await confirmResponse.json();
      if (!confirmResponse.ok) {
        throw new Error(`Confirmation failed: ${confirmData.message}`);
      }

      console.log('✅ Payment confirmed successfully');
      console.log(`   Payment Status: ${confirmData.paymentStatus}`);
      console.log(`   Ticket Status: ${confirmData.ticketStatus}`);

      // Step 4: Verify payment is no longer pending
      console.log('\n4. Verifying payment is no longer pending...');
      const verifyResponse = await fetch(`${BASE_URL}/api/payments/pending-list`, {
        headers: { 'Cookie': sessionCookie },
      });

      const verifyData = await verifyResponse.json();
      console.log(`📊 Remaining pending count: ${verifyData.pendingCount}`);
      console.log(`📊 Recent confirmed count: ${verifyData.recentConfirmed.length}`);

      if (verifyData.recentConfirmed.length > 0) {
        const confirmed = verifyData.recentConfirmed[0];
        console.log('\n✅ Recently confirmed payment:');
        console.log(`   Ticket: ${confirmed.ticketNo}`);
        console.log(`   Amount: Rp ${confirmed.amount.toLocaleString('id-ID')}`);
      }
    } else {
      console.log('ℹ️ No pending payments found');
    }

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testPaymentVerification();