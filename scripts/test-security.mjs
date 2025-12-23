/**
 * Security Testing Script
 * Test all security implementations
 */

console.log('🔒 Testing Security Implementations...\n');

// Test 1: Input Validation Functions
async function testValidationFunctions() {
  console.log('1. Testing Validation Functions...');
  
  try {
    // Import validation functions
    const { validateLoginInput, sanitizePhone } = await import('../src/core/security/validation.js');
    
    // Test phone sanitization
    const testCases = [
      { input: '+6281234567890', expected: '6281234567890' },
      { input: '081234567890', expected: '6281234567890' },
      { input: '6281234567890', expected: '6281234567890' },
    ];
    
    for (const testCase of testCases) {
      const result = sanitizePhone(testCase.input);
      const passed = result === testCase.expected;
      console.log(`   ${passed ? '✅' : '❌'} ${testCase.input} → ${result}`);
    }
    
    // Test validation
    try {
      validateLoginInput('6281234567890', 'Test User');
      console.log('   ✅ Valid input accepted');
    } catch (error) {
      console.log('   ❌ Valid input rejected:', error.message);
    }
    
    try {
      validateLoginInput('123', 'Test');
      console.log('   ❌ Invalid input accepted');
    } catch (error) {
      console.log('   ✅ Invalid input rejected:', error.message);
    }
    
  } catch (error) {
    console.log('   ❌ Validation functions not available:', error.message);
  }
  console.log();
}

// Test 2: JWT Functions
async function testJWTFunctions() {
  console.log('2. Testing JWT Functions...');
  
  try {
    const { generateSessionToken, verifySessionToken } = await import('../src/core/security/jwt.js');
    
    const testPayload = {
      userId: 'test-user-id',
      phone: '6281234567890',
      name: 'Test User',
      role: 'CUSTOMER'
    };
    
    // Generate token
    const token = generateSessionToken(testPayload);
    console.log('   ✅ Token generated successfully');
    
    // Verify token
    const decoded = verifySessionToken(token);
    if (decoded && decoded.userId === testPayload.userId) {
      console.log('   ✅ Token verified successfully');
    } else {
      console.log('   ❌ Token verification failed');
    }
    
    // Test invalid token
    const invalidDecoded = verifySessionToken('invalid-token');
    if (!invalidDecoded) {
      console.log('   ✅ Invalid token rejected');
    } else {
      console.log('   ❌ Invalid token accepted');
    }
    
  } catch (error) {
    console.log('   ❌ JWT functions not available:', error.message);
  }
  console.log();
}

// Test 3: Encryption Functions
async function testEncryptionFunctions() {
  console.log('3. Testing Encryption Functions...');
  
  try {
    const { encrypt, decrypt, hashPassword, verifyPassword } = await import('../src/core/security/encryption.js');
    
    // Test encryption/decryption
    const testData = 'sensitive-password-123';
    const encrypted = encrypt(testData);
    const decrypted = decrypt(encrypted);
    
    if (decrypted === testData) {
      console.log('   ✅ Encryption/Decryption working');
    } else {
      console.log('   ❌ Encryption/Decryption failed');
    }
    
    // Test password hashing
    const password = 'testpassword123';
    const hash = await hashPassword(password);
    const isValid = await verifyPassword(password, hash);
    const isInvalid = await verifyPassword('wrongpassword', hash);
    
    if (isValid && !isInvalid) {
      console.log('   ✅ Password hashing working');
    } else {
      console.log('   ❌ Password hashing failed');
    }
    
  } catch (error) {
    console.log('   ❌ Encryption functions not available:', error.message);
  }
  console.log();
}

// Test 4: Rate Limiting Functions
async function testRateLimitFunctions() {
  console.log('4. Testing Rate Limiting Functions...');
  
  try {
    const { checkRateLimit } = await import('../src/core/security/rate-limit.js');
    
    // Mock request object
    const mockRequest = {
      headers: {
        get: (name) => {
          if (name === 'x-forwarded-for') return '127.0.0.1';
          if (name === 'user-agent') return 'test-agent';
          return null;
        }
      }
    };
    
    // Test rate limiting
    let allowedCount = 0;
    let blockedCount = 0;
    
    for (let i = 0; i < 10; i++) {
      const result = checkRateLimit(mockRequest, 'LOGIN');
      if (result.allowed) {
        allowedCount++;
      } else {
        blockedCount++;
      }
    }
    
    console.log(`   ✅ Allowed requests: ${allowedCount}`);
    console.log(`   ✅ Blocked requests: ${blockedCount}`);
    
    if (blockedCount > 0) {
      console.log('   ✅ Rate limiting working');
    } else {
      console.log('   ⚠️ Rate limiting may not be working (check configuration)');
    }
    
  } catch (error) {
    console.log('   ❌ Rate limiting functions not available:', error.message);
  }
  console.log();
}

// Test 5: File Validation
async function testFileValidation() {
  console.log('5. Testing File Validation...');
  
  try {
    const { validateFile, ALLOWED_FILE_TYPES, MAX_FILE_SIZE } = await import('../src/core/security/validation.js');
    
    console.log(`   ✅ Allowed file types: ${ALLOWED_FILE_TYPES.join(', ')}`);
    console.log(`   ✅ Max file size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
    
    // Test with mock file objects
    const validFile = { 
      type: 'image/jpeg', 
      size: 1024 * 1024, // 1MB
      name: 'test.jpg' 
    };
    
    const invalidTypeFile = { 
      type: 'application/exe', 
      size: 1024, 
      name: 'virus.exe' 
    };
    
    const oversizeFile = { 
      type: 'image/jpeg', 
      size: 10 * 1024 * 1024, // 10MB
      name: 'large.jpg' 
    };
    
    try {
      validateFile(validFile);
      console.log('   ✅ Valid file accepted');
    } catch (error) {
      console.log('   ❌ Valid file rejected:', error.message);
    }
    
    try {
      validateFile(invalidTypeFile);
      console.log('   ❌ Invalid file type accepted');
    } catch (error) {
      console.log('   ✅ Invalid file type rejected:', error.message);
    }
    
    try {
      validateFile(oversizeFile);
      console.log('   ❌ Oversize file accepted');
    } catch (error) {
      console.log('   ✅ Oversize file rejected:', error.message);
    }
    
  } catch (error) {
    console.log('   ❌ File validation not available:', error.message);
  }
  console.log();
}

// Run all tests
async function runSecurityTests() {
  try {
    await testValidationFunctions();
    await testJWTFunctions();
    await testEncryptionFunctions();
    await testRateLimitFunctions();
    await testFileValidation();
    
    console.log('🎉 Security testing completed!');
    console.log('\n📝 To test API endpoints:');
    console.log('   1. Start server: npm run dev');
    console.log('   2. Test login: POST http://localhost:3000/api/auth/login');
    console.log('   3. Test rate limiting by making multiple requests');
    
  } catch (error) {
    console.error('❌ Security test failed:', error);
  }
}

runSecurityTests();