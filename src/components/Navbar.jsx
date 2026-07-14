import { Link, useNavigate } from 'react-router-dom'
import { Home, PlusCircle, LogIn, LogOut, User, Shield, Building2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  return (
    <nav className="bg-primary-700 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <span className="text-2xl">🏠</span>
            <span>ManabíRent</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-1 hover:text-blue-200 text-sm font-medium">
              <Home size={16} />
              <span className="hidden sm:inline">Inicio</span>
            </Link>

            {user ? (
              <>
                {user.rol === 'admin' && (
                  <Link to="/admin" className="flex items-center gap-1 hover:text-blue-200 text-sm font-medium">
                    <Shield size={16} />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                )}
                {user.rol === 'arrendador' && (
                  <>
                    <Link to="/mis-propiedades" className="flex items-center gap-1 hover:text-blue-200 text-sm font-medium">
                      <Building2 size={16} />
                      <span className="hidden sm:inline">Mis propiedades</span>
                    </Link>
                    <Link to="/publicar" className="flex items-center gap-1 bg-accent-500 hover:bg-accent-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                      <PlusCircle size={16} />
                      <span>Publicar</span>
                    </Link>
                  </>
                )}
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-sm text-blue-200">
                    <User size={14} />
                    {user.nombre}
                  </span>
                  <button onClick={handleLogout} className="flex items-center gap-1 hover:text-blue-200 text-sm">
                    <LogOut size={14} />
                  </button>
                </div>
              </>
            ) : (
              <Link to="/login" className="flex items-center gap-1 bg-white text-primary-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-sm font-semibold">
                <LogIn size={16} />
                <span>Ingresar</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
