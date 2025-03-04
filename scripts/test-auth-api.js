// scripts/test-auth-api.js
const fetch = require('node-fetch');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api/auth';
const TEST_USERNAME = 'testuser';
const TEST_PASSWORD = 'password123';

// Test registration
async function testRegistration() {
  console.log('Testing registration endpoint...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: TEST_USERNAME,
        password: TEST_PASSWORD,
      }),
    });
    
    const data = await response.json();
    
    console.log('Registration Response:', {
      status: response.status,
      data,
    });
    
    return data;
  } catch (error) {
    console.error('Registration Error:', error);
  }
}

// Test login
async function testLogin() {
  console.log('\nTesting login endpoint...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: TEST_USERNAME,
        password: TEST_PASSWORD,
      }),
    });
    
    const data = await response.json();
    
    console.log('Login Response:', {
      status: response.status,
      data,
    });
    
    return data;
  } catch (error) {
    console.error('Login Error:', error);
  }
}

// Test session
async function testSession(cookie) {
  console.log('\nTesting session endpoint...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/session`, {
      headers: {
        Cookie: cookie,
      },
    });
    
    const data = await response.json();
    
    console.log('Session Response:', {
      status: response.status,
      data,
    });
    
    return data;
  } catch (error) {
    console.error('Session Error:', error);
  }
}

// Run tests
async function runTests() {
  // Test registration
  await testRegistration();
  
  // Test login
  const loginResponse = await testLogin();
  
  // Extract cookie from login response
  if (loginResponse && loginResponse.user) {
    console.log('\nLogin successful! User:', loginResponse.user);
    
    // Note: In a real test, you would extract the cookie from the response headers
    // but this is not possible with this simple script since we don't have access to the response cookies
    console.log('\nNote: To test the session endpoint, you need to manually copy the auth_token cookie from your browser');
  }
}

// Run the tests
runTests();

console.log('\n-----------------------------------------');
console.log('To test the API manually:');
console.log('\n1. Register a new user:');
console.log('   curl -X POST http://localhost:3000/api/auth/register \\');
console.log('   -H "Content-Type: application/json" \\');
console.log('   -d \'{"username":"testuser","password":"password123"}\'');

console.log('\n2. Login with the user:');
console.log('   curl -X POST http://localhost:3000/api/auth/login \\');
console.log('   -H "Content-Type: application/json" \\');
console.log('   -d \'{"username":"testuser","password":"password123"}\' \\');
console.log('   -c cookies.txt');

console.log('\n3. Check session:');
console.log('   curl -X GET http://localhost:3000/api/auth/session \\');
console.log('   -b cookies.txt');
console.log('-----------------------------------------'); 