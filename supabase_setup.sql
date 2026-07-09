-- ==========================================
-- SCRIPT DE CONFIGURACIÓN DE BASE DE DATOS
-- PROYECTO: Portoviejo 360 (ManabíRent)
-- ==========================================
-- Instrucciones: Ejecuta todo este script en el "SQL Editor" de tu panel de Supabase.

-- 1. Crear tabla de perfiles (extendiendo auth.users)
CREATE TABLE public.perfiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nombre TEXT NOT NULL,
  cedula VARCHAR(20) NOT NULL,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('arrendador', 'arrendatario', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar Seguridad a Nivel de Fila (RLS)
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Seguridad (RLS) para perfiles
-- Cualquier usuario puede ver los perfiles (necesario para ver nombres de arrendadores)
CREATE POLICY "Los perfiles son visibles por todos" ON public.perfiles
  FOR SELECT USING (true);

-- Los usuarios solo pueden actualizar su propio perfil
CREATE POLICY "Los usuarios pueden actualizar su propio perfil" ON public.perfiles
  FOR UPDATE USING (auth.uid() = id);

-- 4. Función para crear el perfil automáticamente tras el registro en Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre, cedula, rol)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'nombre',
    new.raw_user_meta_data->>'cedula',
    new.raw_user_meta_data->>'rol'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger que se dispara después de que un usuario se registra en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Nota: Por defecto, el insert en public.perfiles lo hace el Trigger con privilegios elevados (SECURITY DEFINER).
