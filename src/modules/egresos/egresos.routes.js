const express = require("express");
const router = express.Router();
const verifyToken = require("../../middlewares/auth.middleware");
const checkRole = require("../../middlewares/role.middleware");
const roles = require("../../utils/roles");

const {
  crearEgreso,
  obtenerEgresos,
  obtenerEgresoPorId,
  actualizarEgreso,
  eliminarEgreso,
} = require("./egresos.controller");

router.post("/", verifyToken, checkRole([roles.ADMIN]), crearEgreso);

router.get("/", verifyToken, checkRole([roles.ADMIN]), obtenerEgresos);

router.get("/:id", verifyToken, checkRole([roles.ADMIN]), obtenerEgresoPorId);

router.put("/:id", verifyToken, checkRole([roles.ADMIN]), actualizarEgreso);

router.delete("/:id", verifyToken, checkRole([roles.ADMIN]), eliminarEgreso);

module.exports = router;
