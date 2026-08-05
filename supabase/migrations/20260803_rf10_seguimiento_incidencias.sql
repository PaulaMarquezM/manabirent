-- ManabiRent RF-10: seguimiento y trazabilidad de quejas/incidencias.
-- Revisar y aplicar despues de 20260729_harden_security.up.sql y
-- 20260730_revoke_anon_rpc.sql. Este archivo no se ejecuta automaticamente.

begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

-- RF-10 define exactamente tres estados. Se normalizan los valores historicos
-- del prototipo antes de agregar la restriccion mas estricta.
update public.incidencias
set estado = case
  when estado in ('reportada', 'en_revision') then 'reportada'
  when estado = 'en_proceso' then 'en_proceso'
  when estado in ('resuelta', 'cerrada') then 'resuelta'
  else estado
end
where estado in ('en_revision', 'cerrada');

alter table public.incidencias
  drop constraint if exists incidencias_estado_rf10_check;
alter table public.incidencias
  add constraint incidencias_estado_rf10_check
  check (estado in ('reportada', 'en_proceso', 'resuelta')) not valid;
alter table public.incidencias
  validate constraint incidencias_estado_rf10_check;

create table if not exists public.incidencias_historial (
  id                    uuid primary key default gen_random_uuid(),
  incidencia_id         uuid not null references public.incidencias(id) on delete cascade,
  created_at            timestamptz not null default now(),
  estado_anterior       text,
  estado_nuevo          text not null,
  cambiado_por          uuid,
  cambiado_por_nombre   text,
  comentario            text,

  constraint incidencias_historial_estado_anterior_check
    check (estado_anterior is null or estado_anterior in ('reportada', 'en_proceso', 'resuelta')),
  constraint incidencias_historial_estado_nuevo_check
    check (estado_nuevo in ('reportada', 'en_proceso', 'resuelta')),
  constraint incidencias_historial_comentario_check
    check (comentario is null or char_length(comentario) <= 300)
);

create index if not exists incidencias_historial_incidencia_fecha_idx
  on public.incidencias_historial (incidencia_id, created_at);

-- Los reportes existentes reciben un evento inicial para que ninguna
-- incidencia quede sin un punto de partida en su trazabilidad.
insert into public.incidencias_historial (
  incidencia_id,
  created_at,
  estado_anterior,
  estado_nuevo,
  cambiado_por,
  cambiado_por_nombre,
  comentario
)
select
  i.id,
  i.created_at,
  null,
  i.estado,
  i.arrendatario_id,
  coalesce(i.arrendatario_nombre, 'Arrendatario'),
  'Incidencia registrada'
from public.incidencias i
where not exists (
  select 1
  from public.incidencias_historial h
  where h.incidencia_id = i.id
);

-- Todo reporte nuevo registra automaticamente su estado inicial, incluso si
-- se crea desde otro cliente autorizado en el futuro.
create or replace function public.registrar_estado_inicial_incidencia()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nombre text;
begin
  select p.nombre into v_nombre
  from public.perfiles p
  where p.id = auth.uid();

  insert into public.incidencias_historial (
    incidencia_id,
    estado_anterior,
    estado_nuevo,
    cambiado_por,
    cambiado_por_nombre,
    comentario
  ) values (
    new.id,
    null,
    new.estado,
    auth.uid(),
    coalesce(v_nombre, new.arrendatario_nombre, 'Arrendatario'),
    'Incidencia registrada'
  );
  return new;
end;
$$;

drop trigger if exists incidencias_registrar_estado_inicial on public.incidencias;
create trigger incidencias_registrar_estado_inicial
  after insert on public.incidencias
  for each row execute function public.registrar_estado_inicial_incidencia();

-- La funcion valida el rol y la pertenencia, actualiza la incidencia y agrega
-- el evento de historial dentro de la misma transaccion.
create or replace function public.actualizar_estado_incidencia(
  p_incidencia_id uuid,
  p_estado text,
  p_comentario text default null
)
returns public.incidencias
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_perfil public.perfiles%rowtype;
  v_incidencia public.incidencias%rowtype;
  v_estado_anterior text;
  v_comentario text := nullif(trim(p_comentario), '');
begin
  select * into v_perfil
  from public.perfiles
  where id = v_uid;

  if v_uid is null or not found or not v_perfil.cuenta_activa
     or v_perfil.rol <> 'arrendador' then
    raise exception 'Solo un arrendador activo puede actualizar el seguimiento';
  end if;

  if p_estado not in ('reportada', 'en_proceso', 'resuelta') then
    raise exception 'Estado de incidencia invalido';
  end if;

  if v_comentario is not null and char_length(v_comentario) > 300 then
    raise exception 'El comentario no puede superar 300 caracteres';
  end if;

  select * into v_incidencia
  from public.incidencias
  where id = p_incidencia_id
  for update;

  if not found or v_incidencia.arrendador_id <> v_uid then
    raise exception 'Incidencia no encontrada o no autorizada';
  end if;

  if v_incidencia.estado = p_estado then
    raise exception 'La incidencia ya tiene el estado seleccionado';
  end if;

  v_estado_anterior := v_incidencia.estado;

  update public.incidencias
  set
    estado = p_estado,
    respuesta = coalesce(v_comentario, respuesta)
  where id = p_incidencia_id
  returning * into v_incidencia;

  insert into public.incidencias_historial (
    incidencia_id,
    estado_anterior,
    estado_nuevo,
    cambiado_por,
    cambiado_por_nombre,
    comentario
  ) values (
    v_incidencia.id,
    v_estado_anterior,
    p_estado,
    v_uid,
    coalesce(v_perfil.nombre, 'Arrendador'),
    v_comentario
  );

  return v_incidencia;
end;
$$;

-- El historial solo es visible para las dos partes del contrato y para el
-- administrador. No se permite insertar o modificar eventos desde el cliente.
alter table public.incidencias_historial enable row level security;

drop policy if exists incidencias_historial_leer_participantes
  on public.incidencias_historial;
create policy incidencias_historial_leer_participantes
  on public.incidencias_historial
  for select to authenticated
  using (
    exists (
      select 1
      from public.incidencias i
      where i.id = incidencia_id
        and (
          i.arrendador_id = (select auth.uid())
          or i.arrendatario_id = (select auth.uid())
          or (select public.es_admin())
        )
    )
  );

-- Se elimina la ruta de UPDATE directo para asegurar que todo cambio pase por
-- la RPC y produzca un evento de trazabilidad.
drop policy if exists incidencias_responder_arrendador_o_admin
  on public.incidencias;
revoke update on table public.incidencias from authenticated;

revoke all on table public.incidencias_historial from public, anon, authenticated;
grant select on table public.incidencias_historial to authenticated;

revoke all on function public.registrar_estado_inicial_incidencia()
  from public, anon, authenticated;
revoke all on function public.actualizar_estado_incidencia(uuid, text, text)
  from public, anon;
grant execute on function public.actualizar_estado_incidencia(uuid, text, text)
  to authenticated;

commit;
