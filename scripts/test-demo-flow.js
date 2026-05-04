const fs = require("fs");
const path = require("path");

const baseUrl = process.env.API_BASE_URL || "http://localhost:3000/api";

const readSeedCredentials = () => {
  const filePath = path.resolve("seed-demo.json");
  if (!fs.existsSync(filePath)) {
    throw new Error("seed-demo.json no existe. Ejecuta el seed primero.");
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
};

const fetchApi = async (endpoint, options = {}) => {
  const res = await fetch(`${baseUrl}${endpoint}`, options);
  const text = await res.text();
  let data = text;
  try {
    data = JSON.parse(text);
  } catch (_err) {}
  return { status: res.status, data };
};

const toDateOnly = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());
const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const main = async () => {
  const { adminEmail, adminPassword } = readSeedCredentials();

  console.log("Iniciando pruebas con:", adminEmail);

  const loginRes = await fetchApi("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });

  if (loginRes.status !== 200 || !loginRes.data?.accessToken) {
    console.error("Login fallo:", loginRes.status, loginRes.data);
    process.exit(1);
  }

  const token = loginRes.data.accessToken;
  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const results = [];
  const record = (name, ok, details) => results.push({ name, ok, details });

  const clientesRes = await fetchApi("/clientes?limit=5", {
    headers: authHeaders,
  });
  record("GET /clientes", clientesRes.status === 200, clientesRes.status);
  const clienteId = clientesRes.data?.data?.[0]?.id;

  const tiposRes = await fetchApi("/tipos_membresia?limit=5", {
    headers: authHeaders,
  });
  record("GET /tipos_membresia", tiposRes.status === 200, tiposRes.status);
  const tipoId = tiposRes.data?.data?.[0]?.id;

  const metodosRes = await fetchApi("/metodos_pago", { headers: authHeaders });
  record("GET /metodos_pago", metodosRes.status === 200, metodosRes.status);
  const metodoId = metodosRes.data?.[0]?.id;

  const productosRes = await fetchApi("/productos?limit=5", {
    headers: authHeaders,
  });
  record("GET /productos", productosRes.status === 200, productosRes.status);
  const productoId = productosRes.data?.data?.[0]?.id;

  if (metodoId) {
    const entradaRes = await fetchApi("/ventas/entrada_dia", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        metodo_pago_id: metodoId,
        total: 5.5,
        descripcion: "Test entrada",
      }),
    });
    record(
      "POST /ventas/entrada_dia",
      entradaRes.status === 201,
      entradaRes.status,
    );
  }

  if (metodoId && productoId) {
    const ventaProd = await fetchApi("/ventas/producto", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        metodo_pago_id: metodoId,
        productos: [{ producto_id: productoId, cantidad: 1 }],
      }),
    });
    record("POST /ventas/producto", ventaProd.status === 201, ventaProd.status);
  }

  if (metodoId && clienteId && tipoId) {
    const renovarRes = await fetchApi("/ventas/membresia", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        metodo_pago_id: metodoId,
        cliente_id: clienteId,
        tipo_membresia_id: tipoId,
        renovar: true,
      }),
    });
    record(
      "POST /ventas/membresia (renovar)",
      renovarRes.status === 201,
      renovarRes.status,
    );

    const futura = addDays(toDateOnly(new Date()), 3)
      .toISOString()
      .split("T")[0];
    const diferidaRes = await fetchApi("/ventas/membresia", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        metodo_pago_id: metodoId,
        cliente_id: clienteId,
        tipo_membresia_id: tipoId,
        fecha_inicio: futura,
      }),
    });
    record(
      "POST /ventas/membresia (diferida)",
      diferidaRes.status === 201,
      diferidaRes.status,
    );
  }

  const ventasHoyRes = await fetchApi("/ventas/hoy?limit=5", {
    headers: authHeaders,
  });
  record("GET /ventas/hoy", ventasHoyRes.status === 200, ventasHoyRes.status);

  const membresiasRes = await fetchApi("/membresias?limit=5", {
    headers: authHeaders,
  });
  record("GET /membresias", membresiasRes.status === 200, membresiasRes.status);

  const egresosRes = await fetchApi("/egresos?limit=5", {
    headers: authHeaders,
  });
  record("GET /egresos", egresosRes.status === 200, egresosRes.status);

  const reportes = [
    "ingresos_hoy",
    "egresos_hoy",
    "ganancia_hoy",
    "ingresos_mes",
    "egresos_mes",
    "ganancia_mes",
    "productos_mas_vendidos",
    "productos_stock_bajo",
  ];

  for (const rep of reportes) {
    const r = await fetchApi(`/reportes/${rep}`, { headers: authHeaders });
    record(`GET /reportes/${rep}`, r.status === 200, r.status);
  }

  const manualRes = await fetchApi("/reportes/manual", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      tipo: "mensual",
      mes: new Date().getMonth() + 1,
      anio: new Date().getFullYear(),
    }),
  });
  record("POST /reportes/manual", manualRes.status === 200, manualRes.status);

  console.log("Resultados:");
  for (const r of results) {
    console.log(`${r.ok ? "✅" : "❌"} ${r.name} (${r.details})`);
  }

  const errores = results.filter((r) => !r.ok);
  if (errores.length > 0) {
    console.error("Errores detectados:", errores.length);
    process.exitCode = 1;
  } else {
    console.log("Todas las pruebas pasaron.");
  }
};

main().catch((err) => {
  console.error("Error en test:", err.message);
  process.exit(1);
});
