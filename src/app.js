require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./modules/auth/auth.routes");
const clientesRoutes = require("./modules/clientes/clientes.routes");
const productosRoutes = require("./modules/productos/productos.routes");
const tiposMembresiaRoutes = require("./modules/tipoMembresia/tiposMembresia.routes");
const membresiasRoutes = require("./modules/membresias/membresias.routes");
const metodosPagoRoutes = require("./modules/metodoPagos/metodosPago.routes");
const ventasRoutes = require("./modules/ventas/ventas.routes");
const egresosRoutes = require("./modules/egresos/egresos.routes");
const reportesRoutes = require("./modules/reportes/reportes.routes");

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/productos", productosRoutes);
app.use("/api/tipos_membresia", tiposMembresiaRoutes);
app.use("/api/membresias", membresiasRoutes);
app.use("/api/metodos_pago", metodosPagoRoutes);
app.use("/api/ventas", ventasRoutes);
app.use("/api/egresos", egresosRoutes);
app.use("/api/reportes", reportesRoutes);

app.get("/", (req, res) => {
  res.send("GymManager Pro API funcionando");
});

const PORT = process.env.PORT || 3000;

const pool = require("./config/database");

pool
  .connect()
  .then(() => console.log("Base de datos conectada"))
  .catch((err) => console.error("Error conexión DB", err));

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
