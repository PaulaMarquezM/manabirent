import { useEffect } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Home, PlusCircle, LogIn, LogOut, User, Shield, Building2, Inbox, FileText, Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useDisclosure } from '../hooks/useDisclosure'

const linkClass = ({ isActive }) => [
  'flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors',
  isActive ? 'bg-primary-800 text-white' : 'text-blue-50 hover:bg-primary-600 hover:text-white',
].join(' ')

function buildNavigation(user) {
  const items = [{ to: '/', label: 'Inicio', icon: Home, end: true }]

  if (user?.rol === 'admin') {
    items.push({ to: '/admin', label: 'Administración', icon: Shield })
  }

  if (user?.rol === 'arrendador') {
    items.push(
      { to: '/mis-propiedades', label: 'Mis propiedades', icon: Building2 },
      { to: '/solicitudes', label: 'Solicitudes', icon: Inbox },
      { to: '/contratos', label: 'Contratos', icon: FileText },
      { to: '/publicar', label: 'Publicar', icon: PlusCircle, featured: true },
    )
  }

  if (user?.rol === 'arrendatario') {
    items.push(
      { to: '/solicitudes', label: 'Mis solicitudes', icon: Inbox },
      { to: '/contratos', label: 'Mis contratos', icon: FileText },
    )
  }

  return items
}

function NavigationLinks({ items, onNavigate, mobile = false }) {
  return items.map(({ to, label, icon: Icon, end, featured }) => (
    <NavLink
      key={to}
      to={to}
      end={end}
      onClick={onNavigate}
      className={featured
        ? 'flex min-h-11 items-center gap-2 rounded-lg bg-accent-500 px-3 text-sm font-semibold text-white hover:bg-accent-600'
        : linkClass}
    >
      <Icon size={17} aria-hidden="true" />
      <span className={mobile ? '' : 'whitespace-nowrap'}>{label}</span>
    </NavLink>
  ))
}

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { isOpen, close, toggle } = useDisclosure()
  const navigation = buildNavigation(user)

  useEffect(() => close(), [close, location.pathname])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-primary-700 text-white shadow-lg" aria-label="Navegación principal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          <Link to="/" className="flex min-w-0 items-center gap-2 text-xl font-bold" aria-label="ManabíRent, ir al inicio">
            <span className="text-2xl" aria-hidden="true">🏠</span>
            <span>ManabíRent</span>
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            <NavigationLinks items={navigation} />
            {user ? (
              <div className="ml-2 flex items-center gap-1 border-l border-primary-500 pl-3">
                <span className="flex max-w-32 items-center gap-1 truncate text-sm text-blue-100" title={user.nombre}>
                  <User size={15} aria-hidden="true" />
                  <span className="truncate">{user.nombre}</span>
                </span>
                <button onClick={handleLogout} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-primary-600" aria-label="Cerrar sesión">
                  <LogOut size={17} aria-hidden="true" />
                </button>
              </div>
            ) : (
              <NavLink to="/login" className="ml-2 flex min-h-11 items-center gap-2 rounded-lg bg-white px-3 text-sm font-semibold text-primary-700 hover:bg-blue-50">
                <LogIn size={17} aria-hidden="true" /> Ingresar
              </NavLink>
            )}
          </div>

          <button
            type="button"
            onClick={toggle}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-primary-600 lg:hidden"
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
            aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {isOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
          </button>
        </div>

        {isOpen && (
          <div id="mobile-navigation" className="border-t border-primary-600 py-3 lg:hidden">
            <div className="grid gap-1">
              <NavigationLinks items={navigation} onNavigate={close} mobile />
              {user ? (
                <div className="mt-2 flex items-center justify-between border-t border-primary-600 pt-3">
                  <span className="flex min-w-0 items-center gap-2 text-sm text-blue-100">
                    <User size={16} aria-hidden="true" />
                    <span className="truncate">{user.nombre}</span>
                  </span>
                  <button onClick={handleLogout} className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm hover:bg-primary-600">
                    <LogOut size={17} aria-hidden="true" /> Cerrar sesión
                  </button>
                </div>
              ) : (
                <NavLink to="/login" onClick={close} className="mt-2 flex min-h-11 items-center gap-2 rounded-lg bg-white px-3 text-sm font-semibold text-primary-700">
                  <LogIn size={17} aria-hidden="true" /> Ingresar
                </NavLink>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
