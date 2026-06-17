import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, XCircle, Eye, BarChart2, Home, Users, AlertTriangle, Clock } from 'lucide-react'
import { properties } from '../data/mockData'

const pendientes = [
  { id: 101, titulo: 'Habitación sector Los Esteros', arrendador: 'Luis Vera', ciudad: 'Manta', precio: 200, tipo: 'habitacion', fecha: '2026-06-15' },
  { id: 102, titulo: 'Suite amoblada Portoviejo norte', arrendador: 'Karina Baque', ciudad: 'Portoviejo', precio: 320, tipo: 'suite', fecha: '2026-06-16' },
  { id: 103, titulo: 'Departamento 3 hab, Manta centro', arrendador: 'Marcos Delgado', ciudad: 'Manta', precio: 600, tipo: 'departamento', fecha: '2026-06-17' },
]

export default function AdminPanel({ user }) {
  const [solicitudes, setSolicitudes] = useState(pendientes)
  const [accion, setAccion] = useState(null)

  if (!user || user.rol !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 px-4">
        <AlertTriangle size={32} className="text-amber-500" />
        <p className="text-gray-600">Acceso restringido. Solo administradores municipales.</p>
        <Link to="/login" className="text-primary-600 underline text-sm">Iniciar sesión</Link>
      </div>
    )
  }

  const aprobar = (id) => {
    setSolicitudes((s) => s.filter((x) => x.id !== id))
    setAccion({ tipo: 'aprobado', id })
  }
  const rechazar = (id) => {
    setSolicitudes((s) => s.filter((x) => x.id !== id))
    setAccion({ tipo: 'rechazado', id })
  }

  const publicados = properties.filter((p) => p.disponible).length
  const totalInmuebles = properties.length
  const ciudadManta = properties.filter((p) => p.ciudad === 'Manta').length
  const ciudadPorto = properties.filter((p) => p.ciudad === 'Portoviejo').length
  const precioPromedio = Math.round(properties.reduce((a, p) => a + p.precio, 0) / properties.length)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Panel Municipal</h1>
          <p className="text-gray-500 text-sm mt-1">Municipio de {user.nombre} — ManabíRent Admin</p>
        </div>

        {accion && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${accion.tipo === 'aprobado' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {accion.tipo === 'aprobado' ? <CheckCircle size={16} /> : <XCircle size={16} />}
            Solicitud #{accion.id} {accion.tipo === 'aprobado' ? 'aprobada — el arrendador será notificado.' : 'rechazada — el arrendador recibirá los motivos.'}
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Home size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{totalInmuebles}</p>
                <p className="text-xs text-gray-500">Total inmuebles</p>
              </div>
            </div>
            <div className="text-xs text-green-600 font-medium">{publicados} publicados activos</div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{solicitudes.length}</p>
                <p className="text-xs text-gray-500">Pendientes</p>
              </div>
            </div>
            <div className="text-xs text-amber-600 font-medium">Requieren revisión</div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Users size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{totalInmuebles}</p>
                <p className="text-xs text-gray-500">Arrendadores</p>
              </div>
            </div>
            <div className="text-xs text-green-600 font-medium">Todos verificados</div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart2 size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">${precioPromedio}</p>
                <p className="text-xs text-gray-500">Precio promedio</p>
              </div>
            </div>
            <div className="text-xs text-purple-600 font-medium">USD/mes mercado</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Solicitudes pendientes */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-5 border-b border-gray-50">
                <h2 className="font-semibold text-gray-800">Solicitudes pendientes de verificación</h2>
              </div>
              {solicitudes.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <CheckCircle size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No hay solicitudes pendientes</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {solicitudes.map((s) => (
                    <div key={s.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800 text-sm">{s.titulo}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span>{s.arrendador}</span>
                            <span>·</span>
                            <span>{s.ciudad}</span>
                            <span>·</span>
                            <span className="capitalize">{s.tipo}</span>
                            <span>·</span>
                            <span className="font-semibold text-gray-700">${s.precio}/mes</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">Enviado: {s.fecha}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg" title="Ver detalle">
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => rechazar(s.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium"
                          >
                            <XCircle size={13} />
                            Rechazar
                          </button>
                          <button
                            onClick={() => aprobar(s.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-semibold"
                          >
                            <CheckCircle size={13} />
                            Aprobar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Estadísticas del mercado */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-800 mb-4">Distribución por ciudad</h2>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Manta</span>
                    <span className="font-semibold text-gray-800">{ciudadManta}</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2">
                    <div className="bg-primary-500 rounded-full h-2" style={{ width: `${(ciudadManta / totalInmuebles) * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Portoviejo</span>
                    <span className="font-semibold text-gray-800">{ciudadPorto}</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2">
                    <div className="bg-accent-500 rounded-full h-2" style={{ width: `${(ciudadPorto / totalInmuebles) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-800 mb-4">Tipos de inmueble</h2>
              <div className="space-y-2">
                {['habitacion', 'departamento', 'suite', 'casa'].map((tipo) => {
                  const count = properties.filter((p) => p.tipo === tipo).length
                  const label = { habitacion: 'Habitación', departamento: 'Departamento', suite: 'Suite', casa: 'Casa' }[tipo]
                  return (
                    <div key={tipo} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 capitalize">{label}</span>
                      <div className="flex items-center gap-2">
                        <div className="bg-gray-100 rounded-full h-1.5 w-20">
                          <div className="bg-primary-400 rounded-full h-1.5" style={{ width: `${(count / totalInmuebles) * 100}%` }} />
                        </div>
                        <span className="font-medium text-gray-700 text-xs w-4 text-right">{count}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
              <p className="text-xs text-primary-700 font-semibold mb-1">Datos para planificación urbana</p>
              <p className="text-xs text-primary-600">El precio promedio de arriendo en la plataforma es <strong>${precioPromedio}/mes</strong>. Manta concentra el {Math.round((ciudadManta / totalInmuebles) * 100)}% de la oferta disponible.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
