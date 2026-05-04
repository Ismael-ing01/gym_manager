const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
const shortStamp = stamp.slice(-8);

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const toDateOnly = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const main = async () => {
  const client = await pool.connect();
  let checkpoint = "inicio";

  try {
    await client.query("BEGIN");

    checkpoint = "metodos_pago";
    // Metodos de pago base
    const baseMetodos = ["Efectivo", "Transferencia"];
    for (const nombre of baseMetodos) {
      await client.query(
        `INSERT INTO metodos_pago (nombre, descripcion)
         SELECT $1::varchar, $2::text
         WHERE NOT EXISTS (SELECT 1 FROM metodos_pago WHERE nombre = $1::varchar)`,
        [nombre, `DEMO ${nombre}`],
      );
    }

    const metodoRows = await client.query(
      "SELECT id, nombre FROM metodos_pago ORDER BY id",
    );
    const metodoPago = metodoRows.rows;
    const metodoEfectivo = metodoPago.find((m) => m.nombre === "Efectivo");
    const metodoTransferencia = metodoPago.find(
      (m) => m.nombre === "Transferencia",
    );

    // Usuario admin demo
    checkpoint = "usuario_admin";
    const adminEmail = `admin.demo.${stamp}@gym.test`;
    const adminExists = await client.query(
      "SELECT id FROM usuarios WHERE email = $1",
      [adminEmail],
    );
    if (adminExists.rows.length === 0) {
      const hash = await bcrypt.hash("Admin123!", 10);
      await client.query(
        `INSERT INTO usuarios (nombre, email, password, rol)
         VALUES ($1, $2, $3, $4)`,
        ["Admin Demo", adminEmail, hash, "ADMIN"],
      );
    }

    // Clientes demo
    checkpoint = "clientes";
    const clientes = [];
    for (let i = 1; i <= 12; i += 1) {
      const nombre = `Cliente Demo ${i}`;
      const cedula = `CD${shortStamp}${i}`;
      const telefono = `099000${i.toString().padStart(3, "0")}`;
      const email = `cliente.demo.${i}.${stamp}@gym.test`;
      const result = await client.query(
        `INSERT INTO clientes (nombre, cedula, telefono, email)
         VALUES ($1,$2,$3,$4)
         RETURNING id`,
        [nombre, cedula, telefono, email],
      );
      clientes.push(result.rows[0].id);
    }

    // Tipos de membresia demo
    checkpoint = "tipos_membresia";
    const tipos = [
      { nombre: "Semanal", duracion_dias: 7, precio: 8.0 },
      { nombre: "Quincenal", duracion_dias: 15, precio: 12.0 },
      { nombre: "Mensual", duracion_dias: 30, precio: 20.0 },
      { nombre: "Trimestral", duracion_dias: 90, precio: 50.0 },
      { nombre: "Anual", duracion_dias: 365, precio: 180.0 },
    ];

    const tipoIds = [];
    for (const tipo of tipos) {
      const result = await client.query(
        `INSERT INTO tipos_membresia (nombre, duracion_dias, precio, descripcion)
         VALUES ($1,$2,$3,$4)
         RETURNING id`,
        [tipo.nombre, tipo.duracion_dias, tipo.precio, `DEMO ${tipo.nombre}`],
      );
      tipoIds.push({ id: result.rows[0].id, ...tipo });
    }

    // Productos demo
    checkpoint = "productos";
    const productos = [
      { nombre: "Whey Demo", compra: 18, venta: 30, stock: 40 },
      { nombre: "Creatina Demo", compra: 12, venta: 22, stock: 30 },
      { nombre: "BCAA Demo", compra: 10, venta: 18, stock: 25 },
      { nombre: "Barra Energetica Demo", compra: 0.5, venta: 1.2, stock: 120 },
      { nombre: "Agua Demo", compra: 0.3, venta: 0.8, stock: 200 },
      { nombre: "Cafe Demo", compra: 0.4, venta: 1.0, stock: 150 },
      { nombre: "Toalla Demo", compra: 2.5, venta: 6.0, stock: 20 },
      { nombre: "Cinta Demo", compra: 1.2, venta: 3.0, stock: 35 },
      { nombre: "Guantes Demo", compra: 4.0, venta: 9.0, stock: 18 },
      { nombre: "Proteina Vegana Demo", compra: 19, venta: 32, stock: 22 },
      { nombre: "Termo Demo", compra: 6, venta: 14, stock: 16 },
      { nombre: "Magnesio Demo", compra: 3.5, venta: 7.5, stock: 27 },
    ];

    const productoIds = [];
    for (const prod of productos) {
      const result = await client.query(
        `INSERT INTO productos (nombre, precio_compra, precio_venta, stock)
         VALUES ($1,$2,$3,$4)
         RETURNING id`,
        [prod.nombre, prod.compra, prod.venta, prod.stock],
      );
      productoIds.push({ id: result.rows[0].id, ...prod });
    }

    // Ventas de entrada dia
    checkpoint = "ventas_entrada";
    for (let i = 0; i < 10; i += 1) {
      const metodo = i % 2 === 0 ? metodoEfectivo : metodoTransferencia;
      await client.query(
        `INSERT INTO ventas (metodo_pago_id, tipo_venta, total, descripcion, fecha)
         VALUES ($1, 'entrada_dia', $2, $3, $4)`,
        [
          metodo.id,
          4 + i * 0.5,
          `DEMO entrada ${i + 1}`,
          addDays(new Date(), -i),
        ],
      );
    }

    // Ventas de productos con detalle
    checkpoint = "ventas_productos";
    for (let i = 0; i < 10; i += 1) {
      const metodo = i % 2 === 0 ? metodoEfectivo : metodoTransferencia;
      const producto = productoIds[i % productoIds.length];
      const cantidad = 1 + (i % 3);
      const total = Number(producto.venta) * cantidad;

      const venta = await client.query(
        `INSERT INTO ventas (metodo_pago_id, tipo_venta, total, descripcion, fecha)
         VALUES ($1, 'producto', $2, $3, $4)
         RETURNING id`,
        [metodo.id, total, `DEMO producto ${i + 1}`, addDays(new Date(), -i)],
      );

      await client.query(
        `INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal)
         VALUES ($1,$2,$3,$4,$5)`,
        [venta.rows[0].id, producto.id, cantidad, producto.venta, total],
      );

      await client.query(
        `UPDATE productos SET stock = stock - $1 WHERE id = $2`,
        [cantidad, producto.id],
      );
    }

    // Ventas de membresias con estados variados
    checkpoint = "ventas_membresias";
    const today = toDateOnly(new Date());
    for (let i = 0; i < 10; i += 1) {
      const clienteId = clientes[i % clientes.length];
      const tipo = tipoIds[i % tipoIds.length];
      const metodo = i % 2 === 0 ? metodoEfectivo : metodoTransferencia;

      let startDate = today;
      if (i < 3) {
        startDate = addDays(today, -60 + i * 5); // vencidas
      } else if (i < 7) {
        startDate = addDays(today, -10 + i); // activas
      } else {
        startDate = addDays(today, 3 + i); // futuras
      }

      const venta = await client.query(
        `INSERT INTO ventas (cliente_id, metodo_pago_id, tipo_venta, total, descripcion, fecha)
         VALUES ($1, $2, 'membresia', $3, $4, $5)
         RETURNING id`,
        [
          clienteId,
          metodo.id,
          tipo.precio,
          `DEMO_MEMBERSHIP_${stamp}_${i + 1}`,
          addDays(new Date(), -i),
        ],
      );

      const fechaFinResult = await client.query(
        `SELECT $1::date + $2 * INTERVAL '1 day' AS fecha_fin`,
        [startDate, tipo.duracion_dias],
      );
      const fechaFin = fechaFinResult.rows[0].fecha_fin;
      const estado =
        toDateOnly(new Date(fechaFin)) < today ? "inactiva" : "activa";

      await client.query(
        `INSERT INTO membresias (cliente_id, tipo_membresia_id, fecha_inicio, fecha_fin, estado, venta_id)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [clienteId, tipo.id, startDate, fechaFin, estado, venta.rows[0].id],
      );
    }

    // Egresos demo
    checkpoint = "egresos";
    const egresos = [
      { desc: "Compra de implementos", monto: 45, cat: "Inventario" },
      { desc: "Pago de servicios", monto: 80, cat: "Servicios" },
      { desc: "Publicidad local", monto: 25, cat: "Marketing" },
      { desc: "Limpieza", monto: 15, cat: "Operativo" },
      { desc: "Mantenimiento equipos", monto: 60, cat: "Operativo" },
      { desc: "Reparacion", monto: 35, cat: "Operativo" },
      { desc: "Internet", monto: 20, cat: "Servicios" },
      { desc: "Botiquin", monto: 12, cat: "Operativo" },
      { desc: "Uniformes", monto: 30, cat: "Inventario" },
      { desc: "Impuestos", monto: 55, cat: "Administracion" },
    ];

    for (let i = 0; i < egresos.length; i += 1) {
      const metodo = i % 2 === 0 ? metodoEfectivo : metodoTransferencia;
      await client.query(
        `INSERT INTO egresos (descripcion, monto, metodo_pago_id, categoria, fecha)
         VALUES ($1,$2,$3,$4,$5)`,
        [
          egresos[i].desc,
          egresos[i].monto,
          metodo.id,
          egresos[i].cat,
          addDays(new Date(), -i),
        ],
      );
    }

    await client.query("COMMIT");

    checkpoint = "resumen";
    const resumen = await client.query(
      `SELECT
        (SELECT COUNT(*) FROM clientes) AS clientes,
        (SELECT COUNT(*) FROM productos) AS productos,
        (SELECT COUNT(*) FROM tipos_membresia) AS tipos_membresia,
        (SELECT COUNT(*) FROM ventas) AS ventas,
        (SELECT COUNT(*) FROM membresias) AS membresias,
        (SELECT COUNT(*) FROM egresos) AS egresos
      `,
    );

    const outPath = path.resolve("seed-demo.json");
    fs.writeFileSync(
      outPath,
      JSON.stringify({ adminEmail, adminPassword: "Admin123!" }, null, 2),
    );

    console.log("Seed demo completado.");
    console.table(resumen.rows[0]);
    console.log("Usuario demo creado:", adminEmail, "Password: Admin123!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Seed demo fallo:", error.message);
    console.error("Checkpoint:", checkpoint);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
};

main();
