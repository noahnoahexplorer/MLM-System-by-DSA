import snowflake from 'snowflake-sdk';

const snowflakeConfig = {
  account: 'sm23176.ap-northeast-1.aws',
  username: 'noah',
  password: 'Ronghui2809.',
  database: 'DEV_DSA',
  warehouse: 'DSA_OPERATION',
};

export async function executeQuery(query: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
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