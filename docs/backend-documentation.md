# Documentación API Backend - Mundo Fit Gym Manager

Esta es la documentación técnica de todos los endpoints disponibles en el backend de Mundo Fit.

## Autenticación (`/api/auth`)
- `POST /register`: Registra un nuevo usuario (ADMIN, ENTRENADOR). **Rol requerido:** Público (o Admin dependiendo de política). Requiere: `nombre`, `email`, `password`, `rol`.
- `POST /login`: Inicia sesión y devuelve un par de tokens (`accessToken`, `refreshToken`). Requiere: `email`, `password`.
- `POST /refresh`: Renueva el `accessToken` usando el `refreshToken`. Requiere: `refreshToken`.
- `POST /logout`: Revoca el token actual y cierra sesión. **Rol requerido:** Autenticado. Opcional: `refreshToken`.
- `GET /registros`: Obtiene todos los usuarios activos. **Rol requerido:** Ninguno/Autenticado.

## Clientes (`/api/clientes`)
- `POST /`: Crea un cliente. **Roles:** ADMIN, ENTRENADOR. Requiere: `nombre`, `cedula`, `telefono`, `email`.
- `GET /`: Obtiene todos los clientes activos. **Roles:** ADMIN, ENTRENADOR.
- `GET /:id`: Obtiene un cliente por ID. **Roles:** ADMIN, ENTRENADOR.
- `PUT /:id`: Actualiza un cliente. **Rol:** ADMIN. Requiere: `nombre`, `cedula`, `telefono`, `email`.
- `DELETE /:id`: Desactiva (borrado lógico) un cliente. **Rol:** ADMIN.

## Productos (`/api/productos`)
- `POST /`: Crea un producto. **Rol:** ADMIN. Requiere: `nombre`, `precio_compra`, `precio_venta`, `stock`.
- `GET /`: Obtiene todos los productos. **Roles:** ADMIN, ENTRENADOR.
- `GET /:id`: Obtiene un producto por ID. **Roles:** ADMIN, ENTRENADOR.
- `PUT /:id`: Actualiza un producto. **Rol:** ADMIN. Requiere: `nombre`, `precio_compra`, `precio_venta`, `stock`.
- `DELETE /:id`: Elimina un producto físicamente. **Rol:** ADMIN.

## Tipos de Membresía (`/api/tipos_membresia`)
- `POST /`: Crea un tipo de membresía. **Rol:** ADMIN. Requiere: `nombre`, `duracion_dias`, `precio`, `descripcion`.
- `GET /`: Obtiene los tipos de membresía. **Roles:** ADMIN, ENTRENADOR.
- `PUT /:id`: Actualiza un tipo. **Rol:** ADMIN. Requiere: `nombre`, `duracion_dias`, `precio`, `descripcion`.
- `DELETE /:id`: Elimina un tipo. **Rol:** ADMIN.

## Membresías (`/api/membresias`)
- `GET /`: Obtiene todas las membresías. **Roles:** ADMIN, ENTRENADOR.
- `GET /:id`: Obtiene una membresía por ID. **Roles:** ADMIN, ENTRENADOR.
- `GET /search/:nombre`: Busca membresías por nombre del cliente. **Roles:** ADMIN, ENTRENADOR.
- `PUT /:id`: Actualiza el estado (`activa` / `inactiva`). **Roles:** ADMIN, ENTRENADOR. Requiere: `estado`.
- `DELETE /:id`: Elimina una membresía. **Rol:** ADMIN.

## Ventas (`/api/ventas`)
- `POST /entrada_dia`: Registra entrada de un día. **Roles:** ADMIN, ENTRENADOR. Requiere: `metodo_pago_id`, `total`, `descripcion`.
- `POST /producto`: Vende productos y descuenta stock. **Roles:** ADMIN, ENTRENADOR. Requiere: `metodo_pago_id`, `productos` (Array de `{producto_id, cantidad}`).
- `POST /membresia`: Vende una membresía a un cliente. **Roles:** ADMIN, ENTRENADOR. Requiere: `cliente_id`, `tipo_membresia_id`, `metodo_pago_id`.

## Egresos (`/api/egresos`)
- `POST /`: Crea un egreso. **Rol:** ADMIN. Requiere: `descripcion`, `monto`, `metodo_pago_id`, `categoria`.
- `GET /`: Obtiene todos los egresos. **Rol:** ADMIN.
- `GET /:id`: Obtiene un egreso por ID. **Rol:** ADMIN.
- `PUT /:id`: Actualiza un egreso. **Rol:** ADMIN. Requiere: `descripcion`, `monto`, `metodo_pago_id`, `categoria`.
- `DELETE /:id`: Elimina un egreso. **Rol:** ADMIN.

## Métodos de Pago (`/api/metodos_pago`)
- `POST /`: Crea un método de pago. **Rol:** ADMIN. Requiere: `nombre`, `descripcion`.
- `GET /`: Obtiene todos los métodos de pago. **Roles:** ADMIN, ENTRENADOR.
- `GET /:id`: Obtiene un método de pago por ID. **Roles:** ADMIN, ENTRENADOR.
- `PUT /:id`: Actualiza un método. **Rol:** ADMIN. Requiere: `nombre`, `descripcion`.
- `DELETE /:id`: Elimina un método. **Rol:** ADMIN.

## Reportes (`/api/reportes`)
- `GET /ingresos_hoy`: Ingresos del día actual. **Rol:** ADMIN.
- `GET /egresos_hoy`: Egresos del día actual. **Rol:** ADMIN.
- `GET /ganancia_hoy`: Ganancia neta (ingresos - egresos) del día. **Rol:** ADMIN.
- `GET /ingresos_mes`: Ingresos del mes actual. **Rol:** ADMIN.
- `GET /productos_mas_vendidos`: Lista de productos más vendidos. **Rol:** ADMIN.
- `GET /membresias_vencidas`: Membresías cuya fecha fin ya pasó. **Rol:** ADMIN.
- `GET /productos_stock_bajo`: Productos con stock <= 5. **Rol:** ADMIN.
- `GET /dashboard`: Resumen general de dashboard. **Roles:** ADMIN, ENTRENADOR.
