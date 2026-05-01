const pool = require('./src/config/database');

async function checkDashboard() {
  try {
    const ingresosHoy = await pool.query(`
      SELECT COALESCE(SUM(total),0) AS ingresos_hoy
      FROM ventas
      WHERE DATE(fecha) = CURRENT_DATE
    `);
    const ingresosMes = await pool.query(`
      SELECT COALESCE(SUM(total),0) AS ingresos_mes
      FROM ventas
      WHERE DATE_TRUNC('month',fecha) = DATE_TRUNC('month',CURRENT_DATE)
    `);
    
    console.log("Hoy:", ingresosHoy.rows[0].ingresos_hoy);
    console.log("Mes:", ingresosMes.rows[0].ingresos_mes);
    
    // insert a sale for yesterday
    await pool.query(`INSERT INTO ventas (metodo_pago_id, tipo_venta, total, fecha) VALUES (1, 'producto', 500.00, CURRENT_DATE - INTERVAL '1 day')`);
    
    const ingresosHoy2 = await pool.query(`
      SELECT COALESCE(SUM(total),0) AS ingresos_hoy
      FROM ventas
      WHERE DATE(fecha) = CURRENT_DATE
    `);
    const ingresosMes2 = await pool.query(`
      SELECT COALESCE(SUM(total),0) AS ingresos_mes
      FROM ventas
      WHERE DATE_TRUNC('month',fecha) = DATE_TRUNC('month',CURRENT_DATE)
    `);

    console.log("Despues de insertar venta ayer:");
    console.log("Hoy:", ingresosHoy2.rows[0].ingresos_hoy);
    console.log("Mes:", ingresosMes2.rows[0].ingresos_mes);

    // cleanup
    await pool.query(`DELETE FROM ventas WHERE total = 500.00`);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

checkDashboard();
