const express = require("express");
const router = express.Router();
const verifyToken = require("../../middlewares/auth.middleware");
const checkRole = require("../../middlewares/role.middleware");
const roles = require("../../utils/roles");

const {
  crearProducto,
  obtenerProductos,
  obtenerProductoPorId,
  actualizarProducto,
  eliminarProducto,
} = require("./productos.controller");

router.post("/", verifyToken, checkRole([roles.ADMIN]), crearProducto);

router.get(
  "/",
  verifyToken,
  checkRole([roles.ADMIN, roles.ENTRENADOR]),
  obtenerProductos,
);

router.get(
  "/:id",
  verifyToken,
  checkRole([roles.ADMIN, roles.ENTRENADOR]),
  obtenerProductoPorId,
);

router.put("/:id", verifyToken, checkRole([roles.ADMIN]), actualizarProducto);

router.delete("/:id", verifyToken, checkRole([roles.ADMIN]), eliminarProducto);

module.exports = router;
