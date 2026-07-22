import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle, Calendar, CheckCircle, Clock, FileText, Loader2, Search,
  Send, Wrench, XCircle,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { createIncidencia, listContratos, listIncidenciasArrendatario } from '../lib/contracts'

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

const ESTADO = {
  reportada:   { label: 'Reportada',   color: 'bg-amber-100 text-amber-700', icon: Clock },
  en_revision: { label: 'En revisión', color: 'bg-blue-100 text-blue-700',   icon: Search },
  en_proceso:  { label: 'En proceso',  color: 'bg-primary-100 text-primary-700', icon: Wrench },
  resuelta:    { label: 'Resuelta',    color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cerrada:     { label: 'Cerrada',     color: 'bg-gray-200 text-gray-600',   icon: XCircle },
}

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

export default function Incidencias() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const contratoInicial = searchParams.get('contrato')

  const [contratos, setContratos] = useState([])
  const [incidencias, setIncidencias] = useState([])
  const [form, setForm] = useState(FORM_INICIAL)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    if (!user) return
    let activo = true

    Promise.all([
      listContratos('arrendatario', user.id),
      listIncidenciasArrendatario(user.id),
    ])
      .then(([contratosData, incidenciasData]) => {
        if (!activo) return
        const vigentes = contratosData.filter((c) => c.estado === 'vigente')
        const contratoSeleccionado = vigentes.find((c) => c.id === contratoInicial) || vigentes[0]

        setContratos(contratosData)
        setIncidencias(incidenciasData)
        setForm((actual) => ({
          ...actual,
          contrato_id: contratoSeleccionado?.id || '',
        }))
      })
      .catch((e) => {
        if (activo) setError(e.message || 'No se pudieron cargar tus reportes.')
      })
      .finally(() => {
        if (activo) setCargando(false)
      })

    return () => { activo = false }
  }, [user, contratoInicial])

  const contratosVigentes = useMemo(
    () => contratos.filter((c) => c.estado === 'vigente'),
    [contratos]
  )

  const contratoSeleccionado = contratosVigentes.find((c) => c.id === form.contrato_id)
  const abiertas = incidencias.filter((i) => !['resuelta', 'cerrada'].includes(i.estado)).length
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

      setIncidencias((lista) => [creada, ...lista])
      setForm((actual) => ({
        ...FORM_INICIAL,
        contrato_id: actual.contrato_id,
      }))
      setAviso('Incidencia registrada. El reporte quedó asociado a tu contrato activo.')
    } catch (e) {
      setError(e.message || 'No se pudo registrar la incidencia.')
    } finally {
      setGuardando(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-1">
          <Wrench size={22} className="text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-800">Reporte de incidencias</h1>
        </div>
        <p className="text-gray-500 text-sm mb-6">
          Registra fallas o solicitudes de mantenimiento asociadas a tus contratos vigentes.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">Contratos activos</p>
            <div className="flex items-center gap-2 text-primary-700">
              <FileText size={18} />
              <p className="text-2xl font-bold">{contratosVigentes.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">Reportes abiertos</p>
            <div className="flex items-center gap-2 text-amber-700">
              <Clock size={18} />
              <p className="text-2xl font-bold">{abiertas}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">Reportes resueltos</p>
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
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
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

            <div className="lg:col-span-3 space-y-4">
              <h2 className="font-semibold text-gray-800">Mis reportes</h2>
              {incidencias.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
                  <Wrench size={40} className="mx-auto mb-3 opacity-40" />
                  <p className="text-lg font-medium text-gray-600">Aún no tienes incidencias registradas</p>
                  <p className="text-sm">Cuando reportes una falla aparecerá en este historial.</p>
                </div>
              ) : (
                incidencias.map((i) => {
                  const meta = ESTADO[i.estado] || ESTADO.reportada
                  const EstadoIcon = meta.icon
                  const prioridad = PRIORIDADES.find((p) => p.value === i.prioridad)?.label || i.prioridad
                  const categoria = CATEGORIAS.find((c) => c.value === i.categoria)?.label || i.categoria

                  return (
                    <div key={i.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-800">{i.titulo}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {i.propiedad_titulo} · {i.propiedad_sector}, {i.propiedad_ciudad}
                          </p>
                        </div>
                        <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${meta.color}`}>
                          <EstadoIcon size={12} /> {meta.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{categoria}</span>
                        <span className={`text-xs px-2.5 py-1 rounded-full ${PRIORIDAD_COLOR[i.prioridad] || PRIORIDAD_COLOR.media}`}>
                          Prioridad {prioridad}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar size={12} /> {fechaCorta(i.created_at)}
                        </span>
                      </div>

                      <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2">
                        {i.descripcion}
                      </p>

                      {i.respuesta && (
                        <p className="mt-3 text-xs text-primary-700 bg-primary-50 rounded-lg px-3 py-2">
                          Respuesta: {i.respuesta}
                        </p>
                      )}
                    </div>
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
