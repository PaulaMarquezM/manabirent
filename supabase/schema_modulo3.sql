-- ============================================================================
-- ManabíRent — Módulo 3: Gestión de Contratos
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de schema.sql (Módulo 2).
-- RF-06 Arrendatario envía solicitud de arriendo
-- RF-07 Arrendador aprueba/rechaza + genera ficha digital del contrato
-- RF-08 Historial contractual (vigentes y finalizados) para ambos roles
-- RF-09 Reporte de incidencias asociadas a contratos activos
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Solicitudes de arriendo (RF-06 / RF-07)
--    Se guardan campos denormalizados de la propiedad y del solicitante para
--    poder mostrar la información sin joins.
-- ---------------------------------------------------------------------------
create table if not exists public.solicitudes (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz not null default now(),

  propiedad_id          uuid references public.propiedades(id) on delete cascade,
  arrendador_id         uuid,   -- dueño de la propiedad
  arrendatario_id       uuid,   -- solicitante (auth.uid del arrendatario)

  -- Datos denormalizados de la propiedad
  propiedad_titulo      text,
  propiedad_ciudad      text,
  propiedad_sector      text,
  precio                numeric(10,2),
  arrendador_nombre     text,

  -- Datos del solicitante
  arrendatario_nombre   text,
  arrendatario_email    text,
  arrendatario_telefono text,

  -- Datos de la solicitud
  mensaje               text,
  fecha_inicio          date,
  meses                 int not null default 3,

  estado                text not null default 'pendiente'
                          check (estado in ('pendiente', 'aprobada', 'rechazada')),
  respuesta             text    -- nota del arrendador al aprobar/rechazar
);

create index if not exists solicitudes_arrendador_idx   on public.solicitudes (arrendador_id);
create index if not exists solicitudes_arrendatario_idx on public.solicitudes (arrendatario_id);
create index if not exists solicitudes_propiedad_idx    on public.solicitudes (propiedad_id);
create unique index if not exists solicitudes_unica_activa_idx
  on public.solicitudes (propiedad_id, arrendatario_id)
  where estado in ('pendiente', 'aprobada');

-- ---------------------------------------------------------------------------
-- 2) Contratos = ficha digital (RF-07 / RF-08)
-- ---------------------------------------------------------------------------
create table if not exists public.contratos (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),

  solicitud_id        uuid references public.solicitudes(id) on delete set null,
  propiedad_id        uuid references public.propiedades(id) on delete set null,
  arrendador_id       uuid,
  arrendatario_id     uuid,

  -- Ficha (denormalizada para conservar el histórico aunque cambie la propiedad)
  propiedad_titulo    text,
  propiedad_ciudad    text,
  propiedad_sector    text,
  arrendador_nombre   text,
  arrendatario_nombre text,
  arrendatario_email  text,
  precio_mensual      numeric(10,2),
  fecha_inicio        date,
  fecha_fin           date,
  meses               int,

  estado              text not null default 'vigente'
                        check (estado in ('vigente', 'finalizado'))
);

create index if not exists contratos_arrendador_idx   on public.contratos (arrendador_id);
create index if not exists contratos_arrendatario_idx on public.contratos (arrendatario_id);

-- ---------------------------------------------------------------------------
-- 3) Incidencias de mantenimiento (RF-09)
-- ---------------------------------------------------------------------------
create table if not exists public.incidencias (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  contrato_id         uuid references public.contratos(id) on delete cascade,
  propiedad_id        uuid references public.propiedades(id) on delete set null,
  arrendador_id       uuid,
  arrendatario_id     uuid,

  -- Datos denormalizados para mostrar el reporte sin joins.
  propiedad_titulo    text,
  propiedad_ciudad    text,
  propiedad_sector    text,
  arrendador_nombre   text,
  arrendatario_nombre text,
  arrendatario_email  text,

  categoria           text not null
                        check (categoria in ('plomeria', 'electricidad', 'internet', 'estructura', 'seguridad', 'otro')),
  prioridad           text not null default 'media'
                        check (prioridad in ('baja', 'media', 'alta', 'urgente')),
  titulo              text not null,
  descripcion         text not null,
  estado              text not null default 'reportada'
                        check (estado in ('reportada', 'en_revision', 'en_proceso', 'resuelta', 'cerrada')),
  respuesta           text
);

create index if not exists incidencias_contrato_idx     on public.incidencias (contrato_id);
create index if not exists incidencias_arrendador_idx   on public.incidencias (arrendador_id);
create index if not exists incidencias_arrendatario_idx on public.incidencias (arrendatario_id);
create index if not exists incidencias_estado_idx       on public.incidencias (estado);

-- Asegurar que la función set_updated_at existe (en caso de que no se haya corrido schema.sql)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists incidencias_set_updated_at on public.incidencias;
create trigger incidencias_set_updated_at
  before update on public.incidencias
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4) Row Level Security (RLS)
--    NOTA (prototipo): políticas permisivas para el rol anónimo mientras se
--    integra del todo Supabase Auth con las peticiones. Endurecer luego con
--    auth.uid() = arrendador_id / arrendatario_id. Ver TODO.
-- ---------------------------------------------------------------------------
alter table public.solicitudes enable row level security;
alter table public.contratos   enable row level security;
alter table public.incidencias enable row level security;

drop policy if exists "solicitudes lectura"      on public.solicitudes;
drop policy if exists "solicitudes insertar"     on public.solicitudes;
drop policy if exists "solicitudes actualizar"   on public.solicitudes;
create policy "solicitudes lectura"    on public.solicitudes for select using (true);
create policy "solicitudes insertar"   on public.solicitudes for insert with check (true);
create policy "solicitudes actualizar" on public.solicitudes for update using (true) with check (true);

drop policy if exists "contratos lectura"    on public.contratos;
drop policy if exists "contratos insertar"   on public.contratos;
drop policy if exists "contratos actualizar" on public.contratos;
create policy "contratos lectura"    on public.contratos for select using (true);
create policy "contratos insertar"   on public.contratos for insert with check (true);
create policy "contratos actualizar" on public.contratos for update using (true) with check (true);

drop policy if exists "incidencias lectura"    on public.incidencias;
drop policy if exists "incidencias insertar"   on public.incidencias;
drop policy if exists "incidencias actualizar" on public.incidencias;
create policy "incidencias lectura"    on public.incidencias for select using (true);
create policy "incidencias insertar"   on public.incidencias for insert with check (true);
create policy "incidencias actualizar" on public.incidencias for update using (true) with check (true);

-- TODO (producción, con Supabase Auth en las requests):
--   solicitudes insert: with check (auth.uid() = arrendatario_id)
--   solicitudes select: using (auth.uid() in (arrendador_id, arrendatario_id))
--   solicitudes update: using (auth.uid() = arrendador_id)   -- solo el dueño aprueba/rechaza
--   contratos  select: using (auth.uid() in (arrendador_id, arrendatario_id))
--   incidencias insert: with check (auth.uid() = arrendatario_id)
--   incidencias select: using (auth.uid() in (arrendador_id, arrendatario_id))
