const express = require("express");
const router = express.Router();
const verifyToken = require("../../middlewares/auth.middleware");
const checkRole = require("../../middlewares/role.middleware");
const roles = require("../../utils/roles");

const {
  registrarEntradaDia,
  venderProducto,
  venderMembresia,
} = require("./ventas.controller");

router.post(
  "/entrada_dia",
  verifyToken,
  checkRole([roles.ADMIN, roles.EMPLEADO]),
  registrarEntradaDia,
);

router.post(
  "/producto",
  verifyToken,
  checkRole([roles.ADMIN, roles.EMPLEADO]),
  venderProducto,
);

router.post(
  "/membresia",
  verifyToken,
  checkRole([roles.ADMIN, roles.EMPLEADO]),
  venderMembresia,
);

module.exports = router;
