const pool = require("../../config/database.js");

// Crear metodo de pago
const crearMetodoPago = async (req, res) => {
  const { nombre, descripcion } = req.body;

  try {
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ message: "nombre es requerido" });
    }
    const result = await pool.query(
      "INSERT INTO metodos_pago (nombre, descripcion) VALUES ($1, $2) RETURNING *",
      [nombre.trim(), descripcion],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener todos
const obtenerMetodosPago = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM metodos_pago ORDER BY id");

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
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

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Método de pago no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Actualizar
const actualizarMetodoPago = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion } = req.body;

  try {
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ message: "nombre es requerido" });
    }
    const result = await pool.query(
      "UPDATE metodos_pago SET nombre=$1, descripcion=$2 WHERE id=$3 RETURNING *",
      [nombre.trim(), descripcion, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Método de pago no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Eliminar
const eliminarMetodoPago = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM metodos_pago WHERE id=$1 RETURNING id",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Método de pago no encontrado" });
    }

    res.json({ message: "Metodo de pago eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = {
  crearMetodoPago,
  obtenerMetodosPago,
  obtenerMetodoPagoPorId,
  actualizarMetodoPago,
  eliminarMetodoPago,
};
