-- ManabíRent — reparación del trigger de perfiles de Supabase Auth.
-- No elimina usuarios ni perfiles existentes.

alter table public.perfiles
  add column if not exists cedula text;

create or replace function public.crear_perfil_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre, email, rol, cuenta_activa)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'nombre', ''), split_part(new.email, '@', 1)),
    new.email,
    case
      when new.raw_user_meta_data ->> 'rol' in ('arrendador', 'arrendatario', 'admin')
        then new.raw_user_meta_data ->> 'rol'
      else 'arrendatario'
    end,
    true
  )
  on conflict (id) do update set
    nombre = excluded.nombre,
    email = excluded.email,
    rol = excluded.rol,
    cuenta_activa = true;

  return new;
end;
$$;

drop trigger if exists auth_usuario_crear_perfil on auth.users;
drop trigger if exists on_auth_user_created on auth.users;

create trigger auth_usuario_crear_perfil
  after insert on auth.users
  for each row
  execute function public.crear_perfil_usuario();
