const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
require("dotenv").config();

const files = [
  "docs/sql/00-bootstrap-schema.sql",
  "docs/sql/security-hardening.sql",
];

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

(async () => {
  const report = {
    database: process.env.DB_NAME,
    ranAt: new Date().toISOString(),
    steps: [],
    ok: true,
  };

  try {
    await pool.query("SELECT 1");

    for (const relFile of files) {
      const absFile = path.resolve(relFile);
      const sql = fs.readFileSync(absFile, "utf8");

      try {
        await pool.query(sql);
        report.steps.push({ file: relFile, ok: true });
      } catch (error) {
        report.ok = false;
        report.steps.push({
          file: relFile,
          ok: false,
          error: error.message,
          code: error.code,
          detail: error.detail || null,
          where: error.where || null,
          position: error.position || null,
        });
      }
    }

    try {
      const tables = await pool.query(
        `SELECT table_name
         FROM information_schema.tables
         WHERE table_schema='public'
           AND table_name IN (
             'usuarios','clientes','metodos_pago','productos','tipos_membresia',
             'ventas','detalle_ventas','membresias','egresos'
           )
         ORDER BY table_name`,
      );

      const constraints = await pool.query(
        `SELECT conname
         FROM pg_constraint
         WHERE conname IN (
           'usuarios_email_unique','usuarios_rol_valid','ventas_tipo_valid','ventas_total_positive',
           'egresos_monto_positive','productos_precio_compra_positive','productos_precio_venta_positive',
           'productos_stock_non_negative','tipos_membresia_duracion_positive','tipos_membresia_precio_positive',
           'detalle_ventas_cantidad_positive','membresias_estado_valid'
         )
         ORDER BY conname`,
      );

      report.tables = tables.rows.map((r) => r.table_name);
      report.constraints = constraints.rows.map((r) => r.conname);
    } catch (error) {
      report.ok = false;
      report.validationError = error.message;
    }
  } catch (error) {
    report.ok = false;
    report.connectionError = error.message;
  } finally {
    await pool.end();
  }

  const outPath = path.resolve("sql-run-report.json");
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  if (!report.ok) {
    process.exitCode = 1;
  }
})();
