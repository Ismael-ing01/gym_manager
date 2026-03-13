const express = require("express");
const router = express.Router();

const {
  crearProducto,
  obtenerProductos,
  obtenerProducto,
  actualizarProducto,
  eliminarProducto,
} = require("./productos.controller");

router.post("/", crearProducto);

router.get("/", obtenerProductos);

router.get("/:id", obtenerProducto);

router.put("/:id", actualizarProducto);

router.delete("/:id", eliminarProducto);

module.exports = router;
