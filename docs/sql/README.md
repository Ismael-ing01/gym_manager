# SQL Setup (PostgreSQL)

## Orden recomendado

1. Conectate a la base correcta (`gym_manager`).
2. Ejecuta `00-bootstrap-schema.sql`.
3. Ejecuta `security-hardening.sql` (opcional, ya viene cubierto por bootstrap, pero se puede reusar).

## Verificacion rapida

```sql
SELECT current_database(), current_schema();

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'usuarios',
    'clientes',
    'metodos_pago',
    'productos',
    'tipos_membresia',
    'ventas',
    'detalle_ventas',
    'membresias',
    'egresos'
  )
ORDER BY table_name;

SELECT conname
FROM pg_constraint
WHERE conname IN (
  'usuarios_email_unique',
  'usuarios_rol_valid',
  'ventas_total_positive',
  'egresos_monto_positive',
  'productos_precio_compra_positive',
  'productos_precio_venta_positive',
  'productos_stock_non_negative',
  'tipos_membresia_duracion_positive',
  'tipos_membresia_precio_positive',
  'detalle_ventas_cantidad_positive',
  'membresias_estado_valid'
)
ORDER BY conname;
```

## Si aparece "transaccion abortada"

Ejecuta:

```sql
ROLLBACK;
```

Luego vuelve a correr los scripts.
