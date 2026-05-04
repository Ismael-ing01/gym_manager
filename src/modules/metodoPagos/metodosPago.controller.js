const pool = require("../../config/database.js");

const METODOS_PAGO_PERMITIDOS = ["EFECTIVO", "TRANSFERENCIA"];

const normalizarNombreMetodo = (nombre) => {
  if (!nombre) {
    return "";
  }
  const trimmed = String(nombre).trim();
  if (!trimmed) {
    return "";
  }
  return trimmed.toUpperCase();
};

const validarMetodoPago = (nombre) => {
  const normalizado = normalizarNombreMetodo(nombre);
  if (!normalizado) {
    return { ok: false, message: "nombre es requerido" };
  }

  if (!METODOS_PAGO_PERMITIDOS.includes(normalizado)) {
    return {
      ok: false,
      message: "Solo se permiten los metodos: Efectivo y Transferencia",
    };
  }

  const nombreFinal = normalizado === "EFECTIVO" ? "Efectivo" : "Transferencia";

  return { ok: true, nombre: nombreFinal };
};

// Crear metodo de pago
const crearMetodoPago = async (req, res) => {
  const { nombre, descripcion } = req.body;

  try {
    const validacion = validarMetodoPago(nombre);
    if (!validacion.ok) {
      return res.status(400).json({ message: validacion.message });
    }
    const result = await pool.query(
      "INSERT INTO metodos_pago (nombre, descripcion) VALUES ($1, $2) RETURNING *",
      [validacion.nombre, descripcion],
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
    const validacion = validarMetodoPago(nombre);
    if (!validacion.ok) {
      return res.status(400).json({ message: validacion.message });
    }
    const result = await pool.query(
      "UPDATE metodos_pago SET nombre=$1, descripcion=$2 WHERE id=$3 RETURNING *",
      [validacion.nombre, descripcion, id],
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
    const actual = await pool.query(
      "SELECT nombre FROM metodos_pago WHERE id = $1",
      [id],
    );

    if (actual.rows.length === 0) {
      return res.status(404).json({ message: "Método de pago no encontrado" });
    }

    const nombreActual = normalizarNombreMetodo(actual.rows[0].nombre);
    if (METODOS_PAGO_PERMITIDOS.includes(nombreActual)) {
      return res.status(400).json({
        message: "No se puede eliminar un método de pago obligatorio",
      });
    }

    const result = await pool.query(
      "DELETE FROM metodos_pago WHERE id=$1 RETURNING id",
      [id],
    );

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
