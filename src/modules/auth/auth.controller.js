const pool = require("../../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO usuarios (nombre, email, password, rol)
             VALUES ($1, $2, $3, $4)
             RETURNING id, nombre, email, rol`,
      [nombre, email, hashedPassword, rol],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      `SELECT * FROM usuarios WHERE email = $1 AND estado = true`,
      [email],
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Usuario no encontrado" });
    }

    const user = result.rows[0];

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(400).json({ message: "Contraseña incorrecta" });
    }

    const token = jwt.sign(
      { id: user.id, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const obtenerRegistros = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM usuarios WHERE estado = true`,
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  registerAdmin,
  login,
  obtenerRegistros,
};
