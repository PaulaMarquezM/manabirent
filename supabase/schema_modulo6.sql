-- ============================================================================
-- ManabíRent — Módulo 6: Panel Municipal y Estadísticas
-- Ejecutar en el SQL Editor de Supabase después de schema.sql y schema_modulo3.sql.
-- RF-13 Supervisión global | RF-14 Reportes estadísticos | RF-15 Moderación
-- ============================================================================

-- Cada usuario de Auth tiene un perfil consultable por el panel municipal.
create table if not exists public.perfiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  created_at            timestamptz not null default now(),
  nombre                text,
  email                 text,
  rol                   text not null default 'arrendatario'
                          check (rol in ('arrendador', 'arrendatario', 'admin')),
  cuenta_activa         boolean not null default true,
  motivo_inhabilitacion text,
  moderada_at           timestamptz,
  moderada_por          uuid
);

create index if not exists perfiles_rol_idx on public.perfiles (rol);
create index if not exists perfiles_cuenta_activa_idx on public.perfiles (cuenta_activa);

-- Los nuevos registros de Auth se reflejan automáticamente en perfiles.
create or replace function public.crear_perfil_usuario()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre, email, rol)
  values (
    new.id,
    new.raw_user_meta_data ->> 'nombre',
    new.email,
    coalesce(new.raw_user_meta_data ->> 'rol', 'arrendatario')
  )
  on conflict (id) do update set
    nombre = excluded.nombre,
    email = excluded.email,
    rol = excluded.rol;
  return new;
end;
$$;

drop trigger if exists auth_usuario_crear_perfil on auth.users;
create trigger auth_usuario_crear_perfil
  after insert on auth.users
  for each row execute function public.crear_perfil_usuario();

-- Incluye las cuentas creadas antes de instalar este módulo.
insert into public.perfiles (id, nombre, email, rol)
select
  id,
  raw_user_meta_data ->> 'nombre',
  email,
  coalesce(raw_user_meta_data ->> 'rol', 'arrendatario')
from auth.users
on conflict (id) do update set
  nombre = excluded.nombre,
  email = excluded.email,
  rol = excluded.rol;

-- La inhabilitación es independiente del estado operativo del inmueble.
alter table public.propiedades
  add column if not exists publicacion_activa boolean not null default true,
  add column if not exists motivo_moderacion text,
  add column if not exists moderada_at timestamptz,
  add column if not exists moderada_por uuid;

create index if not exists propiedades_publicacion_activa_idx
  on public.propiedades (publicacion_activa);

-- Políticas de prototipo consistentes con los módulos anteriores. Antes de
-- producción deben limitarse por auth.uid() y rol de administrador.
alter table public.perfiles enable row level security;

drop policy if exists "perfiles lectura prototipo" on public.perfiles;
drop policy if exists "perfiles insertar prototipo" on public.perfiles;
drop policy if exists "perfiles actualizar prototipo" on public.perfiles;
create policy "perfiles lectura prototipo" on public.perfiles for select using (true);
create policy "perfiles insertar prototipo" on public.perfiles for insert with check (true);
create policy "perfiles actualizar prototipo" on public.perfiles for update using (true) with check (true);
