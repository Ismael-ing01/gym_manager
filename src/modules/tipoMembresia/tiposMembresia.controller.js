const pool = require("../../config/database");

const crearTipoMembresia = async (req, res) => {
  try {
    const { nombre, duracion_dias, precio, descripcion } = req.body;

    if (!nombre || !duracion_dias || !precio) {
      return res.status(400).json({ message: "nombre, duracion_dias y precio son requeridos y no pueden ser 0" });
    }

    const result = await pool.query(
      `INSERT INTO tipos_membresia
       (nombre, duracion_dias, precio, descripcion)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [nombre, duracion_dias, precio, descripcion],
    );

    res.status(201).json({
      message: "Tipo de membresía creado",
      tipo: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const obtenerTiposMembresia = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tipos_membresia ORDER BY id DESC",
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const actualizarTipoMembresia = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, duracion_dias, precio, descripcion } = req.body;

    if (!nombre || !duracion_dias || !precio) {
      return res.status(400).json({ message: "nombre, duracion_dias y precio son requeridos y no pueden ser 0" });
    }

    const result = await pool.query(
      `UPDATE tipos_membresia
       SET nombre=$1,
           duracion_dias=$2,
           precio=$3,
           descripcion=$4
       WHERE id=$5
       RETURNING *`,
      [nombre, duracion_dias, precio, descripcion, id],
    );

    res.json({
      message: "Tipo de membresía actualizado",
      tipo: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const eliminarTipoMembresia = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM tipos_membresia WHERE id=$1", [id]);
    res.json({ message: "Tipo de membresía eliminado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  crearTipoMembresia,
  obtenerTiposMembresia,
  actualizarTipoMembresia,
  eliminarTipoMembresia,
};
