import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Inbox, Send, CheckCircle, XCircle, Clock, Loader2, AlertTriangle,
  Mail, Calendar, MessageSquare,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  listSolicitudesRecibidas, listMisSolicitudes, aprobarSolicitud, rechazarSolicitud,
} from '../lib/contracts'

const ESTADO = {
  pendiente: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700', icon: Clock },
  aprobada:  { label: 'Aprobada',  color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rechazada: { label: 'Rechazada', color: 'bg-red-100 text-red-700',    icon: XCircle },
}

export default function Solicitudes() {
  const { user } = useAuth()
  const esArrendador = user?.rol === 'arrendador'

  const [solicitudes, setSolicitudes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [ocupadoId, setOcupadoId] = useState(null)
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    if (!user) return
    let activo = true
    const cargar = esArrendador
      ? listSolicitudesRecibidas(user.id)
      : listMisSolicitudes(user.id)
    cargar
      .then((data) => { if (activo) setSolicitudes(data) })
      .catch((e) => { if (activo) setError(e.message || 'No se pudieron cargar las solicitudes.') })
      .finally(() => { if (activo) setCargando(false) })
    return () => { activo = false }
  }, [user, esArrendador])

  const aprobar = async (solicitud) => {
    setOcupadoId(solicitud.id)
    setError('')
    try {
      await aprobarSolicitud(solicitud)
      setSolicitudes((lista) => lista.map((s) => (s.id === solicitud.id ? { ...s, estado: 'aprobada' } : s)))
      setAviso('Solicitud aprobada. Se generó la ficha del contrato y el inmueble quedó como arrendado.')
    } catch (e) {
      setError(e.message || 'No se pudo aprobar la solicitud.')
    } finally {
      setOcupadoId(null)
    }
  }

  const rechazar = async (solicitud) => {
    setOcupadoId(solicitud.id)
    setError('')
    try {
      await rechazarSolicitud(solicitud.id)
      setSolicitudes((lista) => lista.map((s) => (s.id === solicitud.id ? { ...s, estado: 'rechazada' } : s)))
    } catch (e) {
      setError(e.message || 'No se pudo rechazar la solicitud.')
    } finally {
      setOcupadoId(null)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-1">
          {esArrendador ? <Inbox size={22} className="text-primary-600" /> : <Send size={20} className="text-primary-600" />}
          <h1 className="text-2xl font-bold text-gray-800">
            {esArrendador ? 'Solicitudes recibidas' : 'Mis solicitudes'}
          </h1>
        </div>
        <p className="text-gray-500 text-sm mb-6">
          {esArrendador
            ? 'Revisa y responde las solicitudes de arriendo de tus inmuebles.'
            : 'Estado de las solicitudes de arriendo que has enviado.'}
        </p>

        {aviso && (
          <p className="mb-4 text-green-700 text-sm bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex items-center gap-2">
            <CheckCircle size={15} /> {aviso}{' '}
            <Link to="/contratos" className="underline font-medium">Ver contratos</Link>
          </p>
        )}
        {error && (
          <p className="mb-4 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-center gap-2">
            <AlertTriangle size={15} /> {error}
          </p>
        )}

        {cargando ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 className="animate-spin mr-2" size={20} /> Cargando...
          </div>
        ) : solicitudes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
            <Inbox size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium text-gray-600">
              {esArrendador ? 'No has recibido solicitudes' : 'No has enviado solicitudes'}
            </p>
            {!esArrendador && (
              <Link to="/" className="text-primary-600 text-sm font-medium underline mt-2 inline-block">Explorar inmuebles</Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {solicitudes.map((s) => {
              const meta = ESTADO[s.estado] || ESTADO.pendiente
              const EstadoIcon = meta.icon
              const ocupado = ocupadoId === s.id
              return (
                <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-800">{s.propiedad_titulo}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{s.propiedad_sector}, {s.propiedad_ciudad} · ${s.precio}/mes</p>
                    </div>
                    <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${meta.color}`}>
                      <EstadoIcon size={12} /> {meta.label}
                    </span>
                  </div>

                  <div className="mt-3 grid sm:grid-cols-2 gap-2 text-sm text-gray-600">
                    {esArrendador && (
                      <>
                        <p className="flex items-center gap-2"><Mail size={14} className="text-gray-400" /> {s.arrendatario_nombre} — {s.arrendatario_email}</p>
                      </>
                    )}
                    <p className="flex items-center gap-2"><Calendar size={14} className="text-gray-400" /> Desde {s.fecha_inicio} · {s.meses} meses</p>
                  </div>

                  {s.mensaje && (
                    <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 flex items-start gap-2">
                      <MessageSquare size={14} className="text-gray-400 mt-0.5 flex-shrink-0" /> {s.mensaje}
                    </p>
                  )}

                  {/* Acciones del arrendador solo si está pendiente */}
                  {esArrendador && s.estado === 'pendiente' && (
                    <div className="flex items-center justify-end gap-2 mt-4">
                      <button
                        disabled={ocupado}
                        onClick={() => rechazar(s)}
                        className="flex items-center gap-1 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium disabled:opacity-50"
                      >
                        <XCircle size={15} /> Rechazar
                      </button>
                      <button
                        disabled={ocupado}
                        onClick={() => aprobar(s)}
                        className="flex items-center gap-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                      >
                        {ocupado ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />} Aprobar y generar contrato
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
