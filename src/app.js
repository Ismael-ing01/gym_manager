require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./modules/auth/auth.routes");
const clientesRoutes = require("./modules/clientes/clientes.routes");
const productosRoutes = require("./modules/productos/productos.routes");
const tiposMembresiaRoutes = require("./modules/tipoMembresia/tiposMembresia.routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/productos", productosRoutes);
app.use("/api/tipos_membresia", tiposMembresiaRoutes);

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
