const express = require("express");
const router = express.Router();
const {
  register,
  login,
  refresh,
  logout,
  obtenerRegistros,
} = require("./auth.controller");
const verifyToken = require("../../middlewares/auth.middleware");
const checkRole = require("../../middlewares/role.middleware");
const {
  authLimiter,
  loginLimiter,
} = require("../../middlewares/rate-limit.middleware");
const roles = require("../../utils/roles");

router.post(
  "/register",
  authLimiter,
  verifyToken,
  checkRole([roles.ADMIN]),
  register,
);

router.post("/login", loginLimiter, login);

router.post("/refresh", authLimiter, refresh);

router.post("/logout", authLimiter, verifyToken, logout);

router.get(
  "/obtener_registros",
  verifyToken,
  checkRole([roles.ADMIN]),
  obtenerRegistros,
);

module.exports = router;
