import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Ayuda para depurar en desarrollo si faltan las variables de entorno.
  console.warn(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env.local. ' +
      'La conexión con Supabase no funcionará.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Nombre del bucket de Storage donde se guardan las fotos de los inmuebles.
export const FOTOS_BUCKET = 'propiedades'
