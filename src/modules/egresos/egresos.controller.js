const pool = require("../../config/database");

const validarDatosEgreso = ({ descripcion, monto, metodo_pago_id }) => {
  if (!descripcion || !descripcion.trim()) {
    return "descripcion es requerida";
  }

  const montoNumber = Number(monto);
  const metodoPagoId = Number(metodo_pago_id);

  if (!Number.isFinite(montoNumber) || montoNumber <= 0) {
    return "monto debe ser un número mayor a 0";
  }

  if (!Number.isInteger(metodoPagoId) || metodoPagoId <= 0) {
    return "metodo_pago_id debe ser un entero mayor a 0";
  }

  return null;
};

// Crear egreso
const crearEgreso = async (req, res) => {
  try {
    const { descripcion, monto, metodo_pago_id, categoria } = req.body;
    const errorValidacion = validarDatosEgreso(req.body);

    if (errorValidacion) {
      return res.status(400).json({ message: errorValidacion });
    }

    const result = await pool.query(
      `INSERT INTO egresos (descripcion,monto,metodo_pago_id,categoria)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [descripcion.trim(), monto, metodo_pago_id, categoria],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener todos los egresos
const obtenerEgresos = async (req, res) => {
  try {
    if (req.query.page) {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const countResult = await pool.query('SELECT COUNT(*) FROM egresos');
      const total = parseInt(countResult.rows[0].count);

      const result = await pool.query(`
        SELECT e.*, m.nombre as metodo_pago
        FROM egresos e
        LEFT JOIN metodos_pago m ON e.metodo_pago_id = m.id
        ORDER BY fecha DESC
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
        SELECT e.*, m.nombre as metodo_pago
        FROM egresos e
        LEFT JOIN metodos_pago m ON e.metodo_pago_id = m.id
        ORDER BY fecha DESC
      `);
      return res.json(result.rows);
    }
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener egreso por ID
const obtenerEgresoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("SELECT * FROM egresos WHERE id=$1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Egreso no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Actualizar egreso
const actualizarEgreso = async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion, monto, metodo_pago_id, categoria } = req.body;
    const errorValidacion = validarDatosEgreso(req.body);

    if (errorValidacion) {
      return res.status(400).json({ message: errorValidacion });
    }

    const result = await pool.query(
      `UPDATE egresos
       SET descripcion=$1,monto=$2,metodo_pago_id=$3,categoria=$4
       WHERE id=$5
       RETURNING *`,
      [descripcion.trim(), monto, metodo_pago_id, categoria, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Egreso no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Eliminar egreso
const eliminarEgreso = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM egresos WHERE id=$1 RETURNING id",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Egreso no encontrado" });
    }

    res.json({ message: "Egreso eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = {
  crearEgreso,
  obtenerEgresos,
  obtenerEgresoPorId,
  actualizarEgreso,
  eliminarEgreso,
};
