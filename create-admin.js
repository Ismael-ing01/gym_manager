require('dotenv').config();
const pool = require('./src/config/database');
const bcrypt = require('bcrypt');

async function createAdmin() {
  try {
    const hash = await bcrypt.hash('admin123', 10);
    await pool.query(
      `INSERT INTO usuarios (nombre, email, password, rol) 
       VALUES ('Admin', 'admin@mundofit.com', $1, 'ADMIN') 
       ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password`,
      [hash]
    );
    console.log('User created successfully');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
createAdmin();
