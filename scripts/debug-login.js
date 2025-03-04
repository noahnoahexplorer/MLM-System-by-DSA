// scripts/debug-login.js
const fetch = require('node-fetch');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api/auth';

async function debugLogin() {
  console.log('=== DEBUG LOGIN PROCESS ===');
  
  // Step 1: Attempt login
  console.log('\n1. Attempting login with username "noah" and password "asdf1234"...');
  
  try {
    const loginResponse = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        username: 'noah', 
        password: 'asdf1234' 
      }),
    });
    
    const loginData = await loginResponse.json();
    
    console.log('Login Status:', loginResponse.status);
    console.log('Login Response:', loginData);
    
    // Get the Set-Cookie header
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    console.log('\n2. Set-Cookie header:', setCookieHeader || 'No Set-Cookie header found');
    
    if (loginResponse.ok) {
      console.log('\n✅ Login successful!');
      console.log('User data:', loginData.user);
    } else {
      console.error('\n❌ Login failed.');
      console.error('Error message:', loginData.error);
    }
    
  } catch (error) {
    console.error('Error during debug process:', error);
  }
}

// Run the debug process
debugLogin(); 