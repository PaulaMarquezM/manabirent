import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  PlusCircle, Pencil, Trash2, Loader2, AlertTriangle, Home as HomeIcon,
  CheckCircle, Wrench, KeyRound,
} from 'lucide-react'
import { listProperties, setEstado, deleteProperty } from '../lib/properties'

// RF-05: metadatos de cada estado operativo
const ESTADOS = {
  disponible:    { label: 'Disponible',       color: 'bg-green-100 text-green-700',  icon: CheckCircle },
  arrendada:     { label: 'Arrendada',        color: 'bg-blue-100 text-blue-700',    icon: KeyRound },
  mantenimiento: { label: 'En mantenimiento', color: 'bg-amber-100 text-amber-700',  icon: Wrench },
}

const VERIFICACION = {
  pendiente: { label: 'Pendiente de verificación', color: 'text-amber-600' },
  aprobada:  { label: 'Verificada por el municipio', color: 'text-green-600' },
  rechazada: { label: 'Rechazada', color: 'text-red-600' },
}

export default function MyProperties({ user }) {
  const [propiedades, setPropiedades] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [ocupadoId, setOcupadoId] = useState(null) // id con acción en curso

  useEffect(() => {
    if (!user) return
    let activo = true
    listProperties({ arrendadorEmail: user.email })
      .then((data) => { if (activo) setPropiedades(data) })
      .catch((e) => { if (activo) setError(e.message || 'No se pudieron cargar las propiedades.') })
      .finally(() => { if (activo) setCargando(false) })
    return () => { activo = false }
  }, [user])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 px-4">
        <p className="text-gray-600">Debes iniciar sesión para gestionar tus inmuebles.</p>
        <Link to="/login" className="bg-primary-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-primary-700">Iniciar sesión</Link>
      </div>
    )
  }

  const cambiarEstado = async (id, estado) => {
    setOcupadoId(id)
    setError('')
    try {
      const actualizada = await setEstado(id, estado)
      setPropiedades((lista) => lista.map((p) => (p.id === id ? actualizada : p)))
    } catch (e) {
      setError(e.message || 'No se pudo cambiar el estado.')
    } finally {
      setOcupadoId(null)
    }
  }

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este inmueble definitivamente? Esta acción no se puede deshacer.')) return
    setOcupadoId(id)
    setError('')
    try {
      await deleteProperty(id)
      setPropiedades((lista) => lista.filter((p) => p.id !== id))
    } catch (e) {
      setError(e.message || 'No se pudo eliminar.')
    } finally {
      setOcupadoId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Mis propiedades</h1>
            <p className="text-gray-500 text-sm mt-1">Gestiona el estado, edita o elimina tus inmuebles.</p>
          </div>
          <Link
            to="/publicar"
            className="flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold"
          >
            <PlusCircle size={16} /> Publicar nuevo
          </Link>
        </div>

        {error && (
          <p className="mb-4 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-center gap-2">
            <AlertTriangle size={15} /> {error}
          </p>
        )}

        {cargando ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 className="animate-spin mr-2" size={20} /> Cargando...
          </div>
        ) : propiedades.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
            <HomeIcon size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium text-gray-600">Aún no tienes inmuebles publicados</p>
            <p className="text-sm mb-4">Publica tu primer inmueble para comenzar a recibir interesados.</p>
            <Link to="/publicar" className="text-primary-600 text-sm font-medium underline">Publicar inmueble</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {propiedades.map((p) => {
              const estado = ESTADOS[p.estado] || ESTADOS.disponible
              const EstadoIcon = estado.icon
              const verif = VERIFICACION[p.verificacion] || VERIFICACION.pendiente
              const ocupado = ocupadoId === p.id
              return (
                <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-4">
                  {/* Foto */}
                  <div className="w-full sm:w-40 h-32 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {p.fotos?.[0] ? (
                      <img src={p.fotos[0]} alt={p.titulo} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <HomeIcon size={28} />
                      </div>
                    )}
                  </div>

                  {/* Datos */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-800 text-sm truncate">{p.titulo}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{p.sector}, {p.ciudad} · <span className="capitalize">{p.tipo}</span></p>
                        <p className="text-primary-700 font-bold text-sm mt-1">${p.precio}<span className="text-gray-400 text-xs font-normal">/mes</span></p>
                      </div>
                      <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${estado.color}`}>
                        <EstadoIcon size={12} /> {estado.label}
                      </span>
                    </div>
                    <p className={`text-xs mt-2 ${verif.color}`}>● {verif.label}</p>

                    {/* Acciones */}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {/* RF-05: control de estados */}
                      <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-0.5">
                        {Object.entries(ESTADOS).map(([key, meta]) => (
                          <button
                            key={key}
                            disabled={ocupado || p.estado === key}
                            onClick={() => cambiarEstado(p.id, key)}
                            className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                              p.estado === key
                                ? 'bg-white shadow-sm font-semibold text-gray-800'
                                : 'text-gray-500 hover:text-gray-700 disabled:opacity-50'
                            }`}
                            title={`Marcar como ${meta.label}`}
                          >
                            {meta.label}
                          </button>
                        ))}
                      </div>

                      <Link
                        to={`/publicar/${p.id}`}
                        className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50"
                      >
                        <Pencil size={13} /> Editar
                      </Link>
                      <button
                        disabled={ocupado}
                        onClick={() => eliminar(p.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium disabled:opacity-50"
                      >
                        {ocupado ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
