/**
 * Database Seed Runner for Microsoft SQL Server
 * Usage: node database/scripts/seed.js
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

// Load environment variables
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

async function runSeed() {
  console.log('🌱 Starting Database Seeding...');
  console.log(`Connecting to SQL Server at ${config.server}:${config.port}, Database: ${config.database}`);

  let pool;
  try {
    pool = await sql.connect(config);
    console.log('✅ Connected to SQL Server successfully.');

    const seedDir = path.resolve(__dirname, '../seed');
    const files = fs
      .readdirSync(seedDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      console.log(`⏳ Running seed: ${file}...`);
      const filePath = path.join(seedDir, file);
      const sqlContent = fs.readFileSync(filePath, 'utf-8');

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
        await transaction.commit();
        console.log(`✅ Successfully seeded: ${file}`);
      } catch (err) {
        await transaction.rollback();
        console.error(`❌ Failed to seed ${file}:`, err.message);
        throw err;
      }
    }

    console.log('🎉 Database seeding completed successfully.');
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

if (require.main === module) {
  runSeed();
}

module.exports = { runSeed };
