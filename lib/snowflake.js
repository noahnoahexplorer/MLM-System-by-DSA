// lib/snowflake.js
const snowflake = require('snowflake-sdk');
require('dotenv').config();

const snowflakeConfig = {
  account: process.env.SNOWFLAKE_ACCOUNT,
  username: process.env.SNOWFLAKE_USERNAME,
  password: process.env.SNOWFLAKE_PASSWORD,
  database: process.env.SNOWFLAKE_DATABASE,
  warehouse: process.env.SNOWFLAKE_WAREHOUSE,
};

function executeQuery(query) {
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

module.exports = {
  executeQuery
}; 