const express = require("express");
const router = express.Router();
const verifyToken = require("../../middlewares/authMiddleware");
const checkRole = require("../../middlewares/checkRole");
const roles = require("../../utils/roles");

const {
  crearMetodoPago,
  obtenerMetodosPago,
  obtenerMetodoPagoPorId,
  actualizarMetodoPago,
  eliminarMetodoPago,
} = require("./metodosPago.controller");

router.post("/", verifyToken, checkRole([roles.ADMIN]), crearMetodoPago);
router.get(
  "/",
  verifyToken,
  checkRole([roles.ADMIN, roles.ENTRENADOR]),
  obtenerMetodosPago,
);
router.get(
  "/:id",
  verifyToken,
  checkRole([roles.ADMIN, roles.ENTRENADOR]),
  obtenerMetodoPagoPorId,
);
router.put("/:id", verifyToken, checkRole([roles.ADMIN]), actualizarMetodoPago);
router.delete(
  "/:id",
  verifyToken,
  checkRole([roles.ADMIN]),
  eliminarMetodoPago,
);

module.exports = router;
