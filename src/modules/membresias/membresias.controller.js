const pool = require("../../config/database");

// VER TODAS LAS MEMBRESIAS
const obtenerMembresias = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
      m.id,
      c.nombre AS cliente,
      t.nombre AS plan,
      m.fecha_inicio,
      m.fecha_fin,
      m.estado,
      (m.fecha_fin - CURRENT_DATE) AS dias_restantes
      FROM membresias m
      JOIN clientes c ON c.id = m.cliente_id
      JOIN tipos_membresia t ON t.id = m.tipo_membresia_id
      ORDER BY m.id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// BUSCAR MEMBRESIA POR ID
const obtenerMembresiaPorId = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT 
      m.*,
      c.nombre AS cliente,
      t.nombre AS plan
      FROM membresias m
      JOIN clientes c ON c.id = m.cliente_id
      JOIN tipos_membresia t ON t.id = m.tipo_membresia_id
      WHERE m.id=$1
    `,
      [id],
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// BUSCAR MEMBRESIA POR NOMBRE CLIENTE
const buscarPorNombre = async (req, res) => {
  const { nombre } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT 
      m.id,
      c.nombre AS cliente,
      t.nombre AS plan,
      m.fecha_inicio,
      m.fecha_fin,
      (m.fecha_fin - CURRENT_DATE) AS dias_restantes
      FROM membresias m
      JOIN clientes c ON c.id = m.cliente_id
      JOIN tipos_membresia t ON t.id = m.tipo_membresia_id
      WHERE LOWER(c.nombre) LIKE LOWER($1)
    `,
      [`%${nombre}%`],
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ACTUALIZAR ESTADO DE MEMBRESIA (activa / inactiva)
const actualizarMembresia = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  try {
    if (!estado) {
      return res
        .status(400)
        .json({ message: "estado es requerido (activa / inactiva)" });
    }

    const result = await pool.query(
      `UPDATE membresias
       SET estado=$1
       WHERE id=$2
       RETURNING *`,
      [estado, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Membresía no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ELIMINAR MEMBRESIA
const eliminarMembresia = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM membresias WHERE id=$1", [id]);

    res.json({ message: "Membresía eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  crearMembresia,
  obtenerMembresias,
  obtenerMembresiaPorId,
  buscarPorNombre,
  actualizarMembresia,
  eliminarMembresia,
};
