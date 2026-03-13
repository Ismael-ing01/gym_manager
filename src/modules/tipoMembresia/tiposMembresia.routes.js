const express = require("express");
const router = express.Router();
const verifyToken = require("../../middlewares/auth.middleware");
const checkRole = require("../../middlewares/role.middleware");
const roles = require("../../utils/roles");

const {
  crearTipoMembresia,
  obtenerTiposMembresia,
  actualizarTipoMembresia,
  eliminarTipoMembresia,
} = require("./tiposMembresia.controller");

router.post("/", verifyToken, checkRole(roles.ADMIN), crearTipoMembresia);
router.get(
  "/",
  verifyToken,
  checkRole(roles.ADMIN, roles.ENTRENADOR),
  obtenerTiposMembresia,
);
router.put(
  "/:id",
  verifyToken,
  checkRole(roles.ADMIN),
  actualizarTipoMembresia,
);
router.delete(
  "/:id",
  verifyToken,
  checkRole(roles.ADMIN),
  eliminarTipoMembresia,
);

module.exports = router;
