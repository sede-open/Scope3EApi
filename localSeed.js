/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */
const dotenv = require('dotenv');
const sql = require('mssql');

dotenv.config();

const config = {
  database: process.env.DBNAME,
  server: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASS,
  port: 1433,
  options: {
    enableArithAbort: true,
  },
};

async function safetyCheck(pool) {
  const { recordset } = await pool.query`SELECT COUNT(*) FROM [USER]`;
  const count = recordset[0][''];
  if (count > 0) {
    console.info(`safety: ${count} records exist in USER table, skipping seed`);
    return false;
  }
  console.info('safety: safe to seed data');
  return true;
}

async function addUser(pool, email, authProvider, companyId) {
  const roleQuery = `SELECT * FROM [ROLE];`;
  const { recordset: roles } = await pool.query(roleQuery);
  const { id: adminRoleId } = roles.find((role) => role.name === 'ADMIN');
  const { id: editorRoleId } = roles.find(
    (role) => role.name === 'SUPPLIER_EDITOR'
  );
  const { id: viewerRoleId } = roles.find(
    (role) => role.name === 'SUPPLIER_VIEWER'
  );

  const {
    recordset: [{ id: userId }],
  } = await pool.query(`
    INSERT INTO "USER" ("email", "first_name", "last_name", "auth_provider", "created_at", "updated_at", "company_id")
    OUTPUT Inserted.id
    VALUES
    ('${email}', 'Test', 'McTest', '${authProvider}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '${companyId}');
  `);

  await pool.query(`
    INSERT INTO "USER_ROLE" ("user_id", "role_id")
    VALUES ('${userId}', '${adminRoleId}'), ('${userId}', '${editorRoleId}'), ('${userId}', '${viewerRoleId}')
  `);
}

async function seed() {
  try {
    const pool = new sql.ConnectionPool(config);
    await pool.connect();

    const agileHubCorpId = '';
    if (await safetyCheck(pool)) {
      await pool.query(`
        INSERT INTO COMPANY ("id", "name", "location", "business_sector", "sub_sector", "created_at", "updated_at")
        VALUES
        ('${agileHubCorpId}', 'The Agile Hub Corp', 'UK', 'software', 'consulting', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
      `);

      await addUser(
        pool,
        process.env.CURRENT_ABCD_USER,
        'PORT',
        agileHubCorpId
      );
    }
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

seed();
