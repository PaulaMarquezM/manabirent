import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

// Este hook se exporta desde el mismo archivo por simplicidad del proyecto.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let activo = true

    const aplicarSesion = (session) => {
      if (!activo) return
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          nombre: session.user.user_metadata?.nombre,
          rol: session.user.user_metadata?.rol,
          telefono: session.user.user_metadata?.telefono,
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    }

    // Obtener sesión actual
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => aplicarSesion(session))
      .catch((error) => {
        console.error('Error al obtener la sesión:', error)
        aplicarSesion(null)
      })

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      aplicarSesion(session)
    })

    return () => {
      activo = false
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
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
      {children}
    </AuthContext.Provider>
  )
}
