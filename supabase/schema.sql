-- ============================================================================
-- ManabíRent — Módulo 2: Gestión de Propiedades
-- Ejecutar en el SQL Editor de Supabase (una sola vez).
-- RF-04 CRUD de propiedades + subida de fotos a Storage
-- RF-05 Control de estados: Disponible / Arrendada / En Mantenimiento
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Tabla de propiedades
-- ---------------------------------------------------------------------------
create table if not exists public.propiedades (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  -- Datos básicos del inmueble
  titulo         text not null,
  tipo           text not null check (tipo in ('habitacion', 'departamento', 'suite', 'casa')),
  ciudad         text not null,
  sector         text not null,
  precio         numeric(10,2) not null check (precio >= 0),
  descripcion    text not null,
  servicios      text[] not null default '{}',
  reglas         text,
  min_meses      int not null default 3,

  -- Ubicación en el mapa (opcional)
  lat            double precision,
  lng            double precision,

  -- Fotos: URLs públicas dentro del bucket de Storage
  fotos          text[] not null default '{}',

  -- RF-05: estado operativo del inmueble
  estado         text not null default 'disponible'
                   check (estado in ('disponible', 'arrendada', 'mantenimiento')),

  -- Estado de verificación municipal (flujo del Panel Admin)
  verificacion   text not null default 'pendiente'
                   check (verificacion in ('pendiente', 'aprobada', 'rechazada')),

  -- Datos del arrendador (mientras no exista Supabase Auth se guardan como texto).
  -- arrendador_id enlazará con auth.users cuando se implemente el login real.
  arrendador_id       uuid,
  arrendador_nombre   text,
  arrendador_telefono text,
  arrendador_email    text
);

-- Índices para las consultas más comunes
create index if not exists propiedades_estado_idx      on public.propiedades (estado);
create index if not exists propiedades_ciudad_idx      on public.propiedades (ciudad);
create index if not exists propiedades_arrendador_idx  on public.propiedades (arrendador_email);

-- Mantener updated_at al día
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists propiedades_set_updated_at on public.propiedades;
create trigger propiedades_set_updated_at
  before update on public.propiedades
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2) Row Level Security (RLS)
--    NOTA (prototipo): mientras el login sigue siendo simulado, se permite al
--    rol anónimo leer/crear/editar. Cuando se integre Supabase Auth (Módulo de
--    autenticación) hay que reemplazar estas políticas por unas basadas en
--    auth.uid() = arrendador_id. Ver TODO abajo.
-- ---------------------------------------------------------------------------
alter table public.propiedades enable row level security;

drop policy if exists "lectura publica" on public.propiedades;
create policy "lectura publica"
  on public.propiedades for select
  using (true);

drop policy if exists "insertar prototipo" on public.propiedades;
create policy "insertar prototipo"
  on public.propiedades for insert
  with check (true);

drop policy if exists "actualizar prototipo" on public.propiedades;
create policy "actualizar prototipo"
  on public.propiedades for update
  using (true) with check (true);

drop policy if exists "eliminar prototipo" on public.propiedades;
create policy "eliminar prototipo"
  on public.propiedades for delete
  using (true);

-- TODO (producción, con Supabase Auth):
--   drop policy "insertar prototipo" ...  y usar:
--   create policy "arrendador crea lo suyo" on public.propiedades
--     for insert with check (auth.uid() = arrendador_id);
--   create policy "arrendador edita lo suyo" on public.propiedades
--     for update using (auth.uid() = arrendador_id);

-- ---------------------------------------------------------------------------
-- 3) Storage: bucket público para las fotos
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('propiedades', 'propiedades', true)
on conflict (id) do nothing;

-- Lectura pública de las fotos
drop policy if exists "fotos lectura publica" on storage.objects;
create policy "fotos lectura publica"
  on storage.objects for select
  using (bucket_id = 'propiedades');

-- Subida de fotos (prototipo: rol anónimo). Endurecer con Auth en producción.
drop policy if exists "fotos subida prototipo" on storage.objects;
create policy "fotos subida prototipo"
  on storage.objects for insert
  with check (bucket_id = 'propiedades');

drop policy if exists "fotos borrado prototipo" on storage.objects;
create policy "fotos borrado prototipo"
  on storage.objects for delete
  using (bucket_id = 'propiedades');
