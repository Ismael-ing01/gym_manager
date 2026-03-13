const pool = require("../../config/database.js");

// Crear metodo de pago
const crearMetodoPago = async (req, res) => {
  const { nombre, descripcion } = req.body;

  try {
    if (!nombre) {
      return res.status(400).json({ message: "nombre es requerido" });
    }
    const result = await pool.query(
      "INSERT INTO metodos_pago (nombre, descripcion) VALUES ($1, $2) RETURNING *",
      [nombre, descripcion],
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener todos
const obtenerMetodosPago = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM metodos_pago ORDER BY id");

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Buscar por ID
const obtenerMetodoPagoPorId = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM metodos_pago WHERE id = $1",
      [id],
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar
const actualizarMetodoPago = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion } = req.body;

  try {
    if (!nombre) {
      return res.status(400).json({ message: "nombre es requerido" });
    }
    const result = await pool.query(
      "UPDATE metodos_pago SET nombre=$1, descripcion=$2 WHERE id=$3 RETURNING *",
      [nombre, descripcion, id],
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar
const eliminarMetodoPago = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM metodos_pago WHERE id=$1", [id]);

    res.json({ message: "Metodo de pago eliminado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  crearMetodoPago,
  obtenerMetodosPago,
  obtenerMetodoPagoPorId,
  actualizarMetodoPago,
  eliminarMetodoPago,
};
