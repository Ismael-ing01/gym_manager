const pool = require("../../config/database");

// Crear egreso
const crearEgreso = async (req, res) => {
  try {
    const { descripcion, monto, metodo_pago_id, categoria } = req.body;

    const result = await pool.query(
      `INSERT INTO egresos (descripcion,monto,metodo_pago_id,categoria)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [descripcion, monto, metodo_pago_id, categoria],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener todos los egresos
const obtenerEgresos = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, m.nombre as metodo_pago
       FROM egresos e
       LEFT JOIN metodos_pago m ON e.metodo_pago_id = m.id
       ORDER BY fecha DESC`,
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener egreso por ID
const obtenerEgresoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("SELECT * FROM egresos WHERE id=$1", [id]);

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar egreso
const actualizarEgreso = async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion, monto, metodo_pago_id, categoria } = req.body;

    const result = await pool.query(
      `UPDATE egresos
       SET descripcion=$1,monto=$2,metodo_pago_id=$3,categoria=$4
       WHERE id=$5
       RETURNING *`,
      [descripcion, monto, metodo_pago_id, categoria, id],
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar egreso
const eliminarEgreso = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM egresos WHERE id=$1", [id]);

    res.json({ message: "Egreso eliminado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  crearEgreso,
  obtenerEgresos,
  obtenerEgresoPorId,
  actualizarEgreso,
  eliminarEgreso,
};
