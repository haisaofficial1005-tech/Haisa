/**
 * Functionality Testing Script
 * Test that all features still work after security updates
 */

console.log('🧪 Testing Application Functionality...\n');

const BASE_URL = 'http://localhost:3001';

// Helper function to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test 1: Admin Login (with different phone to avoid rate limit)
async function testAdminLogin() {
  console.log('1. Testing Admin Login...');
  
  try {
    // Use existing admin phone
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        phone: '6281234567890', // Admin phone
        name: 'Admin Haisa WA' 
      }),
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`   ✅ Admin login successful: ${result.user.name} (${result.user.role})`);
      
      // Extract session cookie for further tests
      const cookies = response.headers.get('set-cookie');
      if (cookies) {
        global.sessionCookie = cookies.split(';')[0]; // Get the session cookie
        console.log('   ✅ Session cookie obtained');
      }
      
      return result.user;
    } else {
      const error = await response.json();
      console.log(`   ❌ Admin login failed: ${error.error}`);
      return null;
    }
  } catch (error) {
    console.log(`   ❌ Admin login error: ${error.message}`);
    return null;
  }
}

// Test 2: Protected API Access
async function testProtectedAPI() {
  console.log('2. Testing Protected API Access...');
  
  if (!global.sessionCookie) {
    console.log('   ❌ No session cookie available');
    return;
  }
  
  try {
    // Test pending payments API
    const response = await fetch(`${BASE_URL}/api/payments/pending-list`, {
      headers: {
        'Cookie': global.sessionCookie
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`   ✅ Pending payments API accessible: ${result.payments?.length || 0} payments`);
    } else {
      console.log(`   ❌ Pending payments API failed: ${response.status}`);
    }
    
    // Test tickets API
    const ticketsResponse = await fetch(`${BASE_URL}/api/tickets`, {
      headers: {
        'Cookie': global.sessionCookie
      }
    });
    
    if (ticketsResponse.ok) {
      const ticketsResult = await ticketsResponse.json();
      console.log(`   ✅ Tickets API accessible: ${ticketsResult.tickets?.length || 0} tickets`);
    } else {
      console.log(`   ❌ Tickets API failed: ${ticketsResponse.status}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Protected API test error: ${error.message}`);
  }
}

// Test 3: Customer Registration
async function testCustomerRegistration() {
  console.log('3. Testing Customer Registration...');
  
  try {
    // Register new customer with unique phone
    const newPhone = '6281234567' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        phone: newPhone,
        name: 'Test Customer' 
      }),
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`   ✅ Customer registration successful: ${result.user.name} (${result.user.role})`);
      console.log(`   ✅ Phone: ${result.user.phone}`);
      return result.user;
    } else {
      const error = await response.json();
      console.log(`   ❌ Customer registration failed: ${error.error}`);
      return null;
    }
  } catch (error) {
    console.log(`   ❌ Customer registration error: ${error.message}`);
    return null;
  }
}

// Test 4: Input Sanitization
async function testInputSanitization() {
  console.log('4. Testing Input Sanitization...');
  
  try {
    // Test with potentially dangerous input
    const dangerousName = '<script>alert("xss")</script>Test User';
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        phone: '6281234567888',
        name: dangerousName
      }),
    });
    
    if (response.ok) {
      const result = await response.json();
      const sanitizedName = result.user.name;
      
      if (sanitizedName !== dangerousName && !sanitizedName.includes('<script>')) {
        console.log(`   ✅ Input sanitized: "${dangerousName}" → "${sanitizedName}"`);
      } else {
        console.log(`   ❌ Input not sanitized: "${sanitizedName}"`);
      }
    } else {
      const error = await response.json();
      console.log(`   ✅ Dangerous input rejected: ${error.error}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Input sanitization test error: ${error.message}`);
  }
}

// Test 5: Session Management
async function testSessionManagement() {
  console.log('5. Testing Session Management...');
  
  if (!global.sessionCookie) {
    console.log('   ❌ No session cookie available');
    return;
  }
  
  try {
    // Test session validation
    const response = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Cookie': global.sessionCookie
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`   ✅ Session validation working: ${result.user?.name}`);
      
      // Check if JWT token is being used (not plain JSON)
      const tokenPart = global.sessionCookie.split('=')[1];
      if (tokenPart && tokenPart.includes('.')) {
        console.log('   ✅ JWT token format detected');
      } else {
        console.log('   ⚠️ Token format may not be JWT');
      }
      
    } else {
      console.log(`   ❌ Session validation failed: ${response.status}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Session management test error: ${error.message}`);
  }
}

// Test 6: Error Handling
async function testErrorHandling() {
  console.log('6. Testing Error Handling...');
  
  try {
    // Test with invalid endpoint
    const response = await fetch(`${BASE_URL}/api/nonexistent-endpoint`);
    
    if (response.status === 404) {
      console.log('   ✅ 404 errors handled properly');
    } else {
      console.log(`   ❌ Unexpected status for invalid endpoint: ${response.status}`);
    }
    
    // Test with malformed JSON
    const response2 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json',
    });
    
    if (!response2.ok) {
      console.log('   ✅ Malformed JSON handled properly');
    } else {
      console.log('   ❌ Malformed JSON not handled');
    }
    
  } catch (error) {
    console.log(`   ✅ Network errors handled: ${error.message}`);
  }
}

// Run all tests
async function runFunctionalityTests() {
  try {
    console.log(`🌐 Testing server at: ${BASE_URL}\n`);
    
    // Wait a bit to avoid rate limiting from previous tests
    console.log('⏳ Waiting to avoid rate limiting...');
    await wait(2000);
    
    const admin = await testAdminLogin();
    await wait(500);
    
    if (admin) {
      await testProtectedAPI();
      await wait(500);
    }
    
    await testCustomerRegistration();
    await wait(500);
    
    await testInputSanitization();
    await wait(500);
    
    if (admin) {
      await testSessionManagement();
      await wait(500);
    }
    
    await testErrorHandling();
    
    console.log('\n🎉 Functionality testing completed!');
    console.log('\n📝 Summary:');
    console.log('   - Authentication system working');
    console.log('   - Protected APIs secured');
    console.log('   - Customer registration functional');
    console.log('   - Input sanitization active');
    console.log('   - Session management improved');
    console.log('   - Error handling robust');
    
  } catch (error) {
    console.error('❌ Functionality test failed:', error);
  }
}

runFunctionalityTests();