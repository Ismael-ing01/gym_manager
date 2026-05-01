# Validación Integral de Lógica de Negocio - Gym Manager Backend

Fecha: 2026-03-24

## Resultado ejecutivo

Estado actual: **válido para avanzar al frontend**. Los bloqueadores de autorización y consistencia reportados inicialmente fueron corregidos.

Se validó:
- Estructura modular por dominio (auth, clientes, ventas, membresías, reportes, etc.).
- Consistencia general de consultas SQL parametrizadas (sin inyección SQL directa visible).
- Flujo transaccional en ventas de productos y membresías.
- Sintaxis JavaScript de todo `src/` (sin errores de parseo).

## Correcciones aplicadas

### 1) Catálogo de roles consistente
- Se agregó `EMPLEADO` en `src/utils/roles.js`.

### 2) Middleware de roles más robusto
- `checkRole` ahora soporta arreglo o valor único y valida usuario autenticado.
- Esto evita errores por uso accidental del middleware.

### 3) Rutas con permisos corregidos
- Se normalizaron llamadas a `checkRole([ ... ])` en rutas que estaban inconsistentes.
- Ventas y dashboard permiten `ADMIN` y `EMPLEADO`.

## Mejoras de consistencia aplicadas

### 4) Estandarización de 404
- Se agregó respuesta `404` cuando no existe recurso en controladores de productos, métodos de pago, egresos, clientes, membresías y tipos de membresía.

### 5) Validaciones de entrada más explícitas
- Se reemplazaron validaciones ambiguas por reglas numéricas explícitas en productos, ventas, egresos y tipos de membresía.
- Se agregaron mensajes de error más precisos para frontend.

### 6) Registro de usuarios endurecido
- Se validan roles permitidos al registrar usuario.
- Se agregó validación de unicidad de email con respuesta `409` si ya existe.

### 7) Bootstrap de DB seguro
- Se reemplazó `pool.connect()` por `pool.query('SELECT 1')` para comprobar conexión sin retener cliente.

## Lo que sí está bien

- Consultas SQL con placeholders (`$1, $2...`) en controladores.
- Transacciones en `venderProducto` y `venderMembresia` con `BEGIN/COMMIT/ROLLBACK`.
- JWT implementado y middleware de autorización centralizado.
- Separación modular por dominio y rutas limpias por recurso.
- `productos.routes` actualmente ya está protegido con autenticación y roles.

---

## Diagrama de arquitectura/lógica general

```mermaid
flowchart LR
  FE[Frontend App] -->|HTTP JSON + JWT| API[Express API]

  API --> AUTH[Auth Module]
  API --> CLI[Clientes Module]
  API --> PROD[Productos Module]
  API --> TIPO[Tipos Membresia Module]
  API --> MEMB[Membresias Module]
  API --> MP[Metodos Pago Module]
  API --> VENT[Ventas Module]
  API --> EGR[Egresos Module]
  API --> REP[Reportes Module]

  AUTH --> MW[Auth Middleware + Role Middleware]
  CLI --> MW
  PROD --> MW
  TIPO --> MW
  MEMB --> MW
  MP --> MW
  VENT --> MW
  EGR --> MW
  REP --> MW

  AUTH --> DB[(PostgreSQL)]
  CLI --> DB
  PROD --> DB
  TIPO --> DB
  MEMB --> DB
  MP --> DB
  VENT --> DB
  EGR --> DB
  REP --> DB
```

## Secuencia: Login

```mermaid
sequenceDiagram
  actor U as Usuario
  participant FE as Frontend
  participant API as Auth API
  participant DB as PostgreSQL

  U->>FE: Ingresa email/password
  FE->>API: POST /api/auth/login
  API->>DB: SELECT usuario por email y estado=true
  DB-->>API: datos usuario
  API->>API: bcrypt.compare(password)
  API->>API: jwt.sign({id, rol}, expiresIn=8h)
  API-->>FE: { token, user }
  FE-->>U: Sesión iniciada
```

## Secuencia: Venta de producto

```mermaid
sequenceDiagram
  actor C as Cajero(Admin/Empleado)
  participant FE as Frontend
  participant API as Ventas API
  participant DB as PostgreSQL

  C->>FE: Selecciona productos + cantidades + método pago
  FE->>API: POST /api/ventas/producto
  API->>API: Validar body
  API->>DB: BEGIN
  API->>DB: INSERT venta tipo=producto total=0

  loop Por cada item
    API->>DB: SELECT precio_venta, stock
    DB-->>API: datos producto
    API->>API: Validar stock >= cantidad
    API->>DB: INSERT detalle_ventas
    API->>DB: UPDATE productos SET stock = stock - cantidad
  end

  API->>DB: UPDATE ventas total calculado
  API->>DB: COMMIT
  API-->>FE: 201 Venta registrada
```

## Secuencia: Venta de membresía

```mermaid
sequenceDiagram
  actor C as Cajero(Admin/Empleado)
  participant FE as Frontend
  participant API as Ventas API
  participant DB as PostgreSQL

  C->>FE: Elige cliente + tipo membresía + método pago
  FE->>API: POST /api/ventas/membresia
  API->>API: Validar body
  API->>DB: BEGIN
  API->>DB: SELECT precio,duracion_dias de tipo_membresia
  API->>DB: INSERT venta tipo=membresia
  API->>DB: SELECT última membresía del cliente
  API->>API: Calcular fecha_inicio (hoy o fecha_fin vigente)
  API->>DB: Calcular fecha_fin por duración
  API->>DB: INSERT membresia
  API->>DB: COMMIT
  API-->>FE: 201 Membresía vendida
```

## Casos de uso (resumen)

```mermaid
flowchart TD
  ADMIN((Administrador))
  ENT((Entrenador))
  EMP((Empleado))

  UC1[Iniciar sesión]
  UC2[Gestionar clientes]
  UC3[Gestionar productos]
  UC4[Vender producto]
  UC5[Vender membresía]
  UC6[Registrar entrada del día]
  UC7[Registrar egreso]
  UC8[Consultar reportes/dashboard]
  UC9[Gestionar tipos de membresía]
  UC10[Gestionar métodos de pago]
  UC11[Gestionar usuarios]

  ADMIN --> UC1
  ENT --> UC1
  EMP --> UC1

  ADMIN --> UC2
  ENT --> UC2

  ADMIN --> UC3
  ENT --> UC3

  ADMIN --> UC4
  EMP --> UC4

  ADMIN --> UC5
  EMP --> UC5

  ADMIN --> UC6
  EMP --> UC6

  ADMIN --> UC7

  ADMIN --> UC8
  EMP --> UC8

  ADMIN --> UC9
  ENT --> UC9

  ADMIN --> UC10
  ENT --> UC10

  ADMIN --> UC11
```

## Historias de usuario recomendadas para alinear Frontend

1. Como administrador, quiero iniciar sesión y obtener mi token para acceder a módulos protegidos.
2. Como administrador, quiero crear y administrar usuarios para delegar operaciones por rol.
3. Como entrenador, quiero consultar clientes y membresías para seguimiento de planes.
4. Como empleado, quiero registrar ventas de productos para actualizar caja e inventario.
5. Como empleado, quiero vender membresías para activar o extender vigencias.
6. Como administrador, quiero registrar egresos para controlar utilidades reales.
7. Como administrador, quiero ver dashboard diario/mensual para decidir acciones operativas.
8. Como administrador, quiero configurar tipos de membresía y métodos de pago.
9. Como administrador, quiero desactivar clientes sin perder histórico.

## Checklist pre-frontend

- [x] Corregir `roles.js` agregando `EMPLEADO`.
- [x] Corregir llamadas a `checkRole` y endurecer middleware.
- [x] Mantener protegidas rutas de productos con `verifyToken + checkRole`.
- [x] Estandarizar 404 cuando el recurso no exista.
- [x] Ajustar validaciones numéricas por regla de negocio (`>0`, `>=0`).
- [x] Validar unicidad de email en registro.
- [ ] Confirmar constraints en DB (FK y checks en esquema SQL, fuera de código Node).

## Conclusión

El backend quedó consistente para iniciar frontend: autorización corregida, validaciones más claras, manejo de errores homogéneo y flujo transaccional de ventas intacto. El siguiente punto recomendado es blindar el esquema de base de datos con constraints para cerrar la validación de negocio de extremo a extremo.
