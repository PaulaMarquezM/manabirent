-- Portoviejo 360 / ManabíRent
-- BDD.sql - esquema relacional consolidado para Supabase PostgreSQL.
-- Ejecutar en el SQL Editor sobre una base nueva.

create extension if not exists pgcrypto;

create table if not exists public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  nombre text,
  email text,
  rol text not null default 'arrendatario' check (rol in ('arrendador','arrendatario','admin')),
  cuenta_activa boolean not null default true,
  motivo_inhabilitacion text,
  moderada_at timestamptz,
  moderada_por uuid references public.perfiles(id) on delete set null
);

create table if not exists public.propiedades (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), titulo text not null,
  tipo text not null check (tipo in ('habitacion','departamento','suite','casa')),
  ciudad text not null, sector text not null, precio numeric(10,2) not null check (precio >= 0),
  descripcion text not null, servicios text[] not null default '{}', reglas text,
  min_meses integer not null default 3 check (min_meses > 0), lat double precision, lng double precision,
  fotos text[] not null default '{}', estado text not null default 'disponible'
    check (estado in ('disponible','arrendada','mantenimiento')),
  verificacion text not null default 'pendiente' check (verificacion in ('pendiente','aprobada','rechazada')),
  arrendador_id uuid references public.perfiles(id) on delete set null,
  arrendador_nombre text, arrendador_telefono text, arrendador_email text,
  publicacion_activa boolean not null default true, motivo_moderacion text,
  moderada_at timestamptz, moderada_por uuid references public.perfiles(id) on delete set null
);

create table if not exists public.solicitudes (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
  propiedad_id uuid references public.propiedades(id) on delete cascade,
  arrendador_id uuid references public.perfiles(id) on delete set null,
  arrendatario_id uuid references public.perfiles(id) on delete set null,
  propiedad_titulo text, propiedad_ciudad text, propiedad_sector text, precio numeric(10,2),
  arrendador_nombre text, arrendatario_nombre text, arrendatario_email text, arrendatario_telefono text,
  mensaje text, fecha_inicio date, meses integer not null default 3 check (meses > 0),
  estado text not null default 'pendiente' check (estado in ('pendiente','aprobada','rechazada')),
  respuesta text
);

create table if not exists public.contratos (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
  solicitud_id uuid references public.solicitudes(id) on delete set null,
  propiedad_id uuid references public.propiedades(id) on delete set null,
  arrendador_id uuid references public.perfiles(id) on delete set null,
  arrendatario_id uuid references public.perfiles(id) on delete set null,
  propiedad_titulo text, propiedad_ciudad text, propiedad_sector text,
  arrendador_nombre text, arrendatario_nombre text, arrendatario_email text,
  precio_mensual numeric(10,2), fecha_inicio date, fecha_fin date, meses integer,
  estado text not null default 'vigente' check (estado in ('vigente','finalizado'))
);

create table if not exists public.incidencias (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), contrato_id uuid references public.contratos(id) on delete cascade,
  propiedad_id uuid references public.propiedades(id) on delete set null,
  arrendador_id uuid references public.perfiles(id) on delete set null,
  arrendatario_id uuid references public.perfiles(id) on delete set null,
  propiedad_titulo text, propiedad_ciudad text, propiedad_sector text, arrendador_nombre text,
  arrendatario_nombre text, arrendatario_email text,
  categoria text not null check (categoria in ('plomeria','electricidad','internet','estructura','seguridad','otro')),
  prioridad text not null default 'media' check (prioridad in ('baja','media','alta','urgente')),
  titulo text not null, descripcion text not null,
  estado text not null default 'reportada' check (estado in ('reportada','en_proceso','resuelta')),
  respuesta text
);

create table if not exists public.incidencias_historial (
  id uuid primary key default gen_random_uuid(), incidencia_id uuid not null references public.incidencias(id) on delete cascade,
  created_at timestamptz not null default now(), estado_anterior text,
  estado_nuevo text not null check (estado_nuevo in ('reportada','en_proceso','resuelta')),
  cambiado_por uuid references public.perfiles(id) on delete set null,
  cambiado_por_nombre text, comentario text check (comentario is null or char_length(comentario) <= 300)
);

create table if not exists public.renovaciones (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), resolved_at timestamptz,
  contrato_id uuid not null references public.contratos(id) on delete cascade,
  arrendador_id uuid not null references public.perfiles(id) on delete cascade,
  arrendatario_id uuid not null references public.perfiles(id) on delete cascade,
  meses integer not null check (meses between 1 and 24), mensaje text,
  estado text not null default 'pendiente' check (estado in ('pendiente','aprobada','rechazada')),
  respuesta text
);

create index if not exists propiedades_estado_idx on public.propiedades(estado);
create index if not exists propiedades_ciudad_idx on public.propiedades(ciudad);
create index if not exists propiedades_arrendador_idx on public.propiedades(arrendador_id);
create index if not exists solicitudes_propiedad_idx on public.solicitudes(propiedad_id);
create index if not exists solicitudes_arrendador_idx on public.solicitudes(arrendador_id);
create index if not exists solicitudes_arrendatario_idx on public.solicitudes(arrendatario_id);
create index if not exists contratos_arrendador_idx on public.contratos(arrendador_id);
create index if not exists contratos_arrendatario_idx on public.contratos(arrendatario_id);
create index if not exists incidencias_contrato_idx on public.incidencias(contrato_id);
create index if not exists incidencias_estado_idx on public.incidencias(estado);
create index if not exists historial_incidencia_fecha_idx on public.incidencias_historial(incidencia_id, created_at);
create index if not exists renovaciones_contrato_idx on public.renovaciones(contrato_id);
create unique index if not exists solicitudes_unica_activa_idx on public.solicitudes(propiedad_id, arrendatario_id) where estado in ('pendiente','aprobada');
create unique index if not exists renovaciones_pendiente_idx on public.renovaciones(contrato_id) where estado = 'pendiente';

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists propiedades_set_updated_at on public.propiedades;
create trigger propiedades_set_updated_at before update on public.propiedades for each row execute function public.set_updated_at();
drop trigger if exists incidencias_set_updated_at on public.incidencias;
create trigger incidencias_set_updated_at before update on public.incidencias for each row execute function public.set_updated_at();

alter table public.perfiles enable row level security;
alter table public.propiedades enable row level security;
alter table public.solicitudes enable row level security;
alter table public.contratos enable row level security;
alter table public.incidencias enable row level security;
alter table public.incidencias_historial enable row level security;
alter table public.renovaciones enable row level security;

-- Políticas iniciales del prototipo. En producción deben usar auth.uid() y rol.
do $$
declare tabla text;
begin
  foreach tabla in array array['perfiles','propiedades','solicitudes','contratos','incidencias','incidencias_historial','renovaciones'] loop
    execute format('drop policy if exists "lectura prototipo" on public.%I', tabla);
    execute format('create policy "lectura prototipo" on public.%I for select using (true)', tabla);
    execute format('drop policy if exists "escritura prototipo" on public.%I', tabla);
    execute format('create policy "escritura prototipo" on public.%I for all using (true) with check (true)', tabla);
  end loop;
end $$;

insert into storage.buckets (id, name, public) values ('propiedades','propiedades',true) on conflict (id) do nothing;
