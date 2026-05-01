# Gym Manager Pro - Backend

Este es el núcleo (API REST) del sistema Gym Manager Pro, diseñado para la gestión completa y automatizada de un gimnasio. Construido con Node.js, Express y PostgreSQL.

## 🚀 Arquitectura y Flujo Principal

El sistema sigue una arquitectura robusta orientada a módulos, donde cada entidad del gimnasio tiene su propio flujo y responsabilidad. La seguridad se gestiona mediante JWT (JSON Web Tokens) con control de roles (`ADMIN` y `ENTRENADOR`).

### Flujo Típico del Sistema:
1. **Autenticación:** El usuario (Administrador o Entrenador) inicia sesión y recibe un token JWT. Todas las peticiones posteriores deben incluir este token.
2. **Configuración Inicial:** El administrador define el catálogo del gimnasio:
   - Crea los **Tipos de Membresía** (ej. Mensualidad Básica, Trimestral VIP).
   - Registra el inventario de **Productos** (bebidas, suplementos).
   - Configura los **Métodos de Pago** aceptados (Efectivo, Tarjeta, Transferencia).
3. **Operación Diaria:**
   - Se registran **Clientes** nuevos en la base de datos.
   - Se procesan **Ventas** de tres tipos:
     - *Entradas por Día:* Accesos esporádicos al gimnasio sin membresía activa.
     - *Membresías:* Al venderse, el sistema calcula automáticamente la fecha de vencimiento sumando la duración en días al ciclo actual del cliente.
     - *Productos:* Al venderse, el sistema **descuenta automáticamente** la cantidad del stock (inventario).
   - Se registran los **Egresos** (gastos operativos, pago a proveedores, etc.).
4. **Cierre de Caja y Análisis:** El administrador accede al **Dashboard/Reportes** en tiempo real para visualizar ingresos, ganancias netas, stock bajo y membresías vencidas.

---

## 🛠️ Módulos y Funcionalidades Principales

### 1. Seguridad y Autenticación (`Auth`)
El sistema está completamente protegido.
- **Login y Tokens:** Generación de `access_token` (corta duración) y `refresh_token` (larga duración).
- **Control de Roles:** Restringe acciones destructivas (Eliminar, Crear Inventario) solo para el rol `ADMIN`. Los Entrenadores pueden consultar datos y realizar ventas.
- **Rate Limiting:** Prevención de ataques de fuerza bruta limitando peticiones.

### 2. Gestión de Clientes (`Clientes`)
Manejo del directorio de clientes del gimnasio.
- **CRUD completo:** Registrar, editar, consultar y desactivar clientes.
- **Borrado Lógico:** Los clientes no se eliminan físicamente de la base de datos para preservar el historial de ventas, simplemente cambian su estado a `inactivo`.

### 3. Gestión de Inventario (`Productos`)
Control estricto de los artículos a la venta.
- Registro de productos con su *precio de compra*, *precio de venta* y *stock* actual.
- **Deducción automática:** Al registrar una venta de producto, el stock disminuye dinámicamente mediante transacciones SQL seguras.
- Alertas de stock bajo (<= 5 unidades).

### 4. Planes y Membresías (`Tipos Membresia` y `Membresias`)
El corazón del gimnasio.
- **Creación de Planes:** Se definen los planes disponibles, su costo y duración en días.
- **Renovación Inteligente:** Al asignar una membresía a un cliente, el sistema calcula la fecha de expiración. Si el cliente tiene una membresía activa actualmente, la nueva fecha iniciará a partir de la finalización de la anterior, no se pierden días.
- **Seguimiento:** Listado de membresías con los "días restantes" calculados en tiempo real.

### 5. Control de Caja (`Ventas` y `Egresos`)
Gestión financiera del negocio.
- **Caja de Entradas:** Registro de ingresos por ventas de productos, entradas por un día, o renovaciones de membresía. Todo atado a un **Método de Pago**.
- **Caja de Salidas (Egresos):** Registro de pagos de servicios, nómina o suministros.
- **Transacciones Seguras (ACID):** El módulo de ventas usa transacciones SQL (`BEGIN`, `COMMIT`, `ROLLBACK`) para asegurar que si ocurre un error al cobrar una lista de productos, el stock no se descuente de manera incorrecta.

### 6. Métodos de Pago
- Catálogo de formas de pago aceptadas (Efectivo, Tarjeta, Transferencia bancaria). Totalmente personalizable.

### 7. Inteligencia de Negocio (`Reportes` y `Dashboard`)
Generación de métricas instantáneas para toma de decisiones.
- **Flujo de Caja Hoy:** Ingresos vs Egresos del día = *Ganancia Neta Diaria*.
- **Métricas Generales:** Ventas totales en el mes en curso.
- **Alertas y Fidelización:** Identificación de productos más vendidos, listado en tiempo real de membresías vencidas para seguimiento de clientes y productos que requieren reabastecimiento (stock bajo).

---

## 🔒 Buenas Prácticas Aplicadas
- **Clean Code:** Estructura modularizada (Rutas -> Controladores). Código autoexplicativo y funciones pequeñas.
- **Seguridad SQL:** Uso exclusivo de consultas parametrizadas (`pool.query("... WHERE id = $1", [id])`) lo que hace imposible la Inyección SQL.
- **CORS Estricto:** Bloqueo de orígenes desconocidos; solo los frontends autorizados en las variables de entorno pueden consumir la API.
- **Manejo Centralizado de Errores:** Retornos HTTP con códigos de estado correctos (`201` creado, `404` no encontrado, `409` conflicto de stock, `500` error de servidor).
