require('dotenv').config();
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { executeQuery } = require('../lib/snowflake');

// Configuration
const ADMIN_USERNAME = process.argv[2] || 'admin';
const ADMIN_PASSWORD = process.argv[3] || 'admin123';

async function createAdmin() {
  try {
    console.log(`Creating admin user: ${ADMIN_USERNAME}`);
    
    // Check if user already exists
    const checkQuery = `
      SELECT COUNT(*) as count
      FROM DEV_DSA.PRESENTATION.USER_AUTH
      WHERE MEMBER_LOGIN = '${ADMIN_USERNAME}'
    `;

    const checkResult = await executeQuery(checkQuery);
    
    if (checkResult[0].COUNT > 0) {
      console.log(`User with username '${ADMIN_USERNAME}' already exists.`);
      
      // Update the role to ADMIN
      const updateQuery = `
        UPDATE DEV_DSA.PRESENTATION.USER_AUTH
        SET ROLE = 'ADMIN', UPDATED_AT = CURRENT_TIMESTAMP()
        WHERE MEMBER_LOGIN = '${ADMIN_USERNAME}'
      `;
      
      await executeQuery(updateQuery);
      console.log(`Updated user '${ADMIN_USERNAME}' to ADMIN role.`);
      return;
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);
    
    // Generate a unique ID
    const memberId = uuidv4();
    
    // Insert new admin user
    const insertQuery = `
      INSERT INTO DEV_DSA.PRESENTATION.USER_AUTH (
        MEMBER_ID,
        MEMBER_LOGIN,
        PASSWORD_HASH,
        ROLE,
        CREATED_AT,
        UPDATED_AT
      ) VALUES (
        '${memberId}',
        '${ADMIN_USERNAME}',
        '${hashedPassword}',
        'ADMIN',
        CURRENT_TIMESTAMP(),
        CURRENT_TIMESTAMP()
      )
    `;
    
    await executeQuery(insertQuery);
    
    console.log(`Admin user '${ADMIN_USERNAME}' created successfully!`);
    console.log(`ID: ${memberId}`);
    console.log(`Role: ADMIN`);
    console.log(`\nYou can now log in with:`);
    console.log(`Username: ${ADMIN_USERNAME}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

// Run the script
createAdmin(); 