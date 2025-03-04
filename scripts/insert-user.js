const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const snowflake = require('snowflake-sdk');

// Configuration
const USERNAME = process.argv[2] || 'defaultuser';
const PASSWORD = process.argv[3] || 'password123';
const ROLE = process.argv[4] || 'MEMBER';

// You can hardcode these values for testing
// IMPORTANT: Remove or secure these values before committing to version control
const snowflakeConfig = {
  account: process.env.SNOWFLAKE_ACCOUNT || 'your_account_here',
  username: process.env.SNOWFLAKE_USERNAME || 'your_snowflake_username',
  password: process.env.SNOWFLAKE_PASSWORD || 'your_snowflake_password',
  database: process.env.SNOWFLAKE_DATABASE || 'DEV_DSA',
  warehouse: process.env.SNOWFLAKE_WAREHOUSE || 'your_warehouse',
};

function executeQuery(query) {
  return new Promise((resolve, reject) => {
    if (!snowflakeConfig.account || !snowflakeConfig.username || !snowflakeConfig.password) {
      reject(new Error('Missing Snowflake configuration'));
      return;
    }

    console.log('Connecting to Snowflake...');
    const connection = snowflake.createConnection(snowflakeConfig);

    connection.connect((err) => {
      if (err) {
        console.error('Unable to connect to Snowflake:', err);
        reject(err);
        return;
      }

      console.log('Connected to Snowflake, executing query...');
      connection.execute({
        sqlText: query,
        complete: (err, stmt, rows) => {
          if (err) {
            console.error('Failed to execute query:', err);
            reject(err);
            return;
          }

          connection.destroy((err) => {
            if (err) {
              console.error('Error disconnecting:', err);
            }
          });

          resolve(rows || []);
        },
      });
    });
  });
}

async function createUser() {
  try {
    console.log(`Creating user: ${USERNAME} with role: ${ROLE}`);
    
    // Check if user already exists
    const checkQuery = `
      SELECT COUNT(*) as COUNT
      FROM DEV_DSA.PRESENTATION.USER_AUTH
      WHERE MEMBER_LOGIN = '${USERNAME}'
    `;

    const checkResult = await executeQuery(checkQuery);
    
    if (checkResult[0].COUNT > 0) {
      console.log(`User with username '${USERNAME}' already exists.`);
      
      // Update the role if needed
      const updateQuery = `
        UPDATE DEV_DSA.PRESENTATION.USER_AUTH
        SET ROLE = '${ROLE}', UPDATED_AT = CURRENT_TIMESTAMP()
        WHERE MEMBER_LOGIN = '${USERNAME}'
      `;
      
      await executeQuery(updateQuery);
      console.log(`Updated user '${USERNAME}' to ${ROLE} role.`);
      return;
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(PASSWORD, salt);
    
    // Generate a unique ID
    const memberId = uuidv4();
    
    // Insert new user
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
        '${USERNAME}',
        '${hashedPassword}',
        '${ROLE}',
        CURRENT_TIMESTAMP(),
        CURRENT_TIMESTAMP()
      )
    `;
    
    await executeQuery(insertQuery);
    
    console.log(`User '${USERNAME}' created successfully!`);
    console.log(`ID: ${memberId}`);
    console.log(`Role: ${ROLE}`);
  } catch (error) {
    console.error('Error creating user:', error);
  }
}

createUser(); 