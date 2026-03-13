const pool = require("../../config/database");

const crearCliente = async (req, res) => {
  try {
    const { nombre, cedula, telefono, email } = req.body;

    if (!nombre || !cedula) {
      return res.status(400).json({ message: "nombre y cedula son requeridos" });
    }

    const result = await pool.query(
      `INSERT INTO clientes (nombre, cedula, telefono, email)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
      [nombre, cedula, telefono, email],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const obtenerClientes = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM clientes WHERE estado = true ORDER BY id DESC`,
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const actualizarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, cedula, telefono, email } = req.body;

    if (!nombre || !cedula) {
      return res.status(400).json({ message: "nombre y cedula son requeridos" });
    }

    const result = await pool.query(
      `UPDATE clientes
             SET nombre=$1, cedula=$2, telefono=$3, email=$4
             WHERE id=$5
             RETURNING *`,
      [nombre, cedula, telefono, email, id],
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const desactivarCliente = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(`UPDATE clientes SET estado=false WHERE id=$1`, [id]);

    res.json({ message: "Cliente desactivado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  crearCliente,
  obtenerClientes,
  actualizarCliente,
  desactivarCliente,
};
