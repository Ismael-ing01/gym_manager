const rateLimit = require("express-rate-limit");
const { logSecurityEvent } = require("../utils/security-logger");

const onLimitReached = (req, res, _next, options) => {
  logSecurityEvent("rate_limit_exceeded", {
    ip: req.ip,
    method: req.method,
    path: req.originalUrl,
  });

  return res.status(options.statusCode).json(options.message);
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: onLimitReached,
  message: {
    message: "Demasiadas solicitudes. Intenta nuevamente en unos minutos.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: onLimitReached,
  message: {
    message: "Demasiados intentos de autenticacion. Intenta mas tarde.",
  },
});

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: onLimitReached,
  message: {
    message: "Demasiados intentos de login. Intenta nuevamente en 10 minutos.",
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  loginLimiter,
};
