const pool = require("../../config/database");

const crearProducto = async (req, res) => {
  try {
    const { nombre, precio_compra, precio_venta, stock } = req.body;

    const result = await pool.query(
      `INSERT INTO productos (nombre, precio_compra, precio_venta, stock)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [nombre, precio_compra, precio_venta, stock],
    );

    res.status(201).json({
      message: "Producto creado correctamente",
      producto: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const obtenerProductos = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM productos ORDER BY id DESC");

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const obtenerProducto = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("SELECT * FROM productos WHERE id = $1", [
      id,
    ]);

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, precio_compra, precio_venta, stock } = req.body;

    const result = await pool.query(
      `UPDATE productos
       SET nombre=$1,
           precio_compra=$2,
           precio_venta=$3,
           stock=$4
       WHERE id=$5
       RETURNING *`,
      [nombre, precio_compra, precio_venta, stock, id],
    );

    res.json({
      message: "Producto actualizado",
      producto: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM productos WHERE id=$1", [id]);

    res.json({
      message: "Producto eliminado correctamente",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  crearProducto,
  obtenerProductos,
  obtenerProducto,
  actualizarProducto,
  eliminarProducto,
};
