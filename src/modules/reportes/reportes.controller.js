const pool = require("../../config/database");

// INGRESOS DEL DIA
const ingresosHoy = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COALESCE(SUM(total),0) AS ingresos_hoy
      FROM ventas
      WHERE DATE(fecha) = CURRENT_DATE
    `);

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// EGRESOS DEL DIA
const egresosHoy = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COALESCE(SUM(monto),0) AS egresos_hoy
      FROM egresos
      WHERE DATE(fecha) = CURRENT_DATE
    `);

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GANANCIA DEL DIA
const gananciaHoy = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
      (SELECT COALESCE(SUM(total),0) FROM ventas WHERE DATE(fecha)=CURRENT_DATE) -
      (SELECT COALESCE(SUM(monto),0) FROM egresos WHERE DATE(fecha)=CURRENT_DATE)
      AS ganancia_hoy
    `);

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// INGRESOS DEL MES
const ingresosMes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COALESCE(SUM(total),0) AS ingresos_mes
      FROM ventas
      WHERE DATE_TRUNC('month',fecha) = DATE_TRUNC('month',CURRENT_DATE)
    `);

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PRODUCTOS MAS VENDIDOS
const productosMasVendidos = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.nombre, SUM(d.cantidad) AS total_vendido
      FROM detalle_ventas d
      JOIN productos p ON d.producto_id = p.id
      GROUP BY p.nombre
      ORDER BY total_vendido DESC
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// MEMBRESIAS VENCIDAS
const membresiasVencidas = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
      c.nombre,
      tm.nombre AS tipo_membresia,
      m.fecha_fin
      FROM membresias m
      JOIN clientes c ON c.id = m.cliente_id
      JOIN tipos_membresia tm ON tm.id = m.tipo_membresia_id
      WHERE m.fecha_fin < CURRENT_DATE
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PRODUCTOS CON POCO STOCK
const productosStockBajo = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT nombre, stock
      FROM productos
      WHERE stock <= 5
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DASHBOARD GENERAL
const dashboard = async (req, res) => {
  try {
    const ingresosHoy = await pool.query(`
      SELECT COALESCE(SUM(total),0) AS ingresos_hoy
      FROM ventas
      WHERE DATE(fecha) = CURRENT_DATE
    `);

    const ventasHoy = await pool.query(`
      SELECT COUNT(*) AS ventas_hoy
      FROM ventas
      WHERE DATE(fecha) = CURRENT_DATE
    `);

    const membresiasActivas = await pool.query(`
      SELECT COUNT(*) AS membresias_activas
      FROM membresias
      WHERE fecha_fin >= CURRENT_DATE
    `);

    const stockBajo = await pool.query(`
      SELECT COUNT(*) AS productos_stock_bajo
      FROM productos
      WHERE stock <= 5
    `);

    res.json({
      ingresos_hoy: ingresosHoy.rows[0].ingresos_hoy,
      ventas_hoy: ventasHoy.rows[0].ventas_hoy,
      membresias_activas: membresiasActivas.rows[0].membresias_activas,
      productos_stock_bajo: stockBajo.rows[0].productos_stock_bajo,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  ingresosHoy,
  egresosHoy,
  gananciaHoy,
  ingresosMes,
  productosMasVendidos,
  membresiasVencidas,
  productosStockBajo,
  dashboard,
};
