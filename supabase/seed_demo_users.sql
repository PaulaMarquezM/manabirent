-- ManabíRent — usuarios demo para pruebas
-- Ejecutar en Supabase SQL Editor con permisos de administrador.
-- Contraseña de los seis usuarios: ManabiRent2026*
-- Cambiar estas credenciales antes de una demostración pública.

create extension if not exists pgcrypto with schema extensions;

-- El trigger de seguridad del proyecto utiliza este campo.
alter table if exists public.perfiles
  add column if not exists cedula text;

do $$
declare
  usuario record;
  usuario_id uuid;
  clave_demo constant text := 'ManabiRent2026*';
begin
  for usuario in
    select * from (values
      ('arrendador1@manabirent.demo', 'Ana García',    '1300000001', 'arrendador'),
      ('arrendador2@manabirent.demo', 'Carlos López',  '1300000002', 'arrendador'),
      ('arrendador3@manabirent.demo', 'María Zambrano','1300000003', 'arrendador'),
      ('inquilino1@manabirent.demo',  'Luis Mendoza',  '1300000004', 'arrendatario'),
      ('inquilino2@manabirent.demo',  'Sofía Vélez',   '1300000005', 'arrendatario'),
      ('inquilino3@manabirent.demo',  'Diego Cedeño',  '1300000006', 'arrendatario')
    ) as datos(email, nombre, cedula, rol)
  loop
    select id into usuario_id
    from auth.users
    where email = usuario.email;

    if usuario_id is null then
      usuario_id := gen_random_uuid();

      insert into auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
      ) values (
        '00000000-0000-0000-0000-000000000000',
        usuario_id,
        'authenticated',
        'authenticated',
        usuario.email,
        extensions.crypt(clave_demo, extensions.gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object(
          'nombre', usuario.nombre,
          'cedula', usuario.cedula,
          'rol', usuario.rol
        ),
        now(),
        now()
      );
    else
      update auth.users
      set encrypted_password = extensions.crypt(clave_demo, extensions.gen_salt('bf')),
          email_confirmed_at = coalesce(email_confirmed_at, now()),
          raw_user_meta_data = jsonb_build_object(
            'nombre', usuario.nombre,
            'cedula', usuario.cedula,
            'rol', usuario.rol
          ),
          updated_at = now()
      where id = usuario_id;
    end if;

    insert into public.perfiles (id, nombre, cedula, email, rol, cuenta_activa)
    values (usuario_id, usuario.nombre, usuario.cedula, usuario.email, usuario.rol, true)
    on conflict (id) do update set
      nombre = excluded.nombre,
      cedula = excluded.cedula,
      email = excluded.email,
      rol = excluded.rol,
      cuenta_activa = true;
  end loop;
end;
$$;

-- Completa valores que Supabase Auth espera como cadena vacía cuando no
-- aplican. Esto evita el error "Database error querying schema" causado por
-- usuarios creados manualmente con columnas de Auth en NULL.
update auth.users
set email = coalesce(email, ''),
    confirmation_token = coalesce(confirmation_token, ''),
    recovery_token = coalesce(recovery_token, ''),
    email_change_token_new = coalesce(email_change_token_new, ''),
    email_change = coalesce(email_change, ''),
    phone_change = coalesce(phone_change, ''),
    phone_change_token = coalesce(phone_change_token, ''),
    reauthentication_token = coalesce(reauthentication_token, ''),
    raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb),
    raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb),
    updated_at = now()
where email in (
  'arrendador1@manabirent.demo',
  'arrendador2@manabirent.demo',
  'arrendador3@manabirent.demo',
  'inquilino1@manabirent.demo',
  'inquilino2@manabirent.demo',
  'inquilino3@manabirent.demo'
);

-- Las cuentas de correo necesitan una identidad email asociada para que
-- signInWithPassword pueda encontrarlas correctamente.
insert into auth.identities (user_id, identity_data, provider, created_at, updated_at)
select
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  now(),
  now()
from auth.users u
where u.email in (
  'arrendador1@manabirent.demo',
  'arrendador2@manabirent.demo',
  'arrendador3@manabirent.demo',
  'inquilino1@manabirent.demo',
  'inquilino2@manabirent.demo',
  'inquilino3@manabirent.demo'
)
and not exists (
  select 1 from auth.identities i
  where i.user_id = u.id and i.provider = 'email'
);

-- Verificación final: muestra los usuarios creados sin mostrar contraseñas.
select email, nombre, rol, cuenta_activa
from public.perfiles
where email in (
  'arrendador1@manabirent.demo',
  'arrendador2@manabirent.demo',
  'arrendador3@manabirent.demo',
  'inquilino1@manabirent.demo',
  'inquilino2@manabirent.demo',
  'inquilino3@manabirent.demo'
)
order by rol, email;
