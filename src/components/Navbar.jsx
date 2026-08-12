import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Home, PlusCircle, LogIn, LogOut, User, Shield, Building2, Inbox,
  FileText, Wrench, Menu, X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const linkClass = 'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-primary-600'
const desktopLinkClass = 'flex items-center gap-1 hover:text-blue-200 text-sm font-medium'

function MenuLink({ to, label, Icon, mobile, accent, onNavigate }) {
  return (
    <Link
      to={to}
      onClick={mobile ? onNavigate : undefined}
      className={mobile
        ? `${linkClass} ${accent ? 'bg-accent-500 hover:bg-accent-600 text-white' : ''}`
        : `${desktopLinkClass} ${accent ? 'bg-accent-500 hover:bg-accent-600 text-white px-3 py-1.5 rounded-lg' : ''}`}
    >
      <Icon size={mobile ? 18 : 16} />
      <span>{label}</span>
    </Link>
  )
}

function NavigationItems({ user, mobile = false, onNavigate }) {
  return (
    <>
      <MenuLink to="/" label="Inicio" Icon={Home} mobile={mobile} onNavigate={onNavigate} />
      {user?.rol === 'admin' && <MenuLink to="/admin" label="Administración" Icon={Shield} mobile={mobile} onNavigate={onNavigate} />}
      {user?.rol === 'arrendador' && (
        <>
          <MenuLink to="/mis-propiedades" label="Mis propiedades" Icon={Building2} mobile={mobile} onNavigate={onNavigate} />
          <MenuLink to="/solicitudes" label="Solicitudes" Icon={Inbox} mobile={mobile} onNavigate={onNavigate} />
          <MenuLink to="/contratos" label="Contratos" Icon={FileText} mobile={mobile} onNavigate={onNavigate} />
          <MenuLink to="/incidencias" label="Quejas" Icon={Wrench} mobile={mobile} onNavigate={onNavigate} />
          <MenuLink to="/publicar" label="Publicar" Icon={PlusCircle} mobile={mobile} accent onNavigate={onNavigate} />
        </>
      )}
      {user?.rol === 'arrendatario' && (
        <>
          <MenuLink to="/solicitudes" label="Mis solicitudes" Icon={Inbox} mobile={mobile} onNavigate={onNavigate} />
          <MenuLink to="/contratos" label="Mis contratos" Icon={FileText} mobile={mobile} onNavigate={onNavigate} />
          <MenuLink to="/incidencias" label="Incidencias" Icon={Wrench} mobile={mobile} onNavigate={onNavigate} />
        </>
      )}
    </>
  )
}

export default function Navbar() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') closeMenu()
    }

    if (menuOpen) window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [menuOpen])

  const handleLogout = async () => {
    try {
      await logout()
      closeMenu()
      navigate('/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  return (
    <nav className="relative sticky top-0 z-50 bg-primary-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={menuOpen}
              aria-controls="main-navigation-menu"
              className="xl:hidden rounded-lg p-2 text-white hover:bg-primary-600 focus-visible:outline-white"
            >
              <Menu size={24} />
            </button>
            <Link to="/" onClick={closeMenu} className="flex items-center gap-2 font-bold text-xl">
              <Home size={24} strokeWidth={2} aria-hidden="true" />
              <span>ManabíRent</span>
            </Link>
          </div>

          <div className="hidden xl:flex items-center gap-4">
            <NavigationItems user={user} />
            {user ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-sm text-blue-200">
                  <User size={14} /> {user.nombre}
                </span>
                <button onClick={handleLogout} aria-label="Cerrar sesión" className="flex items-center gap-1 hover:text-blue-200 text-sm">
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="flex items-center gap-1 bg-white text-primary-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-sm font-semibold">
                <LogIn size={16} /> <span>Ingresar</span>
              </Link>
            )}
          </div>

        </div>
      </div>

      {menuOpen && (
        <div id="main-navigation-menu" className="fixed inset-0 z-[60] xl:hidden" role="dialog" aria-modal="true" aria-label="Menú principal">
          <button type="button" aria-label="Cerrar menú" className="absolute inset-0 bg-slate-950/40" onClick={closeMenu} />
          <aside className="relative flex h-full w-80 max-w-[86vw] flex-col bg-primary-700 shadow-2xl">
            <div className="flex h-16 items-center gap-2 border-b border-primary-600 px-4">
              <button
                type="button"
                onClick={closeMenu}
                aria-label="Cerrar menú"
                className="rounded-lg p-2 text-white hover:bg-primary-600 focus-visible:outline-white"
              >
                <X size={24} />
              </button>
              <Link to="/" onClick={closeMenu} className="flex items-center gap-2 font-bold text-xl">
                <Home size={24} strokeWidth={2} aria-hidden="true" />
                <span>ManabíRent</span>
              </Link>
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto p-4">
              <div className="space-y-1">
                <NavigationItems user={user} mobile onNavigate={closeMenu} />
              </div>
              <div className="mt-auto border-t border-primary-600 pt-4">
                {user ? (
                  <div className="space-y-3">
                    <span className="flex items-center gap-2 px-3 text-sm text-blue-100"><User size={17} /> {user.nombre}</span>
                    <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg bg-primary-800 px-3 py-2.5 text-sm text-blue-100 hover:bg-primary-600 hover:text-white">
                      <LogOut size={17} /> Cerrar sesión
                    </button>
                  </div>
                ) : (
                  <Link to="/login" onClick={closeMenu} className="flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-2.5 text-sm font-semibold text-primary-700 hover:bg-blue-50">
                    <LogIn size={18} /> Ingresar
                  </Link>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </nav>
  )
}
