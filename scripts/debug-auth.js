// scripts/debug-auth.js
const fetch = require('node-fetch');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api/auth';
const TEST_USERNAME = process.argv[2] || 'noah';
const TEST_PASSWORD = process.argv[3] || 'asdf1234';

async function debugAuth() {
  console.log(`Testing authentication with username: ${TEST_USERNAME}`);
  
  try {
    // Step 1: Login
    console.log('\n1. Testing login...');
    const loginResponse = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: TEST_USERNAME,
        password: TEST_PASSWORD,
      }),
    });
    
    const loginData = await loginResponse.json();
    console.log('Login Status:', loginResponse.status);
    console.log('Login Response:', loginData);
    
    if (!loginResponse.ok) {
      console.error('Login failed. Please check your credentials.');
      return;
    }
    
    console.log('\nLogin successful!');
    console.log('Note: Since this is a server-side script, we cannot access the HTTP-only cookies set by the server.');
    console.log('To test the full authentication flow, please use the browser.');
    
  } catch (error) {
    console.error('Error during authentication debug:', error);
  }
}

// Run the debug
debugAuth(); 