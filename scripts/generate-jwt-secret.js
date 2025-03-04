const crypto = require('crypto');

// Generate a random string of 64 characters
const secret = crypto.randomBytes(32).toString('hex');

console.log('Generated JWT Secret:');
console.log(secret);
console.log('\nAdd this to your .env.local file:');
console.log(`JWT_SECRET=${secret}`); 