const pool = require("../../config/database");

const crearCliente = async (req, res) => {
  try {
    const { nombre, cedula, telefono, email } = req.body;

    if (!nombre || !cedula) {
      return res
        .status(400)
        .json({ message: "nombre y cedula son requeridos" });
    }

    const result = await pool.query(
      `INSERT INTO clientes (nombre, cedula, telefono, email)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
      [nombre, cedula, telefono, email],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const obtenerClientes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = (req.query.search || "").toString().trim();

    const params = [];
    let whereClause = "WHERE estado = true";

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (nombre ILIKE $${params.length} OR cedula ILIKE $${params.length})`;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM clientes ${whereClause}`,
      params,
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limit);
    params.push(offset);

    const result = await pool.query(
      `SELECT * FROM clientes ${whereClause} ORDER BY id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    return res.json({
      data: result.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const obtenerClientePorId = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM clientes WHERE id = $1 AND estado = true",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const actualizarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, cedula, telefono, email } = req.body;

    if (!nombre || !cedula) {
      return res
        .status(400)
        .json({ message: "nombre y cedula son requeridos" });
    }

    const result = await pool.query(
      `UPDATE clientes
             SET nombre=$1, cedula=$2, telefono=$3, email=$4
             WHERE id=$5
             RETURNING *`,
      [nombre, cedula, telefono, email, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const desactivarCliente = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE clientes SET estado=false WHERE id=$1 RETURNING id`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    res.json({ message: "Cliente desactivado" });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = {
  crearCliente,
  obtenerClientes,
  obtenerClientePorId,
  actualizarCliente,
  desactivarCliente,
};
