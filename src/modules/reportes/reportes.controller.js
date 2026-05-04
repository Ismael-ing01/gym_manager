const pool = require("../../config/database");
const PDFDocument = require("pdfkit");

const REPORT_METRICS = {
  INGRESOS: "ingresos",
  EGRESOS: "egresos",
  GANANCIA: "ganancia",
  MEMBRESIAS: "membresias",
  PRODUCTOS: "productos",
  ENTRADAS: "entradas",
  CLIENTES: "clientes",
  COSTO_PRODUCTOS: "costo_productos",
};

const hasColumn = async (tableName, columnName) => {
  const result = await pool.query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = $1
       AND column_name = $2
     LIMIT 1`,
    [tableName, columnName],
  );

  return result.rows.length > 0;
};

const parseReportRange = ({ from, to, year }) => {
  if (from && to) {
    const start = new Date(from);
    const end = new Date(to);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return null;
    }
    end.setHours(23, 59, 59, 999);
    return { start, end, label: `${from} a ${to}` };
  }

  if (year) {
    const yearNumber = Number(year);
    if (!Number.isInteger(yearNumber)) {
      return null;
    }
    const start = new Date(yearNumber, 0, 1, 0, 0, 0, 0);
    const end = new Date(yearNumber, 11, 31, 23, 59, 59, 999);
    return { start, end, label: `Año ${yearNumber}` };
  }

  return null;
};

const buildManualReport = async ({ range, metrics }) => {
  const data = {
    range,
    metrics: {},
  };

  const { start, end } = range;

  if (metrics.includes(REPORT_METRICS.INGRESOS)) {
    const result = await pool.query(
      `SELECT COALESCE(SUM(total),0) AS ingresos
       FROM ventas
       WHERE fecha >= $1 AND fecha <= $2`,
      [start, end],
    );
    data.metrics.ingresos = Number(result.rows[0].ingresos);
  }

  if (metrics.includes(REPORT_METRICS.EGRESOS)) {
    const result = await pool.query(
      `SELECT COALESCE(SUM(monto),0) AS egresos
       FROM egresos
       WHERE fecha >= $1 AND fecha <= $2`,
      [start, end],
    );
    data.metrics.egresos = Number(result.rows[0].egresos);
  }

  if (metrics.includes(REPORT_METRICS.GANANCIA)) {
    const ingresos = await pool.query(
      `SELECT COALESCE(SUM(total),0) AS ingresos
       FROM ventas
       WHERE fecha >= $1 AND fecha <= $2`,
      [start, end],
    );
    const egresos = await pool.query(
      `SELECT COALESCE(SUM(monto),0) AS egresos
       FROM egresos
       WHERE fecha >= $1 AND fecha <= $2`,
      [start, end],
    );
    data.metrics.ganancia =
      Number(ingresos.rows[0].ingresos) - Number(egresos.rows[0].egresos);
  }

  if (metrics.includes(REPORT_METRICS.MEMBRESIAS)) {
    const result = await pool.query(
      `SELECT COUNT(*) AS membresias_vendidas
       FROM ventas
       WHERE tipo_venta = 'membresia'
         AND fecha >= $1 AND fecha <= $2`,
      [start, end],
    );
    data.metrics.membresias_vendidas = Number(
      result.rows[0].membresias_vendidas,
    );
  }

  if (metrics.includes(REPORT_METRICS.PRODUCTOS)) {
    const result = await pool.query(
      `SELECT COALESCE(SUM(d.cantidad),0) AS productos_vendidos
       FROM detalle_ventas d
       JOIN ventas v ON v.id = d.venta_id
       WHERE v.fecha >= $1 AND v.fecha <= $2`,
      [start, end],
    );
    data.metrics.productos_vendidos = Number(result.rows[0].productos_vendidos);
  }

  if (metrics.includes(REPORT_METRICS.ENTRADAS)) {
    const result = await pool.query(
      `SELECT COUNT(*) AS entradas_dia
       FROM ventas
       WHERE tipo_venta = 'entrada_dia'
         AND fecha >= $1 AND fecha <= $2`,
      [start, end],
    );
    data.metrics.entradas_dia = Number(result.rows[0].entradas_dia);
  }

  if (metrics.includes(REPORT_METRICS.CLIENTES)) {
    const hasCreatedAt = await hasColumn("clientes", "created_at");
    if (hasCreatedAt) {
      const result = await pool.query(
        `SELECT COUNT(*) AS clientes_registrados
         FROM clientes
         WHERE created_at >= $1 AND created_at <= $2`,
        [start, end],
      );
      data.metrics.clientes_registrados = Number(
        result.rows[0].clientes_registrados,
      );
    } else {
      const result = await pool.query(
        `SELECT COUNT(*) AS clientes_registrados
         FROM clientes`,
      );
      data.metrics.clientes_registrados = Number(
        result.rows[0].clientes_registrados,
      );
    }
  }

  if (metrics.includes(REPORT_METRICS.COSTO_PRODUCTOS)) {
    const result = await pool.query(
      `SELECT COALESCE(SUM(d.cantidad * p.precio_compra),0) AS costo_productos
       FROM detalle_ventas d
       JOIN ventas v ON v.id = d.venta_id
       JOIN productos p ON p.id = d.producto_id
       WHERE v.fecha >= $1 AND v.fecha <= $2`,
      [start, end],
    );
    data.metrics.costo_productos = Number(result.rows[0].costo_productos);
  }

  return data;
};

const renderReportPdf = (reportData) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    doc.fontSize(18).text("Reporte Manual", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Rango: ${reportData.range.label}`);
    doc.moveDown();

    doc.fontSize(13).text("Resumen", { underline: true });
    doc.moveDown(0.5);

    const rows = Object.entries(reportData.metrics);
    if (rows.length === 0) {
      doc.text("No hay metricas seleccionadas.");
    } else {
      rows.forEach(([key, value]) => {
        const label = key.replace(/_/g, " ");
        doc.fontSize(11).text(`${label}: ${value}`);
      });
    }

    doc.end();
  });

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
    res.status(500).json({ error: "Error interno del servidor" });
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
    res.status(500).json({ error: "Error interno del servidor" });
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
    res.status(500).json({ error: "Error interno del servidor" });
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
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// EGRESOS DEL MES
const egresosMes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COALESCE(SUM(monto),0) AS egresos_mes
      FROM egresos
      WHERE DATE_TRUNC('month',fecha) = DATE_TRUNC('month',CURRENT_DATE)
    `);

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// GANANCIA DEL MES
const gananciaMes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COALESCE(SUM(total),0)
         FROM ventas
         WHERE DATE_TRUNC('month',fecha) = DATE_TRUNC('month',CURRENT_DATE))
        -
        (SELECT COALESCE(SUM(monto),0)
         FROM egresos
         WHERE DATE_TRUNC('month',fecha) = DATE_TRUNC('month',CURRENT_DATE))
        AS ganancia_mes
    `);

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
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
    res.status(500).json({ error: "Error interno del servidor" });
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
    res.status(500).json({ error: "Error interno del servidor" });
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
    res.status(500).json({ error: "Error interno del servidor" });
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
      WHERE fecha_fin >= CURRENT_DATE AND estado = 'activa'
    `);

    const membresiasPorVencer = await pool.query(`
      SELECT c.nombre AS cliente, m.fecha_fin
      FROM membresias m
      JOIN clientes c ON c.id = m.cliente_id
      WHERE m.estado = 'activa'
        AND m.fecha_fin >= CURRENT_DATE
        AND m.fecha_fin <= CURRENT_DATE + INTERVAL '3 days'
      ORDER BY m.fecha_fin ASC
      LIMIT 5
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
      membresias_por_vencer: membresiasPorVencer.rows,
      productos_stock_bajo: stockBajo.rows[0].productos_stock_bajo,
    });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// REPORTE MANUAL (JSON)
const reporteManual = async (req, res) => {
  try {
    const { from, to, year, metrics } = req.body || {};
    const range = parseReportRange({ from, to, year });
    if (!range) {
      return res.status(400).json({ message: "Rango de fechas inválido" });
    }

    if (!Array.isArray(metrics) || metrics.length === 0) {
      return res
        .status(400)
        .json({ message: "Selecciona al menos una métrica" });
    }

    const reportData = await buildManualReport({ range, metrics });
    return res.json(reportData);
  } catch (error) {
    console.error("reporteManual error", error);
    res.status(500).json({
      error: "Error interno del servidor",
      details: error.message,
    });
  }
};

// REPORTE MANUAL (PDF)
const reporteManualPdf = async (req, res) => {
  try {
    const { from, to, year, metrics } = req.body || {};
    const range = parseReportRange({ from, to, year });
    if (!range) {
      return res.status(400).json({ message: "Rango de fechas inválido" });
    }

    if (!Array.isArray(metrics) || metrics.length === 0) {
      return res
        .status(400)
        .json({ message: "Selecciona al menos una métrica" });
    }

    const reportData = await buildManualReport({ range, metrics });
    const pdfBuffer = await renderReportPdf(reportData);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=reportes-manual.pdf",
    );
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("reporteManualPdf error", error);
    res.status(500).json({
      error: "Error interno del servidor",
      details: error.message,
    });
  }
};

module.exports = {
  ingresosHoy,
  egresosHoy,
  gananciaHoy,
  ingresosMes,
  egresosMes,
  gananciaMes,
  productosMasVendidos,
  membresiasVencidas,
  productosStockBajo,
  dashboard,
  reporteManual,
  reporteManualPdf,
};
