import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, XCircle, BarChart2, Home, Users, AlertTriangle, Clock, Shield, Power } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export default function AdminPanel() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [data, setData] = useState({
    propiedades: [],
    perfiles: [],
    contratos: [],
    incidencias: []
  })
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)

  useEffect(() => {
    if (!user || user.rol !== 'admin') return

    const fetchData = async () => {
      try {
        setLoading(true)
        // Usamos Promise.all para cargar todo en paralelo
        const [resPropiedades, resPerfiles, resContratos, resIncidencias] = await Promise.all([
          supabase.from('propiedades').select('*'),
          supabase.from('perfiles').select('*'),
          supabase.from('contratos').select('*'),
          supabase.from('incidencias').select('*')
        ])

        if (resPropiedades.error) throw resPropiedades.error
        if (resPerfiles.error) throw resPerfiles.error

        setData({
          propiedades: resPropiedades.data || [],
          perfiles: resPerfiles.data || [],
          contratos: resContratos.data || [],
          incidencias: resIncidencias.data || []
        })
      } catch (error) {
        console.error('Error cargando datos del panel:', error)
        setErrorMsg(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  if (!user || user.rol !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 px-4">
        <AlertTriangle size={32} className="text-amber-500" />
        <p className="text-gray-600">Acceso restringido. Solo administradores municipales.</p>
        <Link to="/login" className="text-primary-600 underline text-sm">Iniciar sesión</Link>
      </div>
    )
  }

  // --- Lógica de Moderación (RF-15) ---
  const toggleUsuario = async (id, estadoActual) => {
    const nuevoEstado = !estadoActual
    const { error } = await supabase.from('perfiles').update({ cuenta_activa: nuevoEstado }).eq('id', id)
    if (!error) {
      setData(prev => ({
        ...prev,
        perfiles: prev.perfiles.map(p => p.id === id ? { ...p, cuenta_activa: nuevoEstado } : p)
      }))
    }
  }

  const togglePropiedad = async (id, estadoActual) => {
    const nuevoEstado = !estadoActual
    const { error } = await supabase.from('propiedades').update({ publicacion_activa: nuevoEstado }).eq('id', id)
    if (!error) {
      setData(prev => ({
        ...prev,
        propiedades: prev.propiedades.map(p => p.id === id ? { ...p, publicacion_activa: nuevoEstado } : p)
      }))
    }
  }

  // --- KPIs y Estadísticas (RF-13, RF-14) ---
  const totalInmuebles = data.propiedades.length
  const publicadasActivas = data.propiedades.filter(p => p.publicacion_activa).length
  const totalUsuarios = data.perfiles.length
  const totalQuejas = data.incidencias.length
  
  const preciosSum = data.propiedades.reduce((a, p) => a + Number(p.precio || 0), 0)
  const precioPromedio = totalInmuebles ? Math.round(preciosSum / totalInmuebles) : 0

  // Datos para gráficos
  const ciudadesCount = data.propiedades.reduce((acc, curr) => {
    const c = curr.ciudad || 'Otra'
    acc[c] = (acc[c] || 0) + 1
    return acc
  }, {})
  const pieDataCiudades = Object.keys(ciudadesCount).map(c => ({ name: c, value: ciudadesCount[c] }))

  const tiposCount = data.propiedades.reduce((acc, curr) => {
    const t = curr.tipo || 'Otro'
    acc[t] = (acc[t] || 0) + 1
    return acc
  }, {})
  const barDataTipos = Object.keys(tiposCount).map(t => ({ nombre: t.charAt(0).toUpperCase() + t.slice(1), total: tiposCount[t] }))


  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Panel Municipal</h1>
            <p className="text-gray-500 text-sm mt-1">Municipio de {user.nombre} — ManabíRent Admin</p>
          </div>
          
          <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-500' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <BarChart2 size={16} /> Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('usuarios')}
              className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${activeTab === 'usuarios' ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-500' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Users size={16} /> Usuarios
            </button>
            <button 
              onClick={() => setActiveTab('propiedades')}
              className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${activeTab === 'propiedades' ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-500' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Home size={16} /> Propiedades
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm flex items-center gap-2">
            <XCircle size={18} />
            Hubo un problema cargando los datos. Asegúrate de haber ejecutado el script schema_modulo6.sql en Supabase.
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-gray-500">Cargando datos del panel...</div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                    <div className="text-xs text-green-600 font-medium">{publicadasActivas} publicaciones activas</div>
                  </div>

                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Users size={20} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-800">{totalUsuarios}</p>
                        <p className="text-xs text-gray-500">Usuarios Registrados</p>
                      </div>
                    </div>
                    <div className="text-xs text-purple-600 font-medium">Plataforma global</div>
                  </div>

                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <AlertTriangle size={20} className="text-amber-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-800">{totalQuejas}</p>
                        <p className="text-xs text-gray-500">Incidencias</p>
                      </div>
                    </div>
                    <div className="text-xs text-amber-600 font-medium">Histórico reportado</div>
                  </div>

                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <BarChart2 size={20} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-800">${precioPromedio}</p>
                        <p className="text-xs text-gray-500">Precio promedio</p>
                      </div>
                    </div>
                    <div className="text-xs text-green-600 font-medium">USD/mes mercado</div>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="font-semibold text-gray-800 mb-4">Inmuebles por Ciudad</h2>
                    <div className="h-64">
                      {pieDataCiudades.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieDataCiudades}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {pieDataCiudades.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : <p className="text-center text-gray-400 mt-20">Sin datos</p>}
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="font-semibold text-gray-800 mb-4">Inmuebles por Tipo</h2>
                    <div className="h-64">
                      {barDataTipos.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={barDataTipos}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="nombre" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip cursor={{fill: 'transparent'}} />
                            <Bar dataKey="total" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : <p className="text-center text-gray-400 mt-20">Sin datos</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'usuarios' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-800">Moderación de Usuarios</h2>
                  <Shield size={18} className="text-gray-400" />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-xs text-gray-500 font-medium">
                      <tr>
                        <th className="px-5 py-3">Nombre</th>
                        <th className="px-5 py-3">Email</th>
                        <th className="px-5 py-3">Rol</th>
                        <th className="px-5 py-3">Estado</th>
                        <th className="px-5 py-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.perfiles.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3 font-medium text-gray-800">{p.nombre || 'Sin nombre'}</td>
                          <td className="px-5 py-3">{p.email}</td>
                          <td className="px-5 py-3 capitalize">{p.rol}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${p.cuenta_activa ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {p.cuenta_activa ? 'Activa' : 'Inhabilitada'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => toggleUsuario(p.id, p.cuenta_activa)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${p.cuenta_activa ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                            >
                              <Power size={14} />
                              {p.cuenta_activa ? 'Inhabilitar' : 'Habilitar'}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {data.perfiles.length === 0 && (
                        <tr><td colSpan="5" className="px-5 py-8 text-center text-gray-400">No hay usuarios registrados.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'propiedades' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-800">Moderación de Publicaciones</h2>
                  <Home size={18} className="text-gray-400" />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-xs text-gray-500 font-medium">
                      <tr>
                        <th className="px-5 py-3">Inmueble</th>
                        <th className="px-5 py-3">Arrendador</th>
                        <th className="px-5 py-3">Ciudad</th>
                        <th className="px-5 py-3">Estado Publicación</th>
                        <th className="px-5 py-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.propiedades.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3 font-medium text-gray-800">
                            <div className="max-w-[200px] truncate" title={p.titulo}>{p.titulo}</div>
                            <div className="text-xs text-gray-400 mt-0.5">${p.precio}/mes</div>
                          </td>
                          <td className="px-5 py-3 text-xs">{p.arrendador_nombre || p.arrendador_email || 'N/A'}</td>
                          <td className="px-5 py-3">{p.ciudad}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${p.publicacion_activa ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {p.publicacion_activa ? 'Pública' : 'Oculta'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => togglePropiedad(p.id, p.publicacion_activa)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${p.publicacion_activa ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                            >
                              <Power size={14} />
                              {p.publicacion_activa ? 'Ocultar' : 'Mostrar'}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {data.propiedades.length === 0 && (
                        <tr><td colSpan="5" className="px-5 py-8 text-center text-gray-400">No hay propiedades registradas.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
