const pool = require("../../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const roles = require("../../utils/roles");
const { logSecurityEvent } = require("../../utils/security-logger");
const {
  createJti,
  storeRefreshToken,
  consumeRefreshToken,
  revokeRefreshToken,
  revokeAccessToken,
} = require("../../utils/token-store");

const getAccessConfig = () => ({
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
});

const getRefreshConfig = () => ({
  secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
  expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
});

const buildTokenPair = (user) => {
  const access = getAccessConfig();
  const refresh = getRefreshConfig();

  if (!access.secret || !refresh.secret) {
    throw new Error("JWT no configurado en el servidor");
  }

  const accessJti = createJti();
  const refreshJti = createJti();

  const accessToken = jwt.sign(
    { id: user.id, rol: user.rol, type: "access", jti: accessJti },
    access.secret,
    { expiresIn: access.expiresIn },
  );

  const refreshToken = jwt.sign(
    { id: user.id, rol: user.rol, type: "refresh", jti: refreshJti },
    refresh.secret,
    { expiresIn: refresh.expiresIn },
  );

  const decodedRefresh = jwt.decode(refreshToken);
  storeRefreshToken({
    jti: refreshJti,
    userId: user.id,
    exp: decodedRefresh.exp,
  });

  return {
    accessToken,
    refreshToken,
  };
};

const register = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password || !rol) {
      return res
        .status(400)
        .json({ message: "nombre, email, password y rol son requeridos" });
    }

    const rolesValidos = Object.values(roles);
    if (!rolesValidos.includes(rol)) {
      return res.status(400).json({
        message: `rol inválido. Roles permitidos: ${rolesValidos.join(", ")}`,
      });
    }

    const usuarioExistente = await pool.query(
      "SELECT id FROM usuarios WHERE email = $1 LIMIT 1",
      [email],
    );

    if (usuarioExistente.rows.length > 0) {
      logSecurityEvent("auth_register_email_exists", {
        ip: req.ip,
        email,
      });
      return res.status(409).json({ message: "El email ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO usuarios (nombre, email, password, rol)
             VALUES ($1, $2, $3, $4)
             RETURNING id, nombre, email, rol`,
      [nombre, email, hashedPassword, rol],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
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
      logSecurityEvent("auth_login_user_not_found", {
        ip: req.ip,
        email,
      });
      return res.status(400).json({ message: "Usuario no encontrado" });
    }

    const user = result.rows[0];

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      logSecurityEvent("auth_login_wrong_password", {
        ip: req.ip,
        email,
      });
      return res.status(400).json({ message: "Contraseña incorrecta" });
    }

    const { accessToken, refreshToken } = buildTokenPair(user);

    res.json({
      token: accessToken,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        nombre: user.nombre,
        rol: user.rol,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const obtenerRegistros = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM usuarios WHERE estado = true`,
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "refreshToken es requerido" });
    }

    const refreshConfig = getRefreshConfig();
    if (!refreshConfig.secret) {
      return res
        .status(500)
        .json({ message: "JWT no configurado en el servidor" });
    }

    const decoded = jwt.verify(refreshToken, refreshConfig.secret);
    if (decoded.type !== "refresh" || !decoded.jti) {
      logSecurityEvent("auth_refresh_invalid_type", { ip: req.ip });
      return res.status(401).json({ message: "refreshToken inválido" });
    }

    const isValidSession = consumeRefreshToken({
      jti: decoded.jti,
      userId: decoded.id,
    });

    if (!isValidSession) {
      logSecurityEvent("auth_refresh_replayed_or_revoked", {
        ip: req.ip,
        userId: decoded.id,
      });
      return res
        .status(401)
        .json({ message: "refreshToken revocado o expirado" });
    }

    const result = await pool.query(
      `SELECT id, nombre, rol FROM usuarios WHERE id = $1 AND estado = true`,
      [decoded.id],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Usuario no válido" });
    }

    const user = result.rows[0];
    const tokenPair = buildTokenPair(user);

    res.json({
      token: tokenPair.accessToken,
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      user,
    });
  } catch (_error) {
    return res.status(401).json({ message: "refreshToken inválido" });
  }
};

const logout = async (req, res) => {
  try {
    if (req.user && req.user.jti && req.user.exp) {
      revokeAccessToken({
        jti: req.user.jti,
        exp: req.user.exp,
      });
    }

    const { refreshToken } = req.body || {};
    if (refreshToken) {
      const refreshConfig = getRefreshConfig();
      if (refreshConfig.secret) {
        try {
          const decodedRefresh = jwt.verify(refreshToken, refreshConfig.secret);
          if (decodedRefresh.type === "refresh") {
            revokeRefreshToken(decodedRefresh.jti);
          }
        } catch (_error) {
          logSecurityEvent("auth_logout_invalid_refresh", {
            ip: req.ip,
          });
        }
      }
    }

    return res.json({ message: "Sesión cerrada correctamente" });
  } catch (_error) {
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  obtenerRegistros,
};
