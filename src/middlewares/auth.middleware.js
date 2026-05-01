const jwt = require("jsonwebtoken");
const { logSecurityEvent } = require("../utils/security-logger");
const { isAccessTokenRevoked } = require("../utils/token-store");

const verifyToken = (req, res, next) => {
  if (!process.env.JWT_SECRET) {
    logSecurityEvent("jwt_misconfigured", { path: req.originalUrl });
    return res
      .status(500)
      .json({ message: "JWT no configurado en el servidor" });
  }

  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    logSecurityEvent("auth_missing_header", {
      ip: req.ip,
      path: req.originalUrl,
    });
    return res.status(401).json({ message: "Token requerido" });
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    logSecurityEvent("auth_malformed_header", {
      ip: req.ip,
      path: req.originalUrl,
    });
    return res
      .status(401)
      .json({ message: "Formato de token invalido. Usa Bearer <token>" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      logSecurityEvent("auth_invalid_token", {
        ip: req.ip,
        path: req.originalUrl,
      });
      return res.status(401).json({ message: "Token inválido" });
    }

    if (decoded.type && decoded.type !== "access") {
      logSecurityEvent("auth_wrong_token_type", {
        ip: req.ip,
        path: req.originalUrl,
      });
      return res.status(401).json({ message: "Tipo de token inválido" });
    }

    if (decoded.jti && isAccessTokenRevoked(decoded.jti)) {
      logSecurityEvent("auth_revoked_token", {
        ip: req.ip,
        path: req.originalUrl,
      });
      return res.status(401).json({ message: "Token revocado" });
    }

    req.user = decoded;
    next();
  });
};

module.exports = verifyToken;
