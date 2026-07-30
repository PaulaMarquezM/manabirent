import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

async function loadAppUser(sessionUser) {
  if (!sessionUser) return null
  const { data: perfil, error } = await supabase
    .from('perfiles')
    .select('id, nombre, rol, cuenta_activa')
    .eq('id', sessionUser.id)
    .single()
  if (error) throw error
  if (!perfil.cuenta_activa) {
    await supabase.auth.signOut()
    throw new Error('Tu cuenta está inhabilitada. Contacta al administrador.')
  }
  return {
    id: perfil.id,
    email: sessionUser.email,
    nombre: perfil.nombre,
    rol: perfil.rol,
    cuentaActiva: perfil.cuenta_activa,
  }
}

// El hook comparte archivo con el proveedor para mantener una única instancia del contexto.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Obtener sesión actual
    let mounted = true
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        const appUser = await loadAppUser(session?.user)
        if (mounted) setUser(appUser)
      } catch {
        if (mounted) setUser(null)
      } finally {
        if (mounted) setLoading(false)
      }
    })

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        setUser(null)
        setLoading(false)
        return
      }
      if (event === 'TOKEN_REFRESHED') return
      // La consulta se difiere para no bloquear el callback interno de Auth.
      setTimeout(async () => {
        try {
          const appUser = await loadAppUser(session.user)
          if (mounted) setUser(appUser)
        } catch {
          if (mounted) setUser(null)
        } finally {
          if (mounted) setLoading(false)
        }
      }, 0)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    const appUser = await loadAppUser(data.user)
    setUser(appUser)
    return { ...data, appUser }
  }

  const register = async (email, password, metadata) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata, // metadata incluye { nombre, cedula, rol }
      },
    })
    if (error) throw error
    return data
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
