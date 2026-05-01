const pool = require("../../config/database");

const crearErrorHttp = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const registrarEntradaDia = async (req, res) => {
  try {
    const { metodo_pago_id, total, descripcion } = req.body;

    const metodoPagoId = Number(metodo_pago_id);
    const totalNumber = Number(total);

    if (!Number.isInteger(metodoPagoId) || metodoPagoId <= 0) {
      return res
        .status(400)
        .json({ message: "metodo_pago_id debe ser un entero mayor a 0" });
    }

    if (!Number.isFinite(totalNumber) || totalNumber <= 0) {
      return res
        .status(400)
        .json({ message: "total debe ser un número mayor a 0" });
    }

    const result = await pool.query(
      `INSERT INTO ventas (metodo_pago_id, tipo_venta, total, descripcion)
       VALUES ($1,'entrada_dia',$2,$3)
       RETURNING *`,
      [metodoPagoId, totalNumber, descripcion],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const venderProducto = async (req, res) => {
  const client = await pool.connect();

  try {
    const { metodo_pago_id, productos } = req.body;

    if (!metodo_pago_id || !productos || !Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ message: "metodo_pago_id y productos (array no vacío) son requeridos" });
    }

    const metodoPagoId = Number(metodo_pago_id);
    if (!Number.isInteger(metodoPagoId) || metodoPagoId <= 0) {
      return res
        .status(400)
        .json({ message: "metodo_pago_id debe ser un entero mayor a 0" });
    }

    /*
    productos = [
      { producto_id: 1, cantidad: 2 },
      { producto_id: 3, cantidad: 1 }
    ]
    */

    await client.query("BEGIN");

    let totalVenta = 0;
    const detalles = [];

    for (const item of productos) {
      const productoId = Number(item.producto_id);
      const cantidad = Number(item.cantidad);

      if (!Number.isInteger(productoId) || productoId <= 0) {
        throw crearErrorHttp("producto_id inválido en el detalle de venta", 400);
      }

      if (!Number.isInteger(cantidad) || cantidad <= 0) {
        throw crearErrorHttp("cantidad debe ser un entero mayor a 0", 400);
      }

      const producto = await client.query(
        "SELECT precio_venta, stock FROM productos WHERE id=$1",
        [productoId],
      );

      if (producto.rows.length === 0) {
        throw crearErrorHttp(`Producto ${productoId} no encontrado`, 404);
      }

      const precio = producto.rows[0].precio_venta;
      const stock = producto.rows[0].stock;

      if (stock < cantidad) {
        throw crearErrorHttp(
          `Stock insuficiente para el producto ID ${productoId}`,
          409,
        );
      }

      const subtotal = precio * cantidad;
      totalVenta += subtotal;
      detalles.push({ productoId, cantidad, precio, subtotal });
    }

    if (totalVenta <= 0) {
      throw crearErrorHttp("El total de la venta debe ser mayor a 0", 400);
    }

    const venta = await client.query(
      `INSERT INTO ventas (metodo_pago_id,tipo_venta,total)
       VALUES ($1,'producto',$2)
       RETURNING id`,
      [metodoPagoId, totalVenta],
    );

    const venta_id = venta.rows[0].id;

    for (const det of detalles) {
      await client.query(
        `INSERT INTO detalle_ventas
        (venta_id,producto_id,cantidad,precio_unitario,subtotal)
        VALUES ($1,$2,$3,$4,$5)`,
        [venta_id, det.productoId, det.cantidad, det.precio, det.subtotal],
      );

      await client.query(
        `UPDATE productos
         SET stock = stock - $1
         WHERE id = $2`,
        [det.cantidad, det.productoId],
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Venta registrada",
      venta_id,
      total: totalVenta,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    const statusCode = error.statusCode || 500;
    console.error('Error en venderProducto:', error);
    res.status(statusCode).json({
      error:
        statusCode >= 500 ? "Error interno del servidor" : error.message,
    });
  } finally {
    client.release();
  }
};

const venderMembresia = async (req, res) => {
  const client = await pool.connect();

  try {
    const { cliente_id, tipo_membresia_id, metodo_pago_id } = req.body;

    const clienteId = Number(cliente_id);
    const tipoMembresiaId = Number(tipo_membresia_id);
    const metodoPagoId = Number(metodo_pago_id);

    if (!cliente_id || !tipo_membresia_id || !metodo_pago_id) {
      return res.status(400).json({ message: "cliente_id, tipo_membresia_id y metodo_pago_id son requeridos" });
    }

    if (!Number.isInteger(clienteId) || clienteId <= 0) {
      return res.status(400).json({ message: "cliente_id debe ser un entero mayor a 0" });
    }

    if (!Number.isInteger(tipoMembresiaId) || tipoMembresiaId <= 0) {
      return res
        .status(400)
        .json({ message: "tipo_membresia_id debe ser un entero mayor a 0" });
    }

    if (!Number.isInteger(metodoPagoId) || metodoPagoId <= 0) {
      return res
        .status(400)
        .json({ message: "metodo_pago_id debe ser un entero mayor a 0" });
    }

    await client.query("BEGIN");

    // obtener tipo de membresia
    const tipo = await client.query(
      "SELECT precio,duracion_dias FROM tipos_membresia WHERE id=$1",
      [tipoMembresiaId],
    );

    if (tipo.rows.length === 0) {
      throw crearErrorHttp("Tipo de membresía no encontrado", 404);
    }

    const precio = tipo.rows[0].precio;
    const duracion = tipo.rows[0].duracion_dias;

    // registrar venta
    const venta = await client.query(
      `INSERT INTO ventas (cliente_id,metodo_pago_id,tipo_venta,total)
       VALUES ($1,$2,'membresia',$3)
       RETURNING id`,
      [clienteId, metodoPagoId, precio],
    );

    const venta_id = venta.rows[0].id;

    // buscar ultima membresia
    const ultima = await client.query(
      `SELECT fecha_fin
       FROM membresias
       WHERE cliente_id=$1
       ORDER BY fecha_fin DESC
       LIMIT 1`,
      [clienteId],
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
      [clienteId, tipoMembresiaId, fecha_inicio, fecha_fin, venta_id],
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

    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      error:
        statusCode >= 500 ? "Error interno del servidor" : error.message,
    });
  } finally {
    client.release();
  }
};

module.exports = {
  registrarEntradaDia,
  venderProducto,
  venderMembresia,
};
