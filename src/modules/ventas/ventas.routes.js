const express = require("express");
const router = express.Router();
const verifyToken = require("../../middlewares/auth.middleware");
const checkRole = require("../../middlewares/role.middleware");
const roles = require("../../utils/roles");

const {
  registrarEntradaDia,
  venderProducto,
  venderMembresia,
  obtenerVentasHoy,
} = require("./ventas.controller");

router.get(
  "/hoy",
  verifyToken,
  checkRole([roles.ADMIN, roles.ENTRENADOR]),
  obtenerVentasHoy,
);

router.post(
  "/entrada_dia",
  verifyToken,
  checkRole([roles.ADMIN, roles.ENTRENADOR]),
  registrarEntradaDia,
);

router.post(
  "/producto",
  verifyToken,
  checkRole([roles.ADMIN, roles.ENTRENADOR]),
  venderProducto,
);

router.post(
  "/membresia",
  verifyToken,
  checkRole([roles.ADMIN, roles.ENTRENADOR]),
  venderMembresia,
);

module.exports = router;
