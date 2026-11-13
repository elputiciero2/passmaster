const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  try {
    console.log('[Migration] Conectado a MySQL...');
    const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('[Migration] Ejecutando schema.sql...');
    await connection.query(schemaSql);
    console.log('[Migration] ¡Migración de tablas completada con éxito!');
  } catch (error) {
    console.error('[Migration Error]:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigration();
