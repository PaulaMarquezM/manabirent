-- ManabiRent: cierre de accesos publicos, RLS por propietario y operaciones atomicas.
-- Aplicar desde Supabase SQL Editor con un usuario administrador.

begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

alter table public.perfiles
  add column if not exists email text,
  add column if not exists cuenta_activa boolean not null default true,
  add column if not exists motivo_inhabilitacion text,
  add column if not exists moderada_at timestamptz,
  add column if not exists moderada_por uuid;

update public.perfiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is distinct from u.email;

alter table public.propiedades
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists publicacion_activa boolean not null default true,
  add column if not exists motivo_moderacion text,
  add column if not exists moderada_at timestamptz,
  add column if not exists moderada_por uuid;

create table if not exists public.incidencias (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  contrato_id uuid references public.contratos(id) on delete set null,
  propiedad_id uuid references public.propiedades(id) on delete set null,
  arrendador_id uuid not null,
  arrendatario_id uuid not null,
  propiedad_titulo text,
  propiedad_ciudad text,
  propiedad_sector text,
  arrendador_nombre text,
  arrendatario_nombre text,
  arrendatario_email text,
  categoria text not null,
  prioridad text not null default 'media',
  titulo text not null,
  descripcion text not null,
  estado text not null default 'reportada'
    check (estado in ('reportada', 'en_proceso', 'resuelta')),
  respuesta text
);

create index if not exists propiedades_arrendador_id_idx on public.propiedades (arrendador_id);
create index if not exists incidencias_contrato_idx on public.incidencias (contrato_id);
create index if not exists incidencias_propiedad_idx on public.incidencias (propiedad_id);
create index if not exists incidencias_arrendador_idx on public.incidencias (arrendador_id);
create index if not exists incidencias_arrendatario_idx on public.incidencias (arrendatario_id);
create unique index if not exists contratos_solicitud_unica_idx
  on public.contratos (solicitud_id) where solicitud_id is not null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists propiedades_set_updated_at on public.propiedades;
create trigger propiedades_set_updated_at
  before update on public.propiedades
  for each row execute function public.set_updated_at();
drop trigger if exists incidencias_set_updated_at on public.incidencias;
create trigger incidencias_set_updated_at
  before update on public.incidencias
  for each row execute function public.set_updated_at();

create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles p
    where p.id = (select auth.uid())
      and p.rol = 'admin'
      and p.cuenta_activa
  );
$$;

create or replace function public.usuario_activo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles p
    where p.id = (select auth.uid()) and p.cuenta_activa
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre, cedula, rol, email, cuenta_activa)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'nombre', ''), 'Usuario'),
    coalesce(nullif(new.raw_user_meta_data ->> 'cedula', ''), 'sin-cedula'),
    case when new.raw_user_meta_data ->> 'rol' = 'arrendador'
      then 'arrendador' else 'arrendatario' end,
    new.email,
    true
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

-- La vista es la unica interfaz publica del catalogo. No expone telefono,
-- email, ids de usuarios ni campos internos de moderacion.
drop view if exists public.propiedades_publicas;
create view public.propiedades_publicas
with (security_barrier = true)
as
select
  id, titulo, tipo, ciudad, sector, precio, descripcion, servicios, reglas,
  min_meses, lat, lng, fotos, estado, verificacion, arrendador_nombre, created_at
from public.propiedades
where publicacion_activa
  and estado = 'disponible'
  and verificacion <> 'rechazada';

-- Elimina las politicas prototipo existentes para no dejar rutas permisivas.
do $$
declare p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('perfiles', 'propiedades', 'solicitudes', 'contratos', 'incidencias')
  loop
    execute format('drop policy if exists %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end;
$$;

alter table public.perfiles enable row level security;
alter table public.propiedades enable row level security;
alter table public.solicitudes enable row level security;
alter table public.contratos enable row level security;
alter table public.incidencias enable row level security;

create policy perfiles_leer_propio_o_admin on public.perfiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.es_admin()));
create policy perfiles_editar_propio on public.perfiles
  for update to authenticated
  using (id = (select auth.uid()) and (select public.usuario_activo()))
  with check (id = (select auth.uid()) and (select public.usuario_activo()));

create policy propiedades_leer_propias_o_admin on public.propiedades
  for select to authenticated
  using (arrendador_id = (select auth.uid()) or (select public.es_admin()));
create policy propiedades_crear_propias on public.propiedades
  for insert to authenticated
  with check (
    arrendador_id = (select auth.uid())
    and (select public.usuario_activo())
    and exists (
      select 1 from public.perfiles p
      where p.id = (select auth.uid()) and p.rol = 'arrendador'
    )
    and estado = 'disponible'
    and verificacion = 'pendiente'
    and publicacion_activa
  );
create policy propiedades_editar_propias_o_admin on public.propiedades
  for update to authenticated
  using (arrendador_id = (select auth.uid()) or (select public.es_admin()))
  with check (
    (arrendador_id = (select auth.uid()) and (select public.usuario_activo()))
    or (select public.es_admin())
  );
create policy propiedades_eliminar_propias_o_admin on public.propiedades
  for delete to authenticated
  using (arrendador_id = (select auth.uid()) or (select public.es_admin()));

create policy solicitudes_leer_participantes on public.solicitudes
  for select to authenticated
  using (
    arrendador_id = (select auth.uid())
    or arrendatario_id = (select auth.uid())
    or (select public.es_admin())
  );

create policy contratos_leer_participantes on public.contratos
  for select to authenticated
  using (
    arrendador_id = (select auth.uid())
    or arrendatario_id = (select auth.uid())
    or (select public.es_admin())
  );

create policy incidencias_leer_participantes on public.incidencias
  for select to authenticated
  using (
    arrendador_id = (select auth.uid())
    or arrendatario_id = (select auth.uid())
    or (select public.es_admin())
  );
create policy incidencias_crear_arrendatario on public.incidencias
  for insert to authenticated
  with check (
    arrendatario_id = (select auth.uid())
    and (select public.usuario_activo())
    and exists (
      select 1 from public.contratos c
      where c.id = contrato_id
        and c.propiedad_id = propiedad_id
        and c.arrendador_id = arrendador_id
        and c.arrendatario_id = (select auth.uid())
    )
  );
create policy incidencias_responder_arrendador_o_admin on public.incidencias
  for update to authenticated
  using (arrendador_id = (select auth.uid()) or (select public.es_admin()))
  with check (arrendador_id = (select auth.uid()) or (select public.es_admin()));

revoke all on table public.perfiles, public.propiedades, public.solicitudes,
  public.contratos, public.incidencias from anon, authenticated;
grant select on public.perfiles to authenticated;
grant update (nombre, cedula) on public.perfiles to authenticated;
grant select, delete on public.propiedades to authenticated;
grant insert (
  titulo, tipo, ciudad, sector, precio, descripcion, servicios, reglas,
  min_meses, lat, lng, fotos, estado, verificacion, arrendador_id,
  arrendador_nombre, arrendador_telefono, arrendador_email
) on public.propiedades to authenticated;
grant update (
  titulo, tipo, ciudad, sector, precio, descripcion, servicios, reglas,
  min_meses, lat, lng, fotos, estado
) on public.propiedades to authenticated;
grant select on public.solicitudes, public.contratos to authenticated;
grant select, insert on public.incidencias to authenticated;
grant update (estado, respuesta, updated_at) on public.incidencias to authenticated;
revoke all on table public.propiedades_publicas from public, anon, authenticated;
grant select on table public.propiedades_publicas to anon, authenticated;

-- Solicitud creada con identidad y datos obtenidos en servidor.
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

  select * into v_propiedad from public.propiedades
  where id = p_propiedad_id for update;
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
    where propiedad_id = p_propiedad_id and arrendatario_id = v_uid
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

create or replace function public.aprobar_solicitud(p_solicitud_id uuid)
returns public.contratos
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_s public.solicitudes%rowtype;
  v_c public.contratos%rowtype;
begin
  select * into v_s from public.solicitudes where id = p_solicitud_id for update;
  if not found or (v_s.arrendador_id <> v_uid and not public.es_admin()) then
    raise exception 'Solicitud no autorizada';
  end if;
  if v_s.estado <> 'pendiente' then raise exception 'La solicitud ya fue procesada'; end if;
  perform 1 from public.propiedades where id = v_s.propiedad_id and estado = 'disponible' for update;
  if not found then raise exception 'El inmueble ya no esta disponible'; end if;

  insert into public.contratos (
    solicitud_id, propiedad_id, arrendador_id, arrendatario_id,
    propiedad_titulo, propiedad_ciudad, propiedad_sector, arrendador_nombre,
    arrendatario_nombre, arrendatario_email, precio_mensual,
    fecha_inicio, fecha_fin, meses, estado
  ) values (
    v_s.id, v_s.propiedad_id, v_s.arrendador_id, v_s.arrendatario_id,
    v_s.propiedad_titulo, v_s.propiedad_ciudad, v_s.propiedad_sector,
    v_s.arrendador_nombre, v_s.arrendatario_nombre, v_s.arrendatario_email,
    v_s.precio, v_s.fecha_inicio,
    (v_s.fecha_inicio + make_interval(months => v_s.meses))::date,
    v_s.meses, 'vigente'
  ) returning * into v_c;
  update public.solicitudes set estado = 'aprobada' where id = v_s.id;
  update public.propiedades set estado = 'arrendada' where id = v_s.propiedad_id;
  return v_c;
end;
$$;

create or replace function public.rechazar_solicitud(
  p_solicitud_id uuid,
  p_respuesta text default null
)
returns public.solicitudes
language plpgsql
security definer
set search_path = ''
as $$
declare v_s public.solicitudes%rowtype;
begin
  select * into v_s from public.solicitudes where id = p_solicitud_id for update;
  if not found or (v_s.arrendador_id <> auth.uid() and not public.es_admin()) then
    raise exception 'Solicitud no autorizada';
  end if;
  if v_s.estado <> 'pendiente' then raise exception 'La solicitud ya fue procesada'; end if;
  update public.solicitudes
    set estado = 'rechazada', respuesta = nullif(trim(p_respuesta), '')
    where id = v_s.id returning * into v_s;
  return v_s;
end;
$$;

create or replace function public.finalizar_contrato(p_contrato_id uuid)
returns public.contratos
language plpgsql
security definer
set search_path = ''
as $$
declare v_c public.contratos%rowtype;
begin
  select * into v_c from public.contratos where id = p_contrato_id for update;
  if not found or (v_c.arrendador_id <> auth.uid() and not public.es_admin()) then
    raise exception 'Contrato no autorizado';
  end if;
  if v_c.estado <> 'vigente' then raise exception 'El contrato ya fue finalizado'; end if;
  perform 1 from public.propiedades where id = v_c.propiedad_id for update;
  update public.contratos set estado = 'finalizado'
    where id = v_c.id returning * into v_c;
  update public.propiedades set estado = 'disponible' where id = v_c.propiedad_id;
  return v_c;
end;
$$;

create or replace function public.admin_moderar_usuario(
  p_user_id uuid, p_activa boolean, p_motivo text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.es_admin() then raise exception 'Solo administradores'; end if;
  if p_user_id = auth.uid() and not p_activa then
    raise exception 'Un administrador no puede inhabilitarse a si mismo';
  end if;
  update public.perfiles set
    cuenta_activa = p_activa,
    motivo_inhabilitacion = case when p_activa then null else nullif(trim(p_motivo), '') end,
    moderada_at = now(), moderada_por = auth.uid()
  where id = p_user_id;
  if not found then raise exception 'Usuario no encontrado'; end if;
end;
$$;

create or replace function public.admin_moderar_propiedad(
  p_propiedad_id uuid, p_activa boolean, p_motivo text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.es_admin() then raise exception 'Solo administradores'; end if;
  update public.propiedades set
    publicacion_activa = p_activa,
    motivo_moderacion = case when p_activa then null else nullif(trim(p_motivo), '') end,
    moderada_at = now(), moderada_por = auth.uid()
  where id = p_propiedad_id;
  if not found then raise exception 'Inmueble no encontrado'; end if;
end;
$$;

create or replace function public.admin_verificar_propiedad(
  p_propiedad_id uuid, p_verificacion text, p_motivo text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.es_admin() then raise exception 'Solo administradores'; end if;
  if p_verificacion not in ('pendiente', 'aprobada', 'rechazada') then
    raise exception 'Estado de verificacion invalido';
  end if;
  update public.propiedades set
    verificacion = p_verificacion,
    motivo_moderacion = case when p_verificacion = 'rechazada'
      then nullif(trim(p_motivo), '') else null end,
    moderada_at = now(), moderada_por = auth.uid()
  where id = p_propiedad_id;
  if not found then raise exception 'Inmueble no encontrado'; end if;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.es_admin() from public, anon;
revoke all on function public.usuario_activo() from public, anon;
revoke all on function public.crear_solicitud(uuid, date, integer, text) from public, anon;
revoke all on function public.aprobar_solicitud(uuid) from public, anon;
revoke all on function public.rechazar_solicitud(uuid, text) from public, anon;
revoke all on function public.finalizar_contrato(uuid) from public, anon;
revoke all on function public.admin_moderar_usuario(uuid, boolean, text) from public, anon;
revoke all on function public.admin_moderar_propiedad(uuid, boolean, text) from public, anon;
revoke all on function public.admin_verificar_propiedad(uuid, text, text) from public, anon;
grant execute on function public.es_admin(), public.usuario_activo() to authenticated;
grant execute on function public.crear_solicitud(uuid, date, integer, text),
  public.aprobar_solicitud(uuid), public.rechazar_solicitud(uuid, text),
  public.finalizar_contrato(uuid),
  public.admin_moderar_usuario(uuid, boolean, text),
  public.admin_moderar_propiedad(uuid, boolean, text),
  public.admin_verificar_propiedad(uuid, text, text) to authenticated;

-- Storage: escritura solo dentro de la carpeta auth.uid()/.
drop policy if exists "fotos lectura publica" on storage.objects;
drop policy if exists "fotos subida prototipo" on storage.objects;
drop policy if exists "fotos borrado prototipo" on storage.objects;
drop policy if exists "fotos subida propia" on storage.objects;
drop policy if exists "fotos actualizacion propia" on storage.objects;
drop policy if exists "fotos borrado propio" on storage.objects;
create policy "fotos subida propia" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'propiedades'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.usuario_activo())
  );
create policy "fotos actualizacion propia" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'propiedades'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.es_admin()))
  )
  with check (
    bucket_id = 'propiedades'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.es_admin()))
  );
create policy "fotos borrado propio" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'propiedades'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.es_admin()))
  );

commit;
