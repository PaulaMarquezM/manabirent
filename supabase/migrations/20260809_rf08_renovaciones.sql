-- RF-08: solicitudes de renovación y extensión del contrato vigente.
-- Ejecutar después de las migraciones existentes.

create table if not exists public.renovaciones (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  contrato_id uuid not null references public.contratos(id) on delete cascade,
  arrendador_id uuid not null,
  arrendatario_id uuid not null,
  meses integer not null check (meses between 1 and 24),
  mensaje text,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'aprobada', 'rechazada')),
  respuesta text
);

create index if not exists renovaciones_contrato_idx on public.renovaciones (contrato_id);
create index if not exists renovaciones_arrendador_idx on public.renovaciones (arrendador_id);
create index if not exists renovaciones_arrendatario_idx on public.renovaciones (arrendatario_id);
create unique index if not exists renovaciones_pendiente_por_contrato_idx
  on public.renovaciones (contrato_id)
  where estado = 'pendiente';

alter table public.renovaciones enable row level security;

drop policy if exists renovaciones_leer_participantes on public.renovaciones;
create policy renovaciones_leer_participantes on public.renovaciones
  for select to authenticated
  using (auth.uid() = arrendador_id or auth.uid() = arrendatario_id or public.es_admin());

revoke all on table public.renovaciones from public, anon, authenticated;
grant select on table public.renovaciones to authenticated;

create or replace function public.crear_renovacion(
  p_contrato_id uuid,
  p_meses integer,
  p_mensaje text default null
)
returns public.renovaciones
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contrato public.contratos;
  v_renovacion public.renovaciones;
begin
  select * into v_contrato
  from public.contratos
  where id = p_contrato_id;

  if not found then
    raise exception 'Contrato no encontrado.';
  end if;
  if v_contrato.estado <> 'vigente' then
    raise exception 'Solo se puede renovar un contrato vigente.';
  end if;
  if v_contrato.arrendatario_id <> auth.uid() then
    raise exception 'Solo el arrendatario del contrato puede solicitar una renovación.';
  end if;
  if p_meses not between 1 and 24 then
    raise exception 'La renovación debe ser de 1 a 24 meses.';
  end if;

  insert into public.renovaciones (
    contrato_id, arrendador_id, arrendatario_id, meses, mensaje
  ) values (
    v_contrato.id, v_contrato.arrendador_id, v_contrato.arrendatario_id,
    p_meses, nullif(trim(p_mensaje), '')
  )
  returning * into v_renovacion;

  return v_renovacion;
end;
$$;

create or replace function public.resolver_renovacion(
  p_renovacion_id uuid,
  p_aprobar boolean,
  p_respuesta text default null
)
returns public.renovaciones
language plpgsql
security definer
set search_path = public
as $$
declare
  v_renovacion public.renovaciones;
  v_contrato public.contratos;
begin
  select * into v_renovacion
  from public.renovaciones
  where id = p_renovacion_id
  for update;

  if not found then
    raise exception 'Solicitud de renovación no encontrada.';
  end if;
  if v_renovacion.estado <> 'pendiente' then
    raise exception 'Esta solicitud ya fue respondida.';
  end if;
  if v_renovacion.arrendador_id <> auth.uid() then
    raise exception 'Solo el arrendador puede responder esta renovación.';
  end if;

  if p_aprobar then
    update public.contratos
    set fecha_fin = (fecha_fin + make_interval(months => v_renovacion.meses))::date,
        meses = coalesce(meses, 0) + v_renovacion.meses
    where id = v_renovacion.contrato_id
      and estado = 'vigente'
    returning * into v_contrato;

    if not found then
      raise exception 'El contrato ya no está vigente.';
    end if;
  end if;

  update public.renovaciones
  set estado = case when p_aprobar then 'aprobada' else 'rechazada' end,
      respuesta = nullif(trim(p_respuesta), ''),
      resolved_at = now()
  where id = v_renovacion.id
  returning * into v_renovacion;

  return v_renovacion;
end;
$$;

revoke all on function public.crear_renovacion(uuid, integer, text) from public, anon;
revoke all on function public.resolver_renovacion(uuid, boolean, text) from public, anon;
grant execute on function public.crear_renovacion(uuid, integer, text) to authenticated;
grant execute on function public.resolver_renovacion(uuid, boolean, text) to authenticated;

notify pgrst, 'reload schema';
