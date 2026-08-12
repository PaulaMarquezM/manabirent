-- ManabíRent — reparación de la función RPC para solicitudes de arriendo.
-- Ejecutar en Supabase SQL Editor.

alter table public.propiedades
  add column if not exists publicacion_activa boolean not null default true;

create table if not exists public.solicitudes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  propiedad_id uuid references public.propiedades(id) on delete cascade,
  arrendador_id uuid,
  arrendatario_id uuid,
  propiedad_titulo text,
  propiedad_ciudad text,
  propiedad_sector text,
  precio numeric(10,2),
  arrendador_nombre text,
  arrendatario_nombre text,
  arrendatario_email text,
  mensaje text,
  fecha_inicio date,
  meses int not null default 3,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'aprobada', 'rechazada')),
  respuesta text
);

create unique index if not exists solicitudes_unica_activa_idx
  on public.solicitudes (propiedad_id, arrendatario_id)
  where estado in ('pendiente', 'aprobada');

create or replace function public.crear_solicitud(
  p_propiedad_id uuid,
  p_fecha_inicio date,
  p_meses integer,
  p_mensaje text default null
)
returns public.solicitudes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_perfil public.perfiles%rowtype;
  v_propiedad public.propiedades%rowtype;
  v_resultado public.solicitudes%rowtype;
begin
  select * into v_perfil from public.perfiles where id = v_uid;
  if v_uid is null or not found or not v_perfil.cuenta_activa or v_perfil.rol <> 'arrendatario' then
    raise exception 'Usuario no autorizado para solicitar un arriendo';
  end if;

  select * into v_propiedad
  from public.propiedades
  where id = p_propiedad_id
  for update;

  if not found or not v_propiedad.publicacion_activa
     or v_propiedad.estado <> 'disponible'
     or v_propiedad.verificacion = 'rechazada' then
    raise exception 'El inmueble no esta disponible';
  end if;

  if p_fecha_inicio is null or coalesce(p_meses, 0) < v_propiedad.min_meses then
    raise exception 'Fecha o duracion no validas';
  end if;

  if exists (
    select 1 from public.solicitudes
    where propiedad_id = p_propiedad_id
      and arrendatario_id = v_uid
      and estado in ('pendiente', 'aprobada')
  ) then
    raise exception 'Ya existe una solicitud activa para este inmueble';
  end if;

  insert into public.solicitudes (
    propiedad_id, arrendador_id, arrendatario_id, propiedad_titulo,
    propiedad_ciudad, propiedad_sector, precio, arrendador_nombre,
    arrendatario_nombre, arrendatario_email, mensaje, fecha_inicio, meses, estado
  ) values (
    v_propiedad.id, v_propiedad.arrendador_id, v_uid, v_propiedad.titulo,
    v_propiedad.ciudad, v_propiedad.sector, v_propiedad.precio,
    v_propiedad.arrendador_nombre, v_perfil.nombre, v_perfil.email,
    nullif(trim(p_mensaje), ''), p_fecha_inicio, p_meses, 'pendiente'
  ) returning * into v_resultado;

  return v_resultado;
end;
$$;

revoke all on function public.crear_solicitud(uuid, date, integer, text) from public, anon;
grant execute on function public.crear_solicitud(uuid, date, integer, text) to authenticated;

notify pgrst, 'reload schema';
