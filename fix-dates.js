const pool = require('./src/config/database');

async function fixDates() {
  try {
    // We have 9 sales from today (2026-05-01): IDs 4, 6, 8, 9, 10, 11, 12, 13, 14
    // Total is 109.00.
    // Let's move IDs 4, 6, 8, 9, 10, 11 to yesterday (2026-04-30 or earlier if today is May 1)
    
    // Move some sales to '2026-04-28' and '2026-04-29' so they are in the same month or previous days
    await pool.query(`UPDATE ventas SET fecha = CURRENT_DATE - INTERVAL '3 days' WHERE id IN (4, 6)`);
    await pool.query(`UPDATE ventas SET fecha = CURRENT_DATE - INTERVAL '2 days' WHERE id IN (8, 9)`);
    await pool.query(`UPDATE ventas SET fecha = CURRENT_DATE - INTERVAL '1 days' WHERE id IN (10, 11)`);
    
    // Now today's sales are just IDs 12, 13, 14. 
    // ID 12: 2.00, ID 13: 1.00, ID 14: 30.00 => Total 33.00
    
    console.log("Fechas actualizadas correctamente.");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

fixDates();
