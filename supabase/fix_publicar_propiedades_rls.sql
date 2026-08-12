-- ManabíRent — corrección de permisos para publicar inmuebles y subir fotos.
-- Ejecutar una vez en Supabase SQL Editor.
-- Mantiene RLS: cada arrendador solo puede modificar sus propios inmuebles
-- y archivos dentro de la carpeta cuyo nombre es su auth.uid().

alter table public.propiedades
  add column if not exists publicacion_activa boolean not null default true;

alter table public.propiedades enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.propiedades to authenticated;

-- Se reemplazan las políticas de prototipo por políticas ligadas al usuario.
drop policy if exists "lectura publica" on public.propiedades;
drop policy if exists "insertar prototipo" on public.propiedades;
drop policy if exists "actualizar prototipo" on public.propiedades;
drop policy if exists "eliminar prototipo" on public.propiedades;
drop policy if exists "propiedades lectura autenticada" on public.propiedades;
drop policy if exists "propiedades publicar propias" on public.propiedades;
drop policy if exists "propiedades editar propias" on public.propiedades;
drop policy if exists "propiedades eliminar propias" on public.propiedades;

create policy "propiedades lectura autenticada"
  on public.propiedades for select to authenticated
  using (publicacion_activa or arrendador_id = auth.uid());

create policy "propiedades publicar propias"
  on public.propiedades for insert to authenticated
  with check (arrendador_id = auth.uid());

create policy "propiedades editar propias"
  on public.propiedades for update to authenticated
  using (arrendador_id = auth.uid())
  with check (arrendador_id = auth.uid());

create policy "propiedades eliminar propias"
  on public.propiedades for delete to authenticated
  using (arrendador_id = auth.uid());

-- Bucket público para las imágenes mostradas en el catálogo.
insert into storage.buckets (id, name, public)
values ('propiedades', 'propiedades', true)
on conflict (id) do update set public = true;

grant select, insert, update, delete on storage.objects to authenticated;

drop policy if exists "fotos lectura publica" on storage.objects;
drop policy if exists "fotos subida prototipo" on storage.objects;
drop policy if exists "fotos borrado prototipo" on storage.objects;
drop policy if exists "fotos propietario administra las suyas" on storage.objects;

create policy "fotos lectura publica"
  on storage.objects for select to public
  using (bucket_id = 'propiedades');

create policy "fotos propietario administra las suyas"
  on storage.objects for all to authenticated
  using (
    bucket_id = 'propiedades'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'propiedades'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
