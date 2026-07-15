import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Inbox, Send, CheckCircle, XCircle, Clock, Loader2, AlertTriangle,
  Mail, Calendar, MessageSquare, FileText, X, Printer,
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

function FichaContrato({ contrato, onClose }) {
  return (
    <div className="fixed inset-0 z-[1000] bg-black/50 flex items-center justify-center px-4 py-6 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-primary-600" />
            <h2 className="font-semibold text-gray-800 text-sm">Ficha digital del contrato</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="p-5">
          <div className="bg-gray-50 rounded-lg p-5 text-xs text-gray-700 leading-relaxed space-y-2 font-mono">
            <p className="text-center font-bold text-gray-800 text-sm">CONTRATO DE ARRENDAMIENTO</p>
            <p className="text-center text-gray-500">ManabíRent — Prefectura de Manabí</p>
            <p className="text-center text-gray-400">N.º {contrato.id.slice(0, 8).toUpperCase()}</p>
            <hr className="my-2" />
            <p><strong>ARRENDADOR:</strong> {contrato.arrendador_nombre}</p>
            <p><strong>ARRENDATARIO:</strong> {contrato.arrendatario_nombre} ({contrato.arrendatario_email})</p>
            <p><strong>INMUEBLE:</strong> {contrato.propiedad_titulo}</p>
            <p><strong>UBICACIÓN:</strong> {contrato.propiedad_sector}, {contrato.propiedad_ciudad}, Manabí</p>
            <p><strong>CANON MENSUAL:</strong> USD ${contrato.precio_mensual}</p>
            <p><strong>VIGENCIA:</strong> {contrato.fecha_inicio} al {contrato.fecha_fin} ({contrato.meses} meses)</p>
            <p><strong>ESTADO:</strong> VIGENTE</p>
            <hr className="my-2" />
            <p className="text-gray-500 italic">
              Las partes declaran conocer y aceptar los términos del acuerdo. Esta ficha se genera digitalmente al aprobar
              la solicitud de arriendo y queda disponible en el historial de contratos.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="text-center">
                <div className="border-t border-gray-400 pt-1 mt-6">
                  <p>Arrendador</p>
                  <p className="text-gray-400">{contrato.arrendador_nombre}</p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t border-gray-400 pt-1 mt-6">
                  <p>Arrendatario</p>
                  <p className="text-gray-400">{contrato.arrendatario_nombre}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl">Cerrar</button>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold">
            <Printer size={15} /> Imprimir / PDF
          </button>
        </div>
      </div>
    </div>
  )
}

function RechazarModal({ solicitud, ocupado, onCancel, onConfirm }) {
  const [motivo, setMotivo] = useState('')

  return (
    <div className="fixed inset-0 z-[1000] bg-black/50 flex items-center justify-center px-4" onClick={onCancel}>
      <form className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()} onSubmit={(e) => {
        e.preventDefault()
        onConfirm(motivo)
      }}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Rechazar solicitud</h2>
          <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-gray-50 rounded-xl p-3 text-sm">
            <p className="font-semibold text-gray-800">{solicitud.propiedad_titulo}</p>
            <p className="text-xs text-gray-500 mt-0.5">{solicitud.arrendatario_nombre} — {solicitud.arrendatario_email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Motivo o respuesta al arrendatario</label>
            <textarea
              rows={4}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 resize-none"
              placeholder="Ej: El inmueble ya no está disponible o no cumple con las condiciones solicitadas."
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-100">
          <button type="button" onClick={onCancel} className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl">Cancelar</button>
          <button type="submit" disabled={ocupado} className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold">
            {ocupado ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
            Rechazar
          </button>
        </div>
      </form>
    </div>
  )
}

export default function Solicitudes() {
  const { user } = useAuth()
  const esArrendador = user?.rol === 'arrendador'

  const [solicitudes, setSolicitudes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [ocupadoId, setOcupadoId] = useState(null)
  const [aviso, setAviso] = useState('')
  const [contratoGenerado, setContratoGenerado] = useState(null)
  const [rechazoPendiente, setRechazoPendiente] = useState(null)

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
    setAviso('')
    try {
      const contrato = await aprobarSolicitud(solicitud, user.id)
      setContratoGenerado(contrato)
      setSolicitudes((lista) => lista.map((s) => {
        if (s.id === solicitud.id) return { ...s, estado: 'aprobada', respuesta: 'Solicitud aprobada. Se generó la ficha digital del contrato.' }
        if (s.propiedad_id === solicitud.propiedad_id && s.estado === 'pendiente') {
          return { ...s, estado: 'rechazada', respuesta: 'El inmueble ya fue asignado a otra solicitud aprobada.' }
        }
        return s
      }))
      setAviso('Solicitud aprobada. Se generó la ficha del contrato y el inmueble quedó como arrendado.')
    } catch (e) {
      setError(e.message || 'No se pudo aprobar la solicitud.')
    } finally {
      setOcupadoId(null)
    }
  }

  const rechazar = async (solicitud, motivo) => {
    setOcupadoId(solicitud.id)
    setError('')
    setAviso('')
    try {
      const actualizada = await rechazarSolicitud(solicitud, motivo, user.id)
      setSolicitudes((lista) => lista.map((s) => (s.id === solicitud.id ? actualizada : s)))
      setRechazoPendiente(null)
      setAviso('Solicitud rechazada. La respuesta quedó registrada para el arrendatario.')
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
                        onClick={() => setRechazoPendiente(s)}
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

                  {s.respuesta && (
                    <p className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                      Respuesta: {s.respuesta}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {contratoGenerado && (
        <FichaContrato contrato={contratoGenerado} onClose={() => setContratoGenerado(null)} />
      )}
      {rechazoPendiente && (
        <RechazarModal
          solicitud={rechazoPendiente}
          ocupado={ocupadoId === rechazoPendiente.id}
          onCancel={() => setRechazoPendiente(null)}
          onConfirm={(motivo) => rechazar(rechazoPendiente, motivo)}
        />
      )}
    </div>
  )
}
