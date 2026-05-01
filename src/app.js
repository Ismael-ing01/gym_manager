require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const authRoutes = require("./modules/auth/auth.routes");
const clientesRoutes = require("./modules/clientes/clientes.routes");
const productosRoutes = require("./modules/productos/productos.routes");
const tiposMembresiaRoutes = require("./modules/tipoMembresia/tiposMembresia.routes");
const membresiasRoutes = require("./modules/membresias/membresias.routes");
const metodosPagoRoutes = require("./modules/metodoPagos/metodosPago.routes");
const ventasRoutes = require("./modules/ventas/ventas.routes");
const egresosRoutes = require("./modules/egresos/egresos.routes");
const reportesRoutes = require("./modules/reportes/reportes.routes");
const { apiLimiter } = require("./middlewares/rate-limit.middleware");
const { logSecurityEvent } = require("./utils/security-logger");

const app = express();
app.set("trust proxy", 1);

const allowedOrigins = (
  process.env.FRONTEND_URLS ||
  process.env.FRONTEND_URL ||
  "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      logSecurityEvent("cors_blocked_origin", { origin });
      return callback(new Error("Origen no permitido por CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);
app.use(apiLimiter);
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

app.use((err, req, res, next) => {
  if (err && err.message === "Origen no permitido por CORS") {
    return res.status(403).json({ message: "Origen no permitido" });
  }

  return next(err);
});

app.get("/", (req, res) => {
  res.send("GymManager Pro API funcionando");
});

const PORT = process.env.PORT || 3000;

const pool = require("./config/database");

pool
  .query("SELECT 1")
  .then(() => console.log("Base de datos conectada"))
  .catch((err) => console.error("Error conexión DB", err));

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
