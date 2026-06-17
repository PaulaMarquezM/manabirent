import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LogIn, Eye, EyeOff, Shield } from 'lucide-react'

const USUARIOS_DEMO = [
  { email: 'arrendador@demo.com', password: '1234', nombre: 'Carlos Mendoza', rol: 'arrendador' },
  { email: 'admin@municipio.gob.ec', password: '1234', nombre: 'Admin Municipal', rol: 'admin' },
  { email: 'inquilino@demo.com', password: '1234', nombre: 'María López', rol: 'inquilino' },
]

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [verPass, setVerPass] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    const usuario = USUARIOS_DEMO.find((u) => u.email === form.email && u.password === form.password)
    if (usuario) {
      onLogin(usuario)
      navigate(usuario.rol === 'admin' ? '/admin' : usuario.rol === 'arrendador' ? '/publicar' : '/')
    } else {
      setError('Credenciales incorrectas. Usa las cuentas demo.')
    }
  }

  const loginDemo = (usuario) => {
    onLogin(usuario)
    navigate(usuario.rol === 'admin' ? '/admin' : usuario.rol === 'arrendador' ? '/publicar' : '/')
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

            <button type="submit" className="w-full bg-primary-700 hover:bg-primary-800 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
              <LogIn size={16} />
              Ingresar
            </button>
          </form>

          <div className="mt-4 text-center">
            <span className="text-gray-400 text-xs">¿No tienes cuenta? </span>
            <Link to="/registro" className="text-primary-600 text-xs font-medium hover:underline">Regístrate aquí</Link>
          </div>
        </div>

        {/* Cuentas demo */}
        <div className="mt-4 bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-xs font-semibold text-blue-700 mb-3 flex items-center gap-1">
            <Shield size={12} /> Cuentas de demostración
          </p>
          <div className="space-y-2">
            {USUARIOS_DEMO.map((u) => (
              <button
                key={u.email}
                onClick={() => loginDemo(u)}
                className="w-full text-left bg-white hover:bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs transition-colors"
              >
                <span className="font-semibold text-gray-700">{u.nombre}</span>
                <span className="text-gray-400 ml-2">({u.rol})</span>
                <span className="text-blue-500 text-xs block">{u.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
