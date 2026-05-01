const pool = require("../../config/database");

const validarDatosTipoMembresia = ({ nombre, duracion_dias, precio }) => {
  if (!nombre || !nombre.trim()) {
    return "nombre es requerido";
  }

  const duracion = Number(duracion_dias);
  const precioNumber = Number(precio);

  if (!Number.isInteger(duracion) || duracion <= 0) {
    return "duracion_dias debe ser un entero mayor a 0";
  }

  if (!Number.isFinite(precioNumber) || precioNumber <= 0) {
    return "precio debe ser un número mayor a 0";
  }

  return null;
};

const crearTipoMembresia = async (req, res) => {
  try {
    const { nombre, duracion_dias, precio, descripcion } = req.body;
    const errorValidacion = validarDatosTipoMembresia(req.body);

    if (errorValidacion) {
      return res.status(400).json({ message: errorValidacion });
    }

    const result = await pool.query(
      `INSERT INTO tipos_membresia
       (nombre, duracion_dias, precio, descripcion)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [nombre.trim(), duracion_dias, precio, descripcion],
    );

    res.status(201).json({
      message: "Tipo de membresía creado",
      tipo: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const obtenerTiposMembresia = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tipos_membresia ORDER BY id DESC",
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const actualizarTipoMembresia = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, duracion_dias, precio, descripcion } = req.body;
    const errorValidacion = validarDatosTipoMembresia(req.body);

    if (errorValidacion) {
      return res.status(400).json({ message: errorValidacion });
    }

    const result = await pool.query(
      `UPDATE tipos_membresia
       SET nombre=$1,
           duracion_dias=$2,
           precio=$3,
           descripcion=$4
       WHERE id=$5
       RETURNING *`,
      [nombre.trim(), duracion_dias, precio, descripcion, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Tipo de membresía no encontrado" });
    }

    res.json({
      message: "Tipo de membresía actualizado",
      tipo: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const eliminarTipoMembresia = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM tipos_membresia WHERE id=$1 RETURNING id",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Tipo de membresía no encontrado" });
    }

    res.json({ message: "Tipo de membresía eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = {
  crearTipoMembresia,
  obtenerTiposMembresia,
  actualizarTipoMembresia,
  eliminarTipoMembresia,
};
