// Crea la base de datos marathon_cycleback y carga los datos demo.
// Uso: npm run setup
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const DB = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: Number(process.env.DB_PORT || 3306),
  multipleStatements: true,
};

(async () => {
  try {
    const conn = await mysql.createConnection(DB);
    const schema = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
    const seed = fs.readFileSync(path.join(__dirname, '..', 'db', 'seed.sql'), 'utf8');
    console.log('▸ Creando esquema marathon_cycleback...');
    await conn.query(schema);
    console.log('▸ Cargando datos demo...');
    await conn.query(seed);
    const [[{ total }]] = await conn.query('SELECT COUNT(*) AS total FROM marathon_cycleback.products');
    console.log(`✔ Base de datos lista (${total} productos cargados).`);
    await conn.end();
  } catch (err) {
    console.error('✖ Error configurando la base de datos:', err.message);
    process.exit(1);
  }
})();
