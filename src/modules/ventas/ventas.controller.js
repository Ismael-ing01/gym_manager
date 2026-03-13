const pool = require("../../config/database");

const registrarEntradaDia = async (req, res) => {
  try {
    const { metodo_pago_id, total, descripcion } = req.body;

    const result = await pool.query(
      `INSERT INTO ventas (metodo_pago_id, tipo_venta, total, descripcion)
       VALUES ($1,'entrada_dia',$2,$3)
       RETURNING *`,
      [metodo_pago_id, total, descripcion],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const venderProducto = async (req, res) => {
  const client = await pool.connect();

  try {
    const { metodo_pago_id, productos } = req.body;

    /*
    productos = [
      { producto_id: 1, cantidad: 2 },
      { producto_id: 3, cantidad: 1 }
    ]
    */

    await client.query("BEGIN");

    let totalVenta = 0;

    const venta = await client.query(
      `INSERT INTO ventas (metodo_pago_id,tipo_venta,total)
       VALUES ($1,'producto',0)
       RETURNING id`,
      [metodo_pago_id],
    );

    const venta_id = venta.rows[0].id;

    for (const item of productos) {
      const producto = await client.query(
        "SELECT precio, stock FROM productos WHERE id=$1",
        [item.producto_id],
      );

      if (producto.rows.length === 0) {
        throw new Error("Producto no encontrado");
      }

      const precio = producto.rows[0].precio_venta;
      const stock = producto.rows[0].stock;

      // 🔴 verificar stock
      if (stock < item.cantidad) {
        throw new Error(
          `Stock insuficiente para el producto ID ${item.producto_id}`,
        );
      }

      const subtotal = precio * item.cantidad;

      totalVenta += subtotal;

      // guardar detalle de venta
      await client.query(
        `INSERT INTO detalle_ventas
        (venta_id,producto_id,cantidad,precio_unitario,subtotal)
        VALUES ($1,$2,$3,$4,$5)`,
        [venta_id, item.producto_id, item.cantidad, precio, subtotal],
      );

      // 🔵 descontar stock
      await client.query(
        `UPDATE productos
         SET stock = stock - $1
         WHERE id = $2`,
        [item.cantidad, item.producto_id],
      );
    }

    await client.query("UPDATE ventas SET total=$1 WHERE id=$2", [
      totalVenta,
      venta_id,
    ]);

    await client.query("COMMIT");

    res.status(201).json({
      message: "Venta registrada",
      venta_id,
      total: totalVenta,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

const venderMembresia = async (req, res) => {
  const client = await pool.connect();

  try {
    const { cliente_id, tipo_membresia_id, metodo_pago_id } = req.body;

    await client.query("BEGIN");

    // obtener tipo de membresia
    const tipo = await client.query(
      "SELECT precio,duracion_dias FROM tipos_membresia WHERE id=$1",
      [tipo_membresia_id],
    );

    if (tipo.rows.length === 0) {
      throw new Error("Tipo de membresia no encontrado");
    }

    const precio = tipo.rows[0].precio;
    const duracion = tipo.rows[0].duracion_dias;

    // registrar venta
    const venta = await client.query(
      `INSERT INTO ventas (cliente_id,metodo_pago_id,tipo_venta,total)
       VALUES ($1,$2,'membresia',$3)
       RETURNING id`,
      [cliente_id, metodo_pago_id, precio],
    );

    const venta_id = venta.rows[0].id;

    // buscar ultima membresia
    const ultima = await client.query(
      `SELECT fecha_fin
       FROM membresias
       WHERE cliente_id=$1
       ORDER BY fecha_fin DESC
       LIMIT 1`,
      [cliente_id],
    );

    let fecha_inicio;

    if (ultima.rows.length > 0 && ultima.rows[0].fecha_fin > new Date()) {
      fecha_inicio = ultima.rows[0].fecha_fin;
    } else {
      fecha_inicio = new Date();
    }

    // calcular fecha fin
    const fechaFin = await client.query(
      `SELECT $1::date + $2 * INTERVAL '1 day' AS fecha_fin`,
      [fecha_inicio, duracion],
    );

    const fecha_fin = fechaFin.rows[0].fecha_fin;

    // crear membresia
    await client.query(
      `INSERT INTO membresias
      (cliente_id,tipo_membresia_id,fecha_inicio,fecha_fin,venta_id)
      VALUES ($1,$2,$3,$4,$5)`,
      [cliente_id, tipo_membresia_id, fecha_inicio, fecha_fin, venta_id],
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Membresia vendida correctamente",
      venta_id,
      fecha_inicio,
      fecha_fin,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

module.exports = {
  registrarEntradaDia,
  venderProducto,
  venderMembresia,
};
