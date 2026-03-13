const express = require("express");
const router = express.Router();
const verifyToken = require("../../middlewares/auth.middleware");
const checkRole = require("../../middlewares/role.middleware");
const roles = require("../../utils/roles");

const {
  crearCliente,
  obtenerClientes,
  actualizarCliente,
  desactivarCliente,
} = require("./clientes.controller");

router.post(
  "/",
  verifyToken,
  checkRole(roles.ADMIN, roles.ENTRENADOR),
  crearCliente,
);

router.get(
  "/",
  verifyToken,
  checkRole(roles.ADMIN, roles.ENTRENADOR),
  obtenerClientes,
);

router.put("/:id", verifyToken, checkRole(roles.ADMIN), actualizarCliente);

router.delete("/:id", verifyToken, checkRole(roles.ADMIN), desactivarCliente);

module.exports = router;
