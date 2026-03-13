const express = require("express");
const router = express.Router();
const verifyToken = require("../../middlewares/authMiddleware");
const checkRole = require("../../middlewares/checkRole");
const roles = require("../../utils/roles");

const {
  crearMembresia,
  obtenerMembresias,
  obtenerMembresiaPorId,
  buscarPorNombre,
  actualizarMembresia,
  eliminarMembresia,
} = require("./membresias.controller");

router.post("/", verifyToken, checkRole([roles.ADMIN]), crearMembresia);

router.get(
  "/",
  verifyToken,
  checkRole([roles.ADMIN, roles.ENTRENADOR]),
  obtenerMembresias,
);

router.get(
  "/id/:id",
  verifyToken,
  checkRole([roles.ADMIN, roles.ENTRENADOR]),
  obtenerMembresiaPorId,
);

router.get(
  "/cliente/:nombre",
  verifyToken,
  checkRole([roles.ADMIN, roles.ENTRENADOR]),
  buscarPorNombre,
);

router.put(
  "/:id",
  verifyToken,
  checkRole([roles.ADMIN, roles.ENTRENADOR]),
  actualizarMembresia,
);

router.delete("/:id", verifyToken, checkRole([roles.ADMIN]), eliminarMembresia);

module.exports = router;
