import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { UserPlus, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [form, setForm] = useState({ 
    nombre: '', 
    cedula: '', 
    email: '', 
    password: '', 
    rol: 'arrendatario' 
  })
  const [verPass, setVerPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const navigate = useNavigate()
  const { register } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validación de Nombre (solo letras y espacios)
    const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/
    if (!nombreRegex.test(form.nombre.trim())) {
      setError('El nombre solo debe contener letras.')
      return
    }

    // Validación de Cédula/RUC (solo números, 10 o 13 dígitos)
    const cedulaValida = /^\d+$/.test(form.cedula.trim()) && (form.cedula.trim().length === 10 || form.cedula.trim().length === 13)
    if (!cedulaValida) {
      setError('La cédula debe tener 10 dígitos y el RUC 13 (solo números).')
      return
    }

    setLoading(true)

    try {
      await register(form.email, form.password, {
        nombre: form.nombre.trim(),
        cedula: form.cedula.trim(),
        rol: form.rol
      })
      
      // Tras un registro exitoso, Supabase suele loguear automáticamente o requerir verificación por email.
      // Asumiremos login automático y redirigiremos.
      if (form.rol === 'arrendador') navigate('/publicar')
      else navigate('/')
    } catch (err) {
      setError(err.message || 'Error al crear la cuenta. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-4xl">🏠</span>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">Crear Cuenta</h1>
          <p className="text-gray-500 text-sm mt-1">Únete a ManabíRent</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-3 mb-2">
              <button 
                type="button"
                onClick={() => setForm({ ...form, rol: 'arrendatario' })}
                className={`py-2 rounded-xl text-sm font-medium border ${form.rol === 'arrendatario' ? 'bg-primary-50 border-primary-500 text-primary-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                Soy Inquilino
              </button>
              <button 
                type="button"
                onClick={() => setForm({ ...form, rol: 'arrendador' })}
                className={`py-2 rounded-xl text-sm font-medium border ${form.rol === 'arrendador' ? 'bg-primary-50 border-primary-500 text-primary-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                Soy Arrendador
              </button>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Nombre Completo</label>
              <input
                type="text"
                required
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                placeholder="Ej: Juan Pérez"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Cédula o RUC</label>
              <input
                type="text"
                required
                value={form.cedula}
                onChange={(e) => setForm((f) => ({ ...f, cedula: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                placeholder="130XXXXXXX"
              />
            </div>

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
              className="w-full bg-primary-700 hover:bg-primary-800 disabled:opacity-70 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors mt-2"
            >
              <UserPlus size={16} />
              {loading ? 'Registrando...' : 'Registrarse'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <span className="text-gray-400 text-xs">¿Ya tienes cuenta? </span>
            <Link to="/login" className="text-primary-600 text-xs font-medium hover:underline">Ingresa aquí</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
