const pool = require('./src/config/database');

async function checkDates() {
  try {
    const res = await pool.query(`SELECT id, total, fecha, DATE(fecha) as date_fecha, CURRENT_DATE as curr_date FROM ventas`);
    console.table(res.rows);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

checkDates();
