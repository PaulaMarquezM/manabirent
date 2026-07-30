-- Supabase puede conservar grants explicitos para anon aunque PUBLIC se revoque.
-- Esta migracion complementaria bloquea las RPC antes de ejecutar su logica.
begin;

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

commit;
