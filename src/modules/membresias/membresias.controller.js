const pool = require("../../config/database");

// VER TODAS LAS MEMBRESIAS
const obtenerMembresias = async (req, res) => {
  try {
    if (req.query.page) {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const countResult = await pool.query('SELECT COUNT(*) FROM membresias');
      const total = parseInt(countResult.rows[0].count);

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
        LIMIT $1 OFFSET $2
      `, [limit, offset]);

      return res.json({
        data: result.rows,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      });
    } else {
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
      return res.json(result.rows);
    }
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
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

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Membresía no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
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
    res.status(500).json({ error: "Error interno del servidor" });
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

    const estadosPermitidos = ["activa", "inactiva"];
    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        message: "estado inválido. Debe ser activa o inactiva",
      });
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
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ELIMINAR MEMBRESIA
const eliminarMembresia = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM membresias WHERE id=$1 RETURNING id",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Membresía no encontrada" });
    }

    res.json({ message: "Membresía eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = {
  obtenerMembresias,
  obtenerMembresiaPorId,
  buscarPorNombre,
  actualizarMembresia,
  eliminarMembresia,
};
