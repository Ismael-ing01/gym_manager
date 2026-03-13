const pool = require("../../config/database");

// CREAR MEMBRESIA
const crearMembresia = async (req, res) => {
  try {
    const { cliente_id, tipo_membresia_id, fecha_inicio, metodo_pago } =
      req.body;

    // obtener duración del plan
    const tipo = await pool.query(
      "SELECT duracion_dias FROM tipos_membresia WHERE id=$1",
      [tipo_membresia_id],
    );

    if (tipo.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Tipo de membresía no encontrado" });
    }

    const duracion = tipo.rows[0].duracion_dias;

    // calcular fecha fin
    const fechaFin = await pool.query(
      `SELECT $1::date + $2 * INTERVAL '1 day' AS fecha_fin`,
      [fecha_inicio, duracion],
    );

    const fecha_fin = fechaFin.rows[0].fecha_fin;

    const result = await pool.query(
      `INSERT INTO membresias
       (cliente_id, tipo_membresia_id, fecha_inicio, fecha_fin, metodo_pago)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [cliente_id, tipo_membresia_id, fecha_inicio, fecha_fin, metodo_pago],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

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
      m.metodo_pago,
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

// ACTUALIZAR MEMBRESIA
const actualizarMembresia = async (req, res) => {
  const { id } = req.params;
  const { cliente_id, tipo_membresia_id, fecha_inicio, metodo_pago } = req.body;

  try {
    const tipo = await pool.query(
      "SELECT duracion_dias FROM tipos_membresia WHERE id=$1",
      [tipo_membresia_id],
    );

    const duracion = tipo.rows[0].duracion_dias;

    const fechaFin = await pool.query(
      `SELECT $1::date + $2 * INTERVAL '1 day' AS fecha_fin`,
      [fecha_inicio, duracion],
    );

    const fecha_fin = fechaFin.rows[0].fecha_fin;

    const result = await pool.query(
      `UPDATE membresias
       SET cliente_id=$1,
           tipo_membresia_id=$2,
           fecha_inicio=$3,
           fecha_fin=$4,
           metodo_pago=$5
       WHERE id=$6
       RETURNING *`,
      [cliente_id, tipo_membresia_id, fecha_inicio, fecha_fin, metodo_pago, id],
    );

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
