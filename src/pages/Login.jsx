import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LogIn, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [verPass, setVerPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const navigate = useNavigate()
  const { login, user } = useAuth()

  // Si ya está logueado, redirigimos
  if (user) {
    if (user.rol === 'admin') navigate('/admin')
    else if (user.rol === 'arrendador') navigate('/publicar')
    else navigate('/')
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const authData = await login(form.email, form.password)
      const rol = authData.user.user_metadata?.rol
      
      if (rol === 'admin') navigate('/admin')
      else if (rol === 'arrendador') navigate('/publicar')
      else navigate('/')
    } catch (err) {
      setError(err.message || 'Credenciales incorrectas o error en el servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-4xl">🏠</span>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">ManabíRent</h1>
          <p className="text-gray-500 text-sm mt-1">Ingresa a tu cuenta</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Correo electrónico</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Contraseña</label>
              <div className="relative">
                <input
                  type={verPass ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 pr-10"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setVerPass(!verPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {verPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <p className="text-red-500 text-xs bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary-700 hover:bg-primary-800 disabled:opacity-70 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <LogIn size={16} />
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <span className="text-gray-400 text-xs">¿No tienes cuenta? </span>
            <Link to="/registro" className="text-primary-600 text-xs font-medium hover:underline">Regístrate aquí</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
