-- ManabíRent — inmuebles de demostración
-- Ejecutar en Supabase SQL Editor. No elimina inmuebles existentes.

alter table public.propiedades
  add column if not exists publicacion_activa boolean not null default true;

create or replace view public.propiedades_publicas
with (security_barrier = true)
as
select
  id, titulo, tipo, ciudad, sector, precio, descripcion, servicios, reglas,
  min_meses, lat, lng, fotos, estado, verificacion, arrendador_nombre, created_at
from public.propiedades
where publicacion_activa
  and estado = 'disponible'
  and verificacion <> 'rechazada';

grant select on public.propiedades_publicas to anon, authenticated;

insert into public.propiedades (
  titulo, tipo, ciudad, sector, precio, descripcion, servicios, reglas,
  min_meses, lat, lng, fotos, estado, verificacion, publicacion_activa,
  arrendador_nombre, arrendador_telefono, arrendador_email
)
select *
from (values
  (
    'Habitación amoblada cerca de ULEAM', 'habitacion', 'Manta', 'Tarqui', 220::numeric,
    'Habitación amplia con baño privado, agua caliente y WiFi. A cinco minutos de la ULEAM.',
    array['WiFi', 'Agua caliente', 'Lavandería', 'Cocina compartida'],
    'No mascotas. No fumar. Visitas hasta las 22:00.', 3,
    -0.9554::double precision, -80.7120::double precision,
    array['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80'],
    'disponible', 'aprobada', true,
    'Ana García', '0987654321', 'arrendador1@manabirent.demo'
  ),
  (
    'Departamento en zona universitaria', 'departamento', 'Manta', 'Los Esteros', 480::numeric,
    'Departamento completo de dos habitaciones, con parqueadero, seguridad y cocina equipada.',
    array['WiFi', 'Agua caliente', 'Parqueadero', 'Seguridad 24/7', 'Cocina equipada'],
    'No mascotas grandes. Pago puntual.', 6,
    -0.9432::double precision, -80.7210::double precision,
    array['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80'],
    'disponible', 'aprobada', true,
    'Carlos López', '0998765432', 'arrendador2@manabirent.demo'
  ),
  (
    'Suite ejecutiva en Portoviejo', 'suite', 'Portoviejo', 'Ciudadela Universitaria', 350::numeric,
    'Suite amoblada para estudiantes o profesionales, con aire acondicionado y espacio de trabajo.',
    array['WiFi', 'Aire acondicionado', 'Smart TV', 'Limpieza semanal'],
    'No fiestas. Mantener las áreas comunes limpias.', 3,
    -1.0635::double precision, -80.4645::double precision,
    array['https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80'],
    'disponible', 'aprobada', true,
    'María Zambrano', '0976543210', 'arrendador3@manabirent.demo'
  )
) as demo(
  titulo, tipo, ciudad, sector, precio, descripcion, servicios, reglas,
  min_meses, lat, lng, fotos, estado, verificacion, publicacion_activa,
  arrendador_nombre, arrendador_telefono, arrendador_email
)
where not exists (
  select 1 from public.propiedades p where p.titulo = demo.titulo
);

select titulo, ciudad, precio, estado, verificacion
from public.propiedades
order by created_at desc;
