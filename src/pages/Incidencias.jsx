import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle, Calendar, CheckCircle, Clock, History,
  Loader2, Save, Send, User, Wrench,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  actualizarEstadoIncidencia,
  createIncidencia,
  listContratos,
  listHistorialIncidencias,
  listIncidenciasArrendador,
  listIncidenciasArrendatario,
} from '../lib/contracts'

const CATEGORIAS = [
  { value: 'plomeria', label: 'Plomería' },
  { value: 'electricidad', label: 'Electricidad' },
  { value: 'internet', label: 'Internet' },
  { value: 'estructura', label: 'Estructura' },
  { value: 'seguridad', label: 'Seguridad' },
  { value: 'otro', label: 'Otro' },
]

const PRIORIDADES = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
]

// RF-10 usa tres estados. Los alias conservan compatibilidad visual con
// registros creados antes de aplicar la migración de normalización.
const ESTADO = {
  reportada:   { label: 'Pendiente',  color: 'bg-amber-100 text-amber-700', icon: Clock },
  en_revision: { label: 'Pendiente',  color: 'bg-amber-100 text-amber-700', icon: Clock },
  en_proceso:  { label: 'En proceso', color: 'bg-blue-100 text-blue-700',   icon: Wrench },
  resuelta:    { label: 'Resuelto',   color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cerrada:     { label: 'Resuelto',   color: 'bg-green-100 text-green-700', icon: CheckCircle },
}

const ESTADOS_EDITABLES = ['reportada', 'en_proceso', 'resuelta']

const PRIORIDAD_COLOR = {
  baja: 'bg-gray-100 text-gray-600',
  media: 'bg-blue-100 text-blue-700',
  alta: 'bg-orange-100 text-orange-700',
  urgente: 'bg-red-100 text-red-700',
}

const FORM_INICIAL = {
  contrato_id: '',
  categoria: 'plomeria',
  prioridad: 'media',
  titulo: '',
  descripcion: '',
}

function fechaCorta(valor) {
  if (!valor) return 'Sin fecha'
  return new Date(valor).toLocaleDateString('es-EC', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function fechaHora(valor) {
  if (!valor) return 'Sin fecha'
  return new Date(valor).toLocaleString('es-EC', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function agruparHistorial(filas) {
  return (filas || []).reduce((grupos, fila) => {
    if (!grupos[fila.incidencia_id]) grupos[fila.incidencia_id] = []
    grupos[fila.incidencia_id].push(fila)
    return grupos
  }, {})
}

export default function Incidencias() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const contratoInicial = searchParams.get('contrato')
  const esArrendador = user?.rol === 'arrendador'

  const [contratos, setContratos] = useState([])
  const [incidencias, setIncidencias] = useState([])
  const [historial, setHistorial] = useState({})
  const [ediciones, setEdiciones] = useState({})
  const [form, setForm] = useState(FORM_INICIAL)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [ocupadoId, setOcupadoId] = useState(null)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    if (!user) return
    let activo = true

    const cargar = async () => {
      setCargando(true)
      setError('')
      try {
        let contratosData = []
        let incidenciasData = []

        if (esArrendador) {
          incidenciasData = await listIncidenciasArrendador(user.id)
        } else {
          [contratosData, incidenciasData] = await Promise.all([
            listContratos('arrendatario', user.id),
            listIncidenciasArrendatario(user.id),
          ])
        }

        const historialData = await listHistorialIncidencias(incidenciasData.map((i) => i.id))
        if (!activo) return

        const vigentes = contratosData.filter((c) => c.estado === 'vigente')
        const contratoSeleccionado = vigentes.find((c) => c.id === contratoInicial) || vigentes[0]

        setContratos(contratosData)
        setIncidencias(incidenciasData)
        setHistorial(agruparHistorial(historialData))
        setEdiciones(Object.fromEntries(incidenciasData.map((i) => [i.id, {
          estado: ESTADOS_EDITABLES.includes(i.estado) ? i.estado : i.estado === 'cerrada' ? 'resuelta' : 'reportada',
          comentario: '',
        }])))
        setForm((actual) => ({
          ...actual,
          contrato_id: contratoSeleccionado?.id || '',
        }))
      } catch (e) {
        if (activo) setError(e.message || 'No se pudieron cargar las incidencias.')
      } finally {
        if (activo) setCargando(false)
      }
    }

    cargar()
    return () => { activo = false }
  }, [user, esArrendador, contratoInicial])

  const contratosVigentes = useMemo(
    () => contratos.filter((c) => c.estado === 'vigente'),
    [contratos]
  )

  const contratoSeleccionado = contratosVigentes.find((c) => c.id === form.contrato_id)
  const pendientes = incidencias.filter((i) => ['reportada', 'en_revision'].includes(i.estado)).length
  const enProceso = incidencias.filter((i) => i.estado === 'en_proceso').length
  const resueltas = incidencias.filter((i) => ['resuelta', 'cerrada'].includes(i.estado)).length

  const enviar = async (e) => {
    e.preventDefault()
    setError('')
    setAviso('')

    if (!contratoSeleccionado) {
      setError('Selecciona un contrato vigente para registrar la incidencia.')
      return
    }

    setGuardando(true)
    try {
      const creada = await createIncidencia(contratoSeleccionado, {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      }, form)
      const historialCreada = await listHistorialIncidencias([creada.id])

      setIncidencias((lista) => [creada, ...lista])
      setHistorial((actual) => ({ ...actual, [creada.id]: historialCreada }))
      setForm((actual) => ({ ...FORM_INICIAL, contrato_id: actual.contrato_id }))
      setAviso('Incidencia registrada. El arrendador podrá actualizar su seguimiento.')
    } catch (e) {
      setError(e.message || 'No se pudo registrar la incidencia.')
    } finally {
      setGuardando(false)
    }
  }

  const actualizarEdicion = (id, campo, valor) => {
    setEdiciones((actual) => ({
      ...actual,
      [id]: { estado: actual[id]?.estado || 'reportada', comentario: actual[id]?.comentario || '', [campo]: valor },
    }))
  }

  const guardarSeguimiento = async (incidencia) => {
    const edicion = ediciones[incidencia.id]
    if (!edicion || edicion.estado === incidencia.estado) {
      setError('Selecciona un estado diferente antes de guardar.')
      return
    }

    setOcupadoId(incidencia.id)
    setError('')
    setAviso('')
    try {
      const actualizada = await actualizarEstadoIncidencia(
        incidencia,
        edicion.estado,
        edicion.comentario
      )
      const historialActualizado = await listHistorialIncidencias([incidencia.id])

      setIncidencias((lista) => lista.map((i) => (i.id === incidencia.id ? actualizada : i)))
      setHistorial((actual) => ({ ...actual, [incidencia.id]: historialActualizado }))
      setEdiciones((actual) => ({
        ...actual,
        [incidencia.id]: { estado: actualizada.estado, comentario: '' },
      }))
      setAviso(`Seguimiento actualizado a “${ESTADO[actualizada.estado].label}”. El inquilino ya puede verlo.`)
    } catch (e) {
      setError(e.message || 'No se pudo actualizar el seguimiento.')
    } finally {
      setOcupadoId(null)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-1">
          <Wrench size={22} className="text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-800">
            {esArrendador ? 'Seguimiento de quejas' : 'Reporte de incidencias'}
          </h1>
        </div>
        <p className="text-gray-500 text-sm mb-6">
          {esArrendador
            ? 'Actualiza el estado de las quejas recibidas y conserva la trazabilidad de cada cambio.'
            : 'Registra incidencias y consulta el seguimiento informado por tu arrendador.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">Pendientes</p>
            <div className="flex items-center gap-2 text-amber-700">
              <Clock size={18} />
              <p className="text-2xl font-bold">{pendientes}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">En proceso</p>
            <div className="flex items-center gap-2 text-blue-700">
              <Wrench size={18} />
              <p className="text-2xl font-bold">{enProceso}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">Resueltas</p>
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle size={18} />
              <p className="text-2xl font-bold">{resueltas}</p>
            </div>
          </div>
        </div>

        {aviso && (
          <p className="mb-4 text-green-700 text-sm bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex items-center gap-2">
            <CheckCircle size={15} /> {aviso}
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
        ) : (
          <div className={`grid grid-cols-1 gap-5 ${esArrendador ? '' : 'lg:grid-cols-5'}`}>
            {!esArrendador && (
              <form onSubmit={enviar} className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-fit space-y-4">
                <h2 className="font-semibold text-gray-800">Nueva incidencia</h2>

                {contratosVigentes.length === 0 ? (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700">
                    No tienes contratos vigentes para asociar un reporte.
                    <Link to="/contratos" className="block text-primary-600 font-medium underline mt-2">Ver historial contractual</Link>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Contrato activo</label>
                      <select
                        required
                        value={form.contrato_id}
                        onChange={(e) => setForm((f) => ({ ...f, contrato_id: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500"
                      >
                        {contratosVigentes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.propiedad_titulo} · {c.propiedad_sector}, {c.propiedad_ciudad}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Categoría</label>
                        <select
                          value={form.categoria}
                          onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500"
                        >
                          {CATEGORIAS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Prioridad</label>
                        <select
                          value={form.prioridad}
                          onChange={(e) => setForm((f) => ({ ...f, prioridad: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500"
                        >
                          {PRIORIDADES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Título del reporte</label>
                      <input
                        required
                        maxLength={90}
                        value={form.titulo}
                        onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500"
                        placeholder="Ej: Fuga de agua en el baño"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Descripción</label>
                      <textarea
                        required
                        minLength={20}
                        rows={5}
                        value={form.descripcion}
                        onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 resize-none"
                        placeholder="Describe qué ocurre, desde cuándo y si impide usar alguna zona del inmueble."
                      />
                      <p className="text-xs text-gray-400 text-right mt-1">{form.descripcion.length} caracteres (mín. 20)</p>
                    </div>

                    <button
                      type="submit"
                      disabled={guardando}
                      className="flex items-center justify-center gap-2 w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm"
                    >
                      {guardando ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      {guardando ? 'Registrando...' : 'Registrar incidencia'}
                    </button>
                  </>
                )}
              </form>
            )}

            <div className={`${esArrendador ? '' : 'lg:col-span-3'} space-y-4`}>
              <h2 className="font-semibold text-gray-800">
                {esArrendador ? 'Quejas recibidas' : 'Mis reportes'}
              </h2>
              {incidencias.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
                  <Wrench size={40} className="mx-auto mb-3 opacity-40" />
                  <p className="text-lg font-medium text-gray-600">
                    {esArrendador ? 'No has recibido quejas' : 'Aún no tienes incidencias registradas'}
                  </p>
                  <p className="text-sm">
                    {esArrendador
                      ? 'Las incidencias de tus contratos aparecerán aquí.'
                      : 'Cuando reportes una falla aparecerá en este historial.'}
                  </p>
                </div>
              ) : (
                incidencias.map((incidencia) => {
                  const meta = ESTADO[incidencia.estado] || ESTADO.reportada
                  const EstadoIcon = meta.icon
                  const prioridad = PRIORIDADES.find((p) => p.value === incidencia.prioridad)?.label || incidencia.prioridad
                  const categoria = CATEGORIAS.find((c) => c.value === incidencia.categoria)?.label || incidencia.categoria
                  const trazabilidad = historial[incidencia.id] || []
                  const edicion = ediciones[incidencia.id] || { estado: incidencia.estado, comentario: '' }
                  const ocupado = ocupadoId === incidencia.id

                  return (
                    <article key={incidencia.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-800">{incidencia.titulo}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {incidencia.propiedad_titulo} · {incidencia.propiedad_sector}, {incidencia.propiedad_ciudad}
                          </p>
                          {esArrendador && (
                            <p className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <User size={12} /> {incidencia.arrendatario_nombre} · {incidencia.arrendatario_email}
                            </p>
                          )}
                        </div>
                        <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${meta.color}`}>
                          <EstadoIcon size={12} /> {meta.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{categoria}</span>
                        <span className={`text-xs px-2.5 py-1 rounded-full ${PRIORIDAD_COLOR[incidencia.prioridad] || PRIORIDAD_COLOR.media}`}>
                          Prioridad {prioridad}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar size={12} /> {fechaCorta(incidencia.created_at)}
                        </span>
                      </div>

                      <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2">
                        {incidencia.descripcion}
                      </p>

                      {esArrendador && (
                        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                          <p className="text-sm font-semibold text-gray-700 mb-3">Actualizar seguimiento</p>
                          <div className="grid gap-3 sm:grid-cols-[180px_1fr_auto] sm:items-end">
                            <div>
                              <label className="text-xs font-medium text-gray-600 block mb-1">Nuevo estado</label>
                              <select
                                value={edicion.estado}
                                onChange={(e) => actualizarEdicion(incidencia.id, 'estado', e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-primary-500"
                              >
                                {ESTADOS_EDITABLES.map((estado) => (
                                  <option key={estado} value={estado}>{ESTADO[estado].label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-600 block mb-1">Comentario para el inquilino (opcional)</label>
                              <input
                                maxLength={300}
                                value={edicion.comentario}
                                onChange={(e) => actualizarEdicion(incidencia.id, 'comentario', e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-primary-500"
                                placeholder="Ej: El técnico visitará el inmueble mañana."
                              />
                            </div>
                            <button
                              type="button"
                              disabled={ocupado || edicion.estado === incidencia.estado}
                              onClick={() => guardarSeguimiento(incidencia)}
                              className="flex items-center justify-center gap-1.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                            >
                              {ocupado ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                              Guardar
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 border-t border-gray-100 pt-4">
                        <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-3">
                          <History size={15} className="text-primary-600" /> Trazabilidad
                        </p>
                        {trazabilidad.length === 0 ? (
                          <p className="text-xs text-gray-400">Sin eventos históricos registrados.</p>
                        ) : (
                          <ol className="space-y-3 border-l-2 border-gray-100 ml-1.5 pl-4">
                            {trazabilidad.map((evento) => {
                              const eventoMeta = ESTADO[evento.estado_nuevo] || ESTADO.reportada
                              return (
                                <li key={evento.id} className="relative text-xs text-gray-500">
                                  <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary-500 ring-2 ring-white" />
                                  <p className="font-medium text-gray-700">
                                    {evento.estado_anterior
                                      ? `${ESTADO[evento.estado_anterior]?.label || evento.estado_anterior} → ${eventoMeta.label}`
                                      : `Incidencia registrada como ${eventoMeta.label}`}
                                  </p>
                                  <p>{fechaHora(evento.created_at)} · {evento.cambiado_por_nombre || 'Usuario del sistema'}</p>
                                  {evento.comentario && <p className="mt-1 text-gray-600">“{evento.comentario}”</p>}
                                </li>
                              )
                            })}
                          </ol>
                        )}
                      </div>
                    </article>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
