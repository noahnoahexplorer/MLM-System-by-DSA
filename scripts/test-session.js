// scripts/test-session.js
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Configuration
const API_BASE_URL = 'http://localhost:3000/api/auth';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Create a test token
function createTestToken() {
  const payload = {
    id: '70496260-1920-4dce-8ad8-d3ec29a1fee9',
    username: 'noah',
    role: 'ADMIN',
    permissions: null,
    merchantId: null
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

async function testSession() {
  console.log('Testing session endpoint directly...');
  
  // Create a test token
  const token = createTestToken();
  console.log('Created test token:', token.substring(0, 20) + '...');
  
  try {
    // Test session endpoint
    const response = await fetch(`${API_BASE_URL}/session`, {
      headers: {
        Cookie: `auth_token=${token}`
      }
    });
    
    const data = await response.json();
    
    console.log('Session Status:', response.status);
    console.log('Session Response:', data);
    
    if (response.ok) {
      console.log('\nSession check successful!');
    } else {
      console.error('\nSession check failed.');
    }
  } catch (error) {
    console.error('Error testing session:', error);
  }
}

// Run the test
testSession(); 