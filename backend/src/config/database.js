const sql = require('mssql');
const env = require('./env');

const dbConfig = {
  user: env.DB.user,
  password: env.DB.password,
  server: env.DB.host,
  port: env.DB.port,
  database: env.DB.name,
  options: {
    encrypt: env.DB.encrypt,
    trustServerCertificate: env.DB.trustServerCertificate,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool = null;

async function getPool() {
  if (pool && pool.connected) {
    return pool;
  }
  try {
    pool = await new sql.ConnectionPool(dbConfig).connect();
    console.log(`✅ MSSQL Connected successfully to ${env.DB.host}:${env.DB.port}/${env.DB.name}`);
    return pool;
  } catch (err) {
    console.error('❌ MSSQL Connection Failed:', err.message);
    throw err;
  }
}

async function testConnection() {
  try {
    const p = await getPool();
    const result = await p.request().query('SELECT 1 AS healthCheck');
    return { connected: true, result: result.recordset[0] };
  } catch (err) {
    return { connected: false, error: err.message };
  }
}

module.exports = {
  sql,
  getPool,
  testConnection,
};
