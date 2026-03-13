const express = require("express");
const router = express.Router();
const { register, login, obtenerRegistros } = require("./auth.controller");
const verifyToken = require("../../middlewares/auth.middleware");
const checkRole = require("../../middlewares/role.middleware");
const roles = require("../../utils/roles");

router.post("/register", verifyToken, checkRole(roles.ADMIN), register);

router.post("/login", login);

router.get(
  "/obtener_registros",
  verifyToken,
  checkRole(roles.ADMIN),
  obtenerRegistros,
);

module.exports = router;
