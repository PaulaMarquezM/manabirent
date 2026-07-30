-- Rollback seguro: retira las interfaces nuevas sin restaurar politicas publicas.
-- Las tablas quedan con RLS habilitado y sin acceso de escritura accidental.
begin;

revoke all on function public.crear_solicitud(uuid, date, integer, text) from public, anon, authenticated;
revoke all on function public.aprobar_solicitud(uuid) from public, anon, authenticated;
revoke all on function public.rechazar_solicitud(uuid, text) from public, anon, authenticated;
revoke all on function public.finalizar_contrato(uuid) from public, anon, authenticated;
revoke all on function public.admin_moderar_usuario(uuid, boolean, text) from public, anon, authenticated;
revoke all on function public.admin_moderar_propiedad(uuid, boolean, text) from public, anon, authenticated;
revoke all on function public.admin_verificar_propiedad(uuid, text, text) from public, anon, authenticated;

drop function if exists public.crear_solicitud(uuid, date, integer, text);
drop function if exists public.aprobar_solicitud(uuid);
drop function if exists public.rechazar_solicitud(uuid, text);
drop function if exists public.finalizar_contrato(uuid);
drop function if exists public.admin_moderar_usuario(uuid, boolean, text);
drop function if exists public.admin_moderar_propiedad(uuid, boolean, text);
drop function if exists public.admin_verificar_propiedad(uuid, text, text);
drop view if exists public.propiedades_publicas;

do $$
declare p record;
begin
  for p in
    select schemaname, tablename, policyname from pg_policies
    where (schemaname = 'public' and tablename in
      ('perfiles', 'propiedades', 'solicitudes', 'contratos', 'incidencias'))
      or (schemaname = 'storage' and tablename = 'objects'
          and policyname in ('fotos subida propia', 'fotos actualizacion propia', 'fotos borrado propio'))
  loop
    execute format('drop policy if exists %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end;
$$;

revoke all on table public.perfiles, public.propiedades, public.solicitudes,
  public.contratos, public.incidencias from anon, authenticated;
alter table public.perfiles enable row level security;
alter table public.propiedades enable row level security;
alter table public.solicitudes enable row level security;
alter table public.contratos enable row level security;
alter table public.incidencias enable row level security;

commit;
