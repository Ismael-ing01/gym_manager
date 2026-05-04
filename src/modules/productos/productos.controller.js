const pool = require("../../config/database");

const validarDatosProducto = ({
  nombre,
  precio_compra,
  precio_venta,
  stock,
}) => {
  if (!nombre || !nombre.trim()) {
    return "nombre es requerido";
  }

  const compra = Number(precio_compra);
  const venta = Number(precio_venta);
  const inventario = Number(stock);

  if (!Number.isFinite(compra) || compra <= 0) {
    return "precio_compra debe ser un número mayor a 0";
  }

  if (!Number.isFinite(venta) || venta <= 0) {
    return "precio_venta debe ser un número mayor a 0";
  }

  if (!Number.isFinite(inventario) || inventario < 0) {
    return "stock debe ser un número mayor o igual a 0";
  }

  return null;
};

const crearProducto = async (req, res) => {
  try {
    const { nombre, precio_compra, precio_venta, stock } = req.body;
    const errorValidacion = validarDatosProducto(req.body);

    if (errorValidacion) {
      return res.status(400).json({ message: errorValidacion });
    }

    const result = await pool.query(
      `INSERT INTO productos (nombre, precio_compra, precio_venta, stock)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [nombre.trim(), precio_compra, precio_venta, stock],
    );

    res.status(201).json({
      message: "Producto creado correctamente",
      producto: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const obtenerProductos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = (req.query.search || "").toString().trim();

    const params = [];
    let whereClause = "";

    if (search) {
      params.push(`%${search}%`);
      whereClause = `WHERE nombre ILIKE $${params.length}`;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM productos ${whereClause}`,
      params,
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limit);
    params.push(offset);

    const result = await pool.query(
      `SELECT * FROM productos ${whereClause} ORDER BY id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    return res.json({
      data: result.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const obtenerProductoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("SELECT * FROM productos WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, precio_compra, precio_venta, stock } = req.body;
    const errorValidacion = validarDatosProducto(req.body);

    if (errorValidacion) {
      return res.status(400).json({ message: errorValidacion });
    }

    const result = await pool.query(
      `UPDATE productos
       SET nombre=$1,
           precio_compra=$2,
           precio_venta=$3,
           stock=$4
       WHERE id=$5
       RETURNING *`,
      [nombre.trim(), precio_compra, precio_venta, stock, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.json({
      message: "Producto actualizado",
      producto: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM productos WHERE id=$1 RETURNING id",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.json({
      message: "Producto eliminado correctamente",
    });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = {
  crearProducto,
  obtenerProductos,
  obtenerProductoPorId,
  actualizarProducto,
  eliminarProducto,
};
