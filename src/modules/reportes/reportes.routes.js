const express = require("express");
const router = express.Router();
const verifyToken = require("../../middlewares/auth.middleware");
const checkRole = require("../../middlewares/role.middleware");
const roles = require("../../utils/roles");

const {
  ingresosHoy,
  egresosHoy,
  gananciaHoy,
  ingresosMes,
  egresosMes,
  gananciaMes,
  productosMasVendidos,
  membresiasVencidas,
  productosStockBajo,
  dashboard,
  reporteManual,
  reporteManualPdf,
} = require("./reportes.controller");

router.get("/ingresos_hoy", verifyToken, checkRole([roles.ADMIN]), ingresosHoy);

router.get("/egresos_hoy", verifyToken, checkRole([roles.ADMIN]), egresosHoy);

router.get("/ganancia_hoy", verifyToken, checkRole([roles.ADMIN]), gananciaHoy);

router.get("/ingresos_mes", verifyToken, checkRole([roles.ADMIN]), ingresosMes);

router.get("/egresos_mes", verifyToken, checkRole([roles.ADMIN]), egresosMes);

router.get("/ganancia_mes", verifyToken, checkRole([roles.ADMIN]), gananciaMes);

router.get(
  "/productos_mas_vendidos",
  verifyToken,
  checkRole([roles.ADMIN]),
  productosMasVendidos,
);

router.get(
  "/membresias_vencidas",
  verifyToken,
  checkRole([roles.ADMIN]),
  membresiasVencidas,
);

router.get(
  "/productos_stock_bajo",
  verifyToken,
  checkRole([roles.ADMIN]),
  productosStockBajo,
);

router.get(
  "/dashboard",
  verifyToken,
  checkRole([roles.ADMIN, roles.ENTRENADOR]),
  dashboard,
);

router.post("/manual", verifyToken, checkRole([roles.ADMIN]), reporteManual);

router.post(
  "/manual/pdf",
  verifyToken,
  checkRole([roles.ADMIN]),
  reporteManualPdf,
);

module.exports = router;
