-- Security hardening constraints for PostgreSQL
-- Review in staging before production.

-- 1) Unique email on usuarios
DO $$
BEGIN
  IF to_regclass('public.usuarios') IS NOT NULL
     AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'usuarios_email_unique'
  ) THEN
    ALTER TABLE public.usuarios
      ADD CONSTRAINT usuarios_email_unique UNIQUE (email);
  END IF;
END $$;

-- 2) Positive money checks
DO $$
BEGIN
  IF to_regclass('public.ventas') IS NOT NULL
     AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ventas_total_positive'
  ) THEN
    ALTER TABLE public.ventas
      ADD CONSTRAINT ventas_total_positive CHECK (total > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.egresos') IS NOT NULL
     AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'egresos_monto_positive'
  ) THEN
    ALTER TABLE public.egresos
      ADD CONSTRAINT egresos_monto_positive CHECK (monto > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.productos') IS NOT NULL
     AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'productos_precio_compra_positive'
  ) THEN
    ALTER TABLE public.productos
      ADD CONSTRAINT productos_precio_compra_positive CHECK (precio_compra > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.productos') IS NOT NULL
     AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'productos_precio_venta_positive'
  ) THEN
    ALTER TABLE public.productos
      ADD CONSTRAINT productos_precio_venta_positive CHECK (precio_venta > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.productos') IS NOT NULL
     AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'productos_stock_non_negative'
  ) THEN
    ALTER TABLE public.productos
      ADD CONSTRAINT productos_stock_non_negative CHECK (stock >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.tipos_membresia') IS NOT NULL
     AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tipos_membresia_duracion_positive'
  ) THEN
    ALTER TABLE public.tipos_membresia
      ADD CONSTRAINT tipos_membresia_duracion_positive CHECK (duracion_dias > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.tipos_membresia') IS NOT NULL
     AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tipos_membresia_precio_positive'
  ) THEN
    ALTER TABLE public.tipos_membresia
      ADD CONSTRAINT tipos_membresia_precio_positive CHECK (precio > 0);
  END IF;
END $$;

-- 3) Role whitelist
DO $$
BEGIN
  IF to_regclass('public.usuarios') IS NOT NULL
     AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'usuarios_rol_valid'
  ) THEN
    ALTER TABLE public.usuarios
      ADD CONSTRAINT usuarios_rol_valid CHECK (rol IN ('ADMIN', 'ENTRENADOR', 'EMPLEADO'));
  END IF;
END $$;