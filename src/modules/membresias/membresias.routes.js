const express = require("express");
const router = express.Router();
const verifyToken = require("../../middlewares/auth.middleware");
const checkRole = require("../../middlewares/role.middleware");
const roles = require("../../utils/roles");

const {
  obtenerMembresias,
  obtenerMembresiaPorId,
  buscarPorNombre,
  actualizarMembresia,
  eliminarMembresia,
} = require("./membresias.controller");

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
