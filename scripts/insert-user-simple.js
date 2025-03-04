const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const snowflake = require('snowflake-sdk');

// User details
const username = 'noah';
const password = 'asdf1234';
const role = 'ADMIN';

// Create a connection to Snowflake
// Replace these with your actual Snowflake credentials
const connection = snowflake.createConnection({
  account: 'your_account_identifier',
  username: 'your_snowflake_username',
  password: 'your_snowflake_password',
  database: 'DEV_DSA',
  warehouse: 'your_warehouse_name'
});

async function insertUser() {
  try {
    // Generate a UUID for MEMBER_ID
    const memberId = uuidv4();
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Connect to Snowflake
    connection.connect((err) => {
      if (err) {
        console.error('Unable to connect to Snowflake:', err);
        return;
      }
      
      console.log('Connected to Snowflake');
      
      // SQL query to insert the user
      const query = `
        INSERT INTO DEV_DSA.PRESENTATION.USER_AUTH (
          MEMBER_ID,
          MEMBER_LOGIN,
          PASSWORD_HASH,
          ROLE,
          CREATED_AT,
          UPDATED_AT
        ) VALUES (
          '${memberId}',
          '${username}',
          '${hashedPassword}',
          '${role}',
          CURRENT_TIMESTAMP(),
          CURRENT_TIMESTAMP()
        )
      `;
      
      // Execute the query
      connection.execute({
        sqlText: query,
        complete: (err, stmt, rows) => {
          if (err) {
            console.error('Failed to insert user:', err);
          } else {
            console.log(`User '${username}' created successfully!`);
            console.log(`MEMBER_ID: ${memberId}`);
            console.log(`ROLE: ${role}`);
          }
          
          // Close the connection
          connection.destroy((err) => {
            if (err) {
              console.error('Error disconnecting:', err);
            } else {
              console.log('Disconnected from Snowflake');
            }
          });
        }
      });
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

insertUser(); 