import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Ayuda para depurar en desarrollo si faltan las variables de entorno.
  console.warn(
    'Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local. ' +
      'La conexión con Supabase no funcionará.'
  )
}

function crearClienteSupabaseFaltante() {
  const error = new Error(
    'Faltan variables de Supabase en .env.local. Revisa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.'
  )
  const respuestaError = async () => ({ data: null, error })

  const query = {
    select: () => query,
    order: () => query,
    eq: () => query,
    in: () => query,
    limit: () => query,
    insert: () => query,
    update: () => query,
    delete: () => query,
    single: respuestaError,
    maybeSingle: respuestaError,
    then: (resolve) => resolve({ data: null, error }),
  }

  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: respuestaError,
      signUp: respuestaError,
      signOut: async () => ({ error: null }),
    },
    from: () => query,
    storage: {
      from: () => ({
        upload: respuestaError,
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
  }
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : crearClienteSupabaseFaltante()

// Nombre del bucket de Storage donde se guardan las fotos de los inmuebles.
export const FOTOS_BUCKET = 'propiedades'
