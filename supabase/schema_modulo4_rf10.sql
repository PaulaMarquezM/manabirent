-- ============================================================================
-- ManabíRent — RF-10: Actualización de incidencias con trazabilidad
-- Ejecutar en el SQL Editor de Supabase después de schema_modulo3.sql.
--
-- Crea el historial que consume la pantalla de incidencias y registra de forma
-- automática cada cambio de estado. El script es idempotente: se puede ejecutar
-- más de una vez sin eliminar información existente.
-- ============================================================================

-- Historial inmutable de los cambios de estado de una incidencia.
create table if not exists public.incidencias_historial (
  id              uuid primary key default gen_random_uuid(),
  incidencia_id   uuid not null references public.incidencias(id) on delete cascade,
  estado_anterior text,
  estado_nuevo    text not null,
  comentario      text,
  actualizado_por uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),

  constraint incidencias_historial_estado_anterior_check
    check (estado_anterior is null or estado_anterior in (
      'reportada', 'en_revision', 'en_proceso', 'resuelta', 'cerrada'
    )),
  constraint incidencias_historial_estado_nuevo_check
    check (estado_nuevo in (
      'reportada', 'en_revision', 'en_proceso', 'resuelta', 'cerrada'
    ))
);

create index if not exists incidencias_historial_incidencia_fecha_idx
  on public.incidencias_historial (incidencia_id, created_at desc);

-- Permite consultar el historial solo a las dos partes del contrato.
alter table public.incidencias_historial enable row level security;

drop policy if exists "historial lectura participantes" on public.incidencias_historial;
create policy "historial lectura participantes"
  on public.incidencias_historial
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.incidencias as incidencia
      where incidencia.id = incidencias_historial.incidencia_id
        and (select auth.uid()) in (incidencia.arrendador_id, incidencia.arrendatario_id)
    )
  );

-- El frontend no debe editar ni eliminar eventos. Esta política permite que el
-- trigger inserte el evento con la identidad de la sesión autenticada.
drop policy if exists "historial insertar desde trigger" on public.incidencias_historial;
create policy "historial insertar desde trigger"
  on public.incidencias_historial
  for insert
  to authenticated
  with check (actualizado_por = (select auth.uid()));

-- Registra la creación inicial y los cambios posteriores de estado. El campo
-- respuesta de la incidencia se conserva como comentario del evento.
create or replace function public.registrar_historial_incidencia()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.incidencias_historial (
      incidencia_id,
      estado_anterior,
      estado_nuevo,
      comentario,
      actualizado_por
    ) values (
      new.id,
      null,
      new.estado,
      new.respuesta,
      (select auth.uid())
    );
  elsif new.estado is distinct from old.estado then
    insert into public.incidencias_historial (
      incidencia_id,
      estado_anterior,
      estado_nuevo,
      comentario,
      actualizado_por
    ) values (
      new.id,
      old.estado,
      new.estado,
      new.respuesta,
      (select auth.uid())
    );
  end if;

  return new;
end;
$$;

drop trigger if exists incidencias_registrar_historial on public.incidencias;
create trigger incidencias_registrar_historial
  after insert or update of estado on public.incidencias
  for each row
  execute function public.registrar_historial_incidencia();

-- RPC consumido por el formulario del arrendador. La validación se realiza en
-- la base de datos para impedir que otro usuario actualice una incidencia ajena.
create or replace function public.actualizar_estado_incidencia(
  p_comentario text,
  p_estado text,
  p_incidencia_id uuid
)
returns public.incidencias
language plpgsql
security invoker
set search_path = public
as $$
declare
  incidencia_actualizada public.incidencias;
begin
  if (select auth.uid()) is null then
    raise exception 'Debes iniciar sesión para actualizar una incidencia.';
  end if;

  if p_estado not in ('reportada', 'en_revision', 'en_proceso', 'resuelta', 'cerrada') then
    raise exception 'El estado de incidencia no es válido.';
  end if;

  update public.incidencias
  set
    estado = p_estado,
    respuesta = nullif(btrim(coalesce(p_comentario, '')), '')
  where id = p_incidencia_id
    and arrendador_id = (select auth.uid())
  returning * into incidencia_actualizada;

  if not found then
    raise exception 'No se encontró la incidencia o no tienes permiso para actualizarla.';
  end if;

  return incidencia_actualizada;
end;
$$;

revoke execute on function public.actualizar_estado_incidencia(text, text, uuid)
  from public, anon;
grant execute on function public.actualizar_estado_incidencia(text, text, uuid)
  to authenticated;

-- Crea el primer evento para incidencias registradas antes de instalar RF-10.
insert into public.incidencias_historial (
  incidencia_id,
  estado_anterior,
  estado_nuevo,
  comentario,
  actualizado_por,
  created_at
)
select
  incidencia.id,
  null,
  incidencia.estado,
  'Registro inicial anterior a la trazabilidad de RF-10.',
  incidencia.arrendatario_id,
  incidencia.created_at
from public.incidencias as incidencia
where not exists (
  select 1
  from public.incidencias_historial as historial
  where historial.incidencia_id = incidencia.id
);

-- Solicita a PostgREST que actualice su caché de esquema inmediatamente.
notify pgrst, 'reload schema';

-- Verificación opcional después de ejecutar el script:
-- select * from public.incidencias_historial order by created_at desc;
-- select public.actualizar_estado_incidencia(
--   'El técnico visitará el inmueble mañana a las 10:00.',
--   'en_proceso',
--   '<uuid de incidencia>'::uuid
-- );
