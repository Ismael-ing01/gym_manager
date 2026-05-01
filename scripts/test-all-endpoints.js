const fs = require('fs');
const jwt = require('jsonwebtoken');

async function runTests() {
  const baseUrl = 'http://localhost:3000/api';
  
  // Generar token admin manualmente
  const token = jwt.sign(
    { id: 1, rol: 'ADMIN', type: 'access' },
    'super_secret_key',
    { expiresIn: '15m' }
  );

  let errors = [];
  let successes = [];

  const log = (msg) => console.log(msg);
  const logError = (msg) => { console.error('❌ ' + msg); errors.push(msg); };
  const logSuccess = (msg) => { console.log('✅ ' + msg); successes.push(msg); };

  const fetchApi = async (endpoint, options = {}) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${baseUrl}${endpoint}`, { ...options, headers });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch(e) { data = text; }
      
      return { status: res.status, data };
    } catch (err) {
      return { status: 500, data: err.message };
    }
  };

  log('--- INICIANDO PRUEBAS DE ENDPOINTS ---');

  // 1. Auth Login (We assume there's an admin user in DB, otherwise we'll try to register one)
  log('1. Probando Auth');
  
  // Try register with token
  const rand = Math.floor(Math.random() * 10000);
  const email = `admin${rand}@test.com`;
  const regRes = await fetchApi('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ nombre: 'Admin Test', email, password: 'password123', rol: 'ADMIN' })
  });
  if (regRes.status === 201 || regRes.status === 409) {
    logSuccess('POST /auth/register funcionó');
  } else {
    logError(`POST /auth/register falló: ${regRes.status} ${JSON.stringify(regRes.data)}`);
  }

  // We skip testing login because we don't know the plain text passwords for existing users
  // and register doesn't return the raw password.
  // Actually, we just registered a user with 'password123', so we can login with it!
  const loginRes = await fetchApi('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'password123' })
  });

  if (loginRes.status === 200 && loginRes.data.token) {
    logSuccess('POST /auth/login funcionó');
  } else {
    logError(`POST /auth/login falló: ${loginRes.status} ${JSON.stringify(loginRes.data)}`);
  }

  // 2. Clientes
  log('\n2. Probando Clientes');
  const randNum = Math.floor(Math.random() * 100000);
  const clienteData = { nombre: 'Cliente Test', cedula: `123456${randNum}`, telefono: '099999999', email: `cliente${randNum}@test.com` };
  let clienteId;
  const postCliente = await fetchApi('/clientes', { method: 'POST', body: JSON.stringify(clienteData) });
  if (postCliente.status === 201) {
    logSuccess('POST /clientes');
    clienteId = postCliente.data.id;
  } else logError(`POST /clientes: ${JSON.stringify(postCliente.data)}`);

  const getClientes = await fetchApi('/clientes');
  if (getClientes.status === 200 && Array.isArray(getClientes.data)) logSuccess('GET /clientes');
  else logError(`GET /clientes: ${JSON.stringify(getClientes.data)}`);

  if (clienteId) {
    const getClienteId = await fetchApi(`/clientes/${clienteId}`);
    if (getClienteId.status === 200) logSuccess('GET /clientes/:id');
    else logError(`GET /clientes/:id: ${JSON.stringify(getClienteId.data)}`);

    const putCliente = await fetchApi(`/clientes/${clienteId}`, { method: 'PUT', body: JSON.stringify(clienteData) });
    if (putCliente.status === 200) logSuccess('PUT /clientes/:id');
    else logError(`PUT /clientes/:id: ${JSON.stringify(putCliente.data)}`);
  }

  // 3. Productos
  log('\n3. Probando Productos');
  const prodData = { nombre: 'Agua Test', precio_compra: 0.5, precio_venta: 1.0, stock: 100 };
  let prodId;
  const postProd = await fetchApi('/productos', { method: 'POST', body: JSON.stringify(prodData) });
  if (postProd.status === 201) {
    logSuccess('POST /productos');
    prodId = postProd.data.producto.id;
  } else logError(`POST /productos: ${JSON.stringify(postProd.data)}`);

  const getProds = await fetchApi('/productos');
  if (getProds.status === 200) logSuccess('GET /productos');
  else logError('GET /productos');

  if (prodId) {
    const getProdId = await fetchApi(`/productos/${prodId}`);
    if (getProdId.status === 200) logSuccess('GET /productos/:id');
    else logError(`GET /productos/:id: ${JSON.stringify(getProdId.data)}`);
  }

  // 4. Tipos Membresía
  log('\n4. Probando Tipos Membresia');
  const tipoData = { nombre: 'Mensual Test', duracion_dias: 30, precio: 30.0, descripcion: 'Test' };
  let tipoId;
  const postTipo = await fetchApi('/tipos_membresia', { method: 'POST', body: JSON.stringify(tipoData) });
  if (postTipo.status === 201) {
    logSuccess('POST /tipos_membresia');
    tipoId = postTipo.data.tipo.id;
  } else logError(`POST /tipos_membresia: ${JSON.stringify(postTipo.data)}`);

  const getTipos = await fetchApi('/tipos_membresia');
  if (getTipos.status === 200) logSuccess('GET /tipos_membresia');
  else logError('GET /tipos_membresia');

  // 5. Métodos de Pago
  log('\n5. Probando Métodos Pago');
  const randName = Math.floor(Math.random() * 100000);
  const metodoData = { nombre: `Efectivo Test ${randName}`, descripcion: 'Test' };
  let metodoId;
  const postMetodo = await fetchApi('/metodos_pago', { method: 'POST', body: JSON.stringify(metodoData) });
  if (postMetodo.status === 201) {
    logSuccess('POST /metodos_pago');
    metodoId = postMetodo.data.id;
  } else logError(`POST /metodos_pago: ${JSON.stringify(postMetodo.data)}`);

  const getMetodos = await fetchApi('/metodos_pago');
  if (getMetodos.status === 200) logSuccess('GET /metodos_pago');
  else logError('GET /metodos_pago');

  // 6. Ventas
  log('\n6. Probando Ventas');
  if (metodoId) {
    const postVentaDia = await fetchApi('/ventas/entrada_dia', { method: 'POST', body: JSON.stringify({ metodo_pago_id: metodoId, total: 5, descripcion: 'Día Test' }) });
    if (postVentaDia.status === 201) logSuccess('POST /ventas/entrada_dia');
    else logError(`POST /ventas/entrada_dia: ${JSON.stringify(postVentaDia.data)}`);
  }

  if (metodoId && prodId) {
    const postVentaProd = await fetchApi('/ventas/producto', { method: 'POST', body: JSON.stringify({ metodo_pago_id: metodoId, productos: [{ producto_id: prodId, cantidad: 1 }] }) });
    if (postVentaProd.status === 201) logSuccess('POST /ventas/producto');
    else logError(`POST /ventas/producto: ${JSON.stringify(postVentaProd.data)}`);
  }

  if (metodoId && clienteId && tipoId) {
    const postVentaMem = await fetchApi('/ventas/membresia', { method: 'POST', body: JSON.stringify({ metodo_pago_id: metodoId, cliente_id: clienteId, tipo_membresia_id: tipoId }) });
    if (postVentaMem.status === 201) logSuccess('POST /ventas/membresia');
    else logError(`POST /ventas/membresia: ${JSON.stringify(postVentaMem.data)}`);
  }

  // 7. Membresias
  log('\n7. Probando Membresias');
  const getMem = await fetchApi('/membresias');
  if (getMem.status === 200) logSuccess('GET /membresias');
  else logError('GET /membresias');

  // 8. Egresos
  log('\n8. Probando Egresos');
  if (metodoId) {
    const postEgreso = await fetchApi('/egresos', { method: 'POST', body: JSON.stringify({ descripcion: 'Test', monto: 10, metodo_pago_id: metodoId, categoria: 'Otros' }) });
    if (postEgreso.status === 201) logSuccess('POST /egresos');
    else logError(`POST /egresos: ${JSON.stringify(postEgreso.data)}`);
  }

  const getEgresos = await fetchApi('/egresos');
  if (getEgresos.status === 200) logSuccess('GET /egresos');
  else logError('GET /egresos');

  // 9. Reportes
  log('\n9. Probando Reportes');
  const repEndpoints = ['ingresos_hoy', 'egresos_hoy', 'ganancia_hoy', 'ingresos_mes', 'productos_mas_vendidos', 'membresias_vencidas', 'productos_stock_bajo', 'dashboard'];
  for (const rep of repEndpoints) {
    const res = await fetchApi(`/reportes/${rep}`);
    if (res.status === 200) logSuccess(`GET /reportes/${rep}`);
    else logError(`GET /reportes/${rep}: ${JSON.stringify(res.data)}`);
  }

  log('\n--- RESULTADOS FINALES ---');
  log(`✅ Éxitos: ${successes.length}`);
  log(`❌ Errores: ${errors.length}`);
  
  if (errors.length > 0) {
    fs.writeFileSync('test-errors.json', JSON.stringify(errors, null, 2));
  }
}

runTests();
