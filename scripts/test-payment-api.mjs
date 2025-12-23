/**
 * Test Payment API
 * Script untuk test API create payment
 */

async function testPaymentAPI() {
  try {
    const ticketId = '1e1565c0-cea6-4558-8ea1-ddac1756089d'; // WAC-2025-000004
    console.log(`🧪 Testing Payment API untuk ticket: ${ticketId}`);

    const response = await fetch('http://localhost:3000/api/payments/create', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        // Note: Dalam test ini kita tidak bisa authenticate, tapi bisa lihat error response
      },
      body: JSON.stringify({ ticketId }),
    });

    const data = await response.json();
    
    console.log(`📊 Response Status: ${response.status}`);
    console.log(`📊 Response Data:`, JSON.stringify(data, null, 2));

    if (data.qrisUniqueCode) {
      console.log(`✅ QRIS Unique Code: ${data.qrisUniqueCode}`);
    } else {
      console.log(`❌ QRIS Unique Code tidak ditemukan dalam response`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
testPaymentAPI();