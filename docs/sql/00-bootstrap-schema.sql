-- Bootstrap schema for gym_manager (PostgreSQL)
-- Safe to run multiple times (idempotent).

-- Core tables
CREATE TABLE IF NOT EXISTS public.usuarios (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(30) NOT NULL DEFAULT 'ENTRENADOR',
    estado BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.clientes (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(140) NOT NULL,
    cedula VARCHAR(50) NOT NULL,
    telefono VARCHAR(50),
    email VARCHAR(180),
    estado BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.metodos_pago (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.productos (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(140) NOT NULL,
    precio_compra NUMERIC(12, 2) NOT NULL,
    precio_venta NUMERIC(12, 2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tipos_membresia (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(140) NOT NULL,
    duracion_dias INTEGER NOT NULL,
    precio NUMERIC(12, 2) NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ventas (
    id BIGSERIAL PRIMARY KEY,
    cliente_id BIGINT,
    metodo_pago_id BIGINT NOT NULL,
    tipo_venta VARCHAR(40) NOT NULL,
    total NUMERIC(12, 2) NOT NULL,
    descripcion TEXT,
    fecha TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.detalle_ventas (
    id BIGSERIAL PRIMARY KEY,
    venta_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.membresias (
    id BIGSERIAL PRIMARY KEY,
    cliente_id BIGINT NOT NULL,
    tipo_membresia_id BIGINT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'activa',
    venta_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.egresos (
    id BIGSERIAL PRIMARY KEY,
    descripcion TEXT NOT NULL,
    monto NUMERIC(12, 2) NOT NULL,
    metodo_pago_id BIGINT NOT NULL,
    categoria VARCHAR(80),
    fecha TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Foreign keys (added only if they do not exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ventas_cliente_fk') THEN
    ALTER TABLE public.ventas
      ADD CONSTRAINT ventas_cliente_fk
      FOREIGN KEY (cliente_id) REFERENCES public.clientes(id)
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ventas_metodo_pago_fk') THEN
    ALTER TABLE public.ventas
      ADD CONSTRAINT ventas_metodo_pago_fk
      FOREIGN KEY (metodo_pago_id) REFERENCES public.metodos_pago(id)
      ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'detalle_ventas_venta_fk') THEN
    ALTER TABLE public.detalle_ventas
      ADD CONSTRAINT detalle_ventas_venta_fk
      FOREIGN KEY (venta_id) REFERENCES public.ventas(id)
      ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'detalle_ventas_producto_fk') THEN
    ALTER TABLE public.detalle_ventas
      ADD CONSTRAINT detalle_ventas_producto_fk
      FOREIGN KEY (producto_id) REFERENCES public.productos(id)
      ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'membresias_cliente_fk') THEN
    ALTER TABLE public.membresias
      ADD CONSTRAINT membresias_cliente_fk
      FOREIGN KEY (cliente_id) REFERENCES public.clientes(id)
      ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'membresias_tipo_fk') THEN
    ALTER TABLE public.membresias
      ADD CONSTRAINT membresias_tipo_fk
      FOREIGN KEY (tipo_membresia_id) REFERENCES public.tipos_membresia(id)
      ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'membresias_venta_fk') THEN
    ALTER TABLE public.membresias
      ADD CONSTRAINT membresias_venta_fk
      FOREIGN KEY (venta_id) REFERENCES public.ventas(id)
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'egresos_metodo_pago_fk') THEN
    ALTER TABLE public.egresos
      ADD CONSTRAINT egresos_metodo_pago_fk
      FOREIGN KEY (metodo_pago_id) REFERENCES public.metodos_pago(id)
      ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios (email);

CREATE INDEX IF NOT EXISTS idx_clientes_cedula ON public.clientes (cedula);

CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON public.ventas (fecha);

CREATE INDEX IF NOT EXISTS idx_egresos_fecha ON public.egresos (fecha);

CREATE INDEX IF NOT EXISTS idx_membresias_cliente ON public.membresias (cliente_id);

-- Base business constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_email_unique') THEN
    ALTER TABLE public.usuarios
      ADD CONSTRAINT usuarios_email_unique UNIQUE (email);

END IF;

IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
        conname = 'usuarios_rol_valid'
) THEN
ALTER TABLE public.usuarios
ADD CONSTRAINT usuarios_rol_valid CHECK (
    rol IN (
        'ADMIN',
        'ENTRENADOR'
    )
);

END IF;

IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
        conname = 'ventas_tipo_valid'
) THEN
ALTER TABLE public.ventas
ADD CONSTRAINT ventas_tipo_valid CHECK (
    tipo_venta IN (
        'entrada_dia',
        'producto',
        'membresia'
    )
);

END IF;

IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
        conname = 'ventas_total_positive'
) THEN
ALTER TABLE public.ventas
ADD CONSTRAINT ventas_total_positive CHECK (total > 0);

END IF;

IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
        conname = 'egresos_monto_positive'
) THEN
ALTER TABLE public.egresos
ADD CONSTRAINT egresos_monto_positive CHECK (monto > 0);

END IF;

IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
        conname = 'productos_precio_compra_positive'
) THEN
ALTER TABLE public.productos
ADD CONSTRAINT productos_precio_compra_positive CHECK (precio_compra > 0);

END IF;

IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
        conname = 'productos_precio_venta_positive'
) THEN
ALTER TABLE public.productos
ADD CONSTRAINT productos_precio_venta_positive CHECK (precio_venta > 0);

END IF;

IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
        conname = 'productos_stock_non_negative'
) THEN
ALTER TABLE public.productos
ADD CONSTRAINT productos_stock_non_negative CHECK (stock >= 0);

END IF;

IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
        conname = 'tipos_membresia_duracion_positive'
) THEN
ALTER TABLE public.tipos_membresia
ADD CONSTRAINT tipos_membresia_duracion_positive CHECK (duracion_dias > 0);

END IF;

IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
        conname = 'tipos_membresia_precio_positive'
) THEN
ALTER TABLE public.tipos_membresia
ADD CONSTRAINT tipos_membresia_precio_positive CHECK (precio > 0);

END IF;

IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
        conname = 'detalle_ventas_cantidad_positive'
) THEN
ALTER TABLE public.detalle_ventas
ADD CONSTRAINT detalle_ventas_cantidad_positive CHECK (cantidad > 0);

END IF;

IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
        conname = 'membresias_estado_valid'
) THEN
ALTER TABLE public.membresias
ADD CONSTRAINT membresias_estado_valid CHECK (
    estado IN ('activa', 'inactiva')
);

END IF;

END $$;

-- Seed minimal payment methods if empty
INSERT INTO
    public.metodos_pago (nombre, descripcion)
SELECT 'Efectivo', 'Pago en efectivo'
WHERE
    NOT EXISTS (
        SELECT 1
        FROM public.metodos_pago
    );

INSERT INTO
    public.metodos_pago (nombre, descripcion)
SELECT 'Transferencia', 'Pago por transferencia'
WHERE
    NOT EXISTS (
        SELECT 1
        FROM public.metodos_pago
        WHERE
            nombre = 'Transferencia'
    );