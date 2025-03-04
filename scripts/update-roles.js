require('dotenv').config();
const snowflake = require('snowflake-sdk');

const snowflakeConfig = {
  account: process.env.SNOWFLAKE_ACCOUNT,
  username: process.env.SNOWFLAKE_USERNAME,
  password: process.env.SNOWFLAKE_PASSWORD,
  database: process.env.SNOWFLAKE_DATABASE,
  warehouse: process.env.SNOWFLAKE_WAREHOUSE,
};

async function executeQuery(query) {
  return new Promise((resolve, reject) => {
    if (!snowflakeConfig.account || !snowflakeConfig.username || !snowflakeConfig.password) {
      reject(new Error('Missing Snowflake configuration'));
      return;
    }

    const connection = snowflake.createConnection(snowflakeConfig);

    connection.connect((err) => {
      if (err) {
        console.error('Unable to connect to Snowflake:', err);
        reject(err);
        return;
      }

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

async function updateRoles() {
  try {
    console.log('Fetching existing users...');
    
    // Get all users
    const users = await executeQuery(`
      SELECT MEMBER_ID, MEMBER_LOGIN, ROLE
      FROM DEV_DSA.PRESENTATION.USER_AUTH
    `);
    
    console.log(`Found ${users.length} users to update.`);
    
    // Update each user
    for (const user of users) {
      let newRole = 'MARKETING';
      let permissions = 'marketing-ops-finalized-commission,members,reports';
      
      // Map old roles to new roles
      if (user.ROLE === 'ADMIN') {
        newRole = 'ADMIN';
        permissions = 'compliance-checklist,exclusion-list,marketing-ops-finalized-commission,members,reports,settings';
      } else if (user.ROLE === 'MANAGER') {
        newRole = 'MARKETING OPS';
        permissions = 'marketing-ops-finalized-commission,members,reports';
      } else if (user.ROLE === 'MEMBER') {
        newRole = 'MARKETING';
        permissions = 'marketing-ops-finalized-commission,members,reports';
      }
      
      console.log(`Updating user ${user.MEMBER_LOGIN} from ${user.ROLE} to ${newRole}`);
      
      // Update the user
      await executeQuery(`
        UPDATE DEV_DSA.PRESENTATION.USER_AUTH
        SET ROLE = '${newRole}', 
            PERMISSIONS = '${permissions}',
            UPDATED_AT = CURRENT_TIMESTAMP()
        WHERE MEMBER_ID = '${user.MEMBER_ID}'
      `);
    }
    
    console.log('All users updated successfully!');
  } catch (error) {
    console.error('Error updating roles:', error);
  }
}

updateRoles(); 