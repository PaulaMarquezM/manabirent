import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let activo = true

    const aplicarSesion = async (session) => {
      if (!activo) return
      if (session?.user) {
        try {
          const { data: perfil, error } = await supabase
            .from('perfiles')
            .select('cuenta_activa, rol, nombre')
            .eq('id', session.user.id)
            .maybeSingle()
            
          if (error) throw error

          if (perfil && !perfil.cuenta_activa) {
            await supabase.auth.signOut()
            if (activo) setUser(null)
            setLoading(false)
            return
          }

          if (!activo) return
          
          setUser({
            id: session.user.id,
            email: session.user.email,
            nombre: perfil?.nombre || session.user.user_metadata?.nombre,
            rol: perfil?.rol || session.user.user_metadata?.rol,
            telefono: session.user.user_metadata?.telefono,
          })
        } catch (error) {
          console.error('Error al validar el estado de la cuenta:', error)
          if (activo) setUser(null)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    }

    supabase.auth.getSession()
      .then(({ data: { session } }) => aplicarSesion(session))
      .catch((error) => {
        console.error('Error al obtener la sesión:', error)
        aplicarSesion(null)
      })

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
        data: metadata,
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
