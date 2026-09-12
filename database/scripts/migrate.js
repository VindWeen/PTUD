/**
 * Database Migration Runner for Microsoft SQL Server
 * Usage: node database/scripts/migrate.js
 */
const fs = require('fs');
const path = require('path');

// Auto-resolve dependencies from backend/node_modules
const backendNodeModules = path.resolve(__dirname, '../../backend/node_modules');
if (fs.existsSync(backendNodeModules)) {
  module.paths.unshift(backendNodeModules);
}

const sql = require('mssql');
const dotenv = require('dotenv');

// Load environment variables from backend/.env if available
const envPath = path.resolve(__dirname, '../../backend/.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'YourPassword123!',
  server: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  database: process.env.DB_NAME || 'LHU_Achievement_DB',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
    enableArithAbort: true,
  },
};

async function runMigrations() {
  console.log('🚀 Starting Database Migration...');
  console.log(`Connecting to SQL Server at ${config.server}:${config.port}, Database: ${config.database}`);

  let pool;
  try {
    pool = await sql.connect(config);
    console.log('✅ Connected to SQL Server successfully.');

    // 1. Ensure SchemaMigrations table exists
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SchemaMigrations')
      BEGIN
          CREATE TABLE SchemaMigrations (
              Id INT IDENTITY(1,1) PRIMARY KEY,
              MigrationName NVARCHAR(255) NOT NULL UNIQUE,
              AppliedAt DATETIME2 DEFAULT SYSUTCDATETIME()
          );
      END;
    `);

    // 2. Read all migrations
    const migrationsDir = path.resolve(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    // 3. Get applied migrations
    const appliedResult = await pool.request().query('SELECT MigrationName FROM SchemaMigrations');
    const appliedSet = new Set(appliedResult.recordset.map((r) => r.MigrationName));

    // 4. Apply pending migrations
    let appliedCount = 0;
    for (const file of files) {
      if (!appliedSet.has(file)) {
        console.log(`⏳ Applying migration: ${file}...`);
        const filePath = path.join(migrationsDir, file);
        const sqlContent = fs.readFileSync(filePath, 'utf-8');

        // Split by GO statements if present
        const batches = sqlContent
          .split(/^\s*GO\s*$/gim)
          .map((b) => b.trim())
          .filter((b) => b.length > 0);

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
          for (const batch of batches) {
            const request = new sql.Request(transaction);
            await request.query(batch);
          }

          const recordRequest = new sql.Request(transaction);
          recordRequest.input('name', sql.NVarChar(255), file);
          await recordRequest.query('INSERT INTO SchemaMigrations (MigrationName) VALUES (@name)');

          await transaction.commit();
          console.log(`✅ Successfully applied: ${file}`);
          appliedCount++;
        } catch (err) {
          await transaction.rollback();
          console.error(`❌ Failed to apply ${file}:`, err.message);
          throw err;
        }
      }
    }

    if (appliedCount === 0) {
      console.log('✨ All migrations are up to date. Nothing to run.');
    } else {
      console.log(`🎉 Successfully applied ${appliedCount} migration(s).`);
    }
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
