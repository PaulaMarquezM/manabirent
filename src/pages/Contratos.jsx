import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText, Loader2, AlertTriangle, CheckCircle, Archive, Eye, X, Printer,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { listContratos, finalizarContrato } from '../lib/contracts'

const ESTADO = {
  vigente:    { label: 'Vigente',    color: 'bg-green-100 text-green-700', icon: CheckCircle },
  finalizado: { label: 'Finalizado', color: 'bg-gray-200 text-gray-600',  icon: Archive },
}

// Ficha digital del contrato (modal imprimible)
function FichaContrato({ contrato, onClose }) {
  return (
    <div className="fixed inset-0 z-[1000] bg-black/50 flex items-center justify-center px-4 py-6 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-primary-600" />
            <h2 className="font-semibold text-gray-800 text-sm">Ficha del contrato</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div id="ficha-contrato" className="p-5">
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
            <p><strong>ESTADO:</strong> {contrato.estado === 'vigente' ? 'VIGENTE' : 'FINALIZADO'}</p>
            <hr className="my-2" />
            <p className="text-gray-500 italic">
              Las partes declaran conocer y aceptar las condiciones establecidas. Este contrato cumple con la Ley de
              Inquilinato del Ecuador y la LOPDP. Verificado por el Municipio de {contrato.propiedad_ciudad}.
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

export default function Contratos() {
  const { user } = useAuth()
  const esArrendador = user?.rol === 'arrendador'

  const [contratos, setContratos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('todos') // todos | vigente | finalizado
  const [ocupadoId, setOcupadoId] = useState(null)
  const [ficha, setFicha] = useState(null)

  useEffect(() => {
    if (!user) return
    let activo = true
    listContratos(user.rol, user.id)
      .then((data) => { if (activo) setContratos(data) })
      .catch((e) => { if (activo) setError(e.message || 'No se pudieron cargar los contratos.') })
      .finally(() => { if (activo) setCargando(false) })
    return () => { activo = false }
  }, [user])

  const finalizar = async (contrato) => {
    if (!window.confirm('¿Finalizar este contrato? El inmueble volverá a estar disponible.')) return
    setOcupadoId(contrato.id)
    setError('')
    try {
      await finalizarContrato(contrato)
      setContratos((lista) => lista.map((c) => (c.id === contrato.id ? { ...c, estado: 'finalizado' } : c)))
    } catch (e) {
      setError(e.message || 'No se pudo finalizar el contrato.')
    } finally {
      setOcupadoId(null)
    }
  }

  if (!user) return null

  const visibles = filtro === 'todos' ? contratos : contratos.filter((c) => c.estado === filtro)
  const vigentes = contratos.filter((c) => c.estado === 'vigente').length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-1">
          <FileText size={22} className="text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-800">Mis contratos</h1>
        </div>
        <p className="text-gray-500 text-sm mb-6">
          Historial contractual {esArrendador ? 'de tus inmuebles' : 'de tus arriendos'} · {vigentes} vigente(s).
        </p>

        {/* Filtro */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-5">
          {[
            { k: 'todos', l: 'Todos' },
            { k: 'vigente', l: 'Vigentes' },
            { k: 'finalizado', l: 'Finalizados' },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setFiltro(t.k)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filtro === t.k ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.l}
            </button>
          ))}
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
        ) : visibles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
            <FileText size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium text-gray-600">No hay contratos que mostrar</p>
            {!esArrendador && (
              <Link to="/" className="text-primary-600 text-sm font-medium underline mt-2 inline-block">Explorar inmuebles</Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {visibles.map((c) => {
              const meta = ESTADO[c.estado] || ESTADO.vigente
              const EstadoIcon = meta.icon
              const ocupado = ocupadoId === c.id
              return (
                <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-800">{c.propiedad_titulo}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{c.propiedad_sector}, {c.propiedad_ciudad} · ${c.precio_mensual}/mes</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {esArrendador ? `Arrendatario: ${c.arrendatario_nombre}` : `Arrendador: ${c.arrendador_nombre}`}
                        {' · '}{c.fecha_inicio} → {c.fecha_fin}
                      </p>
                    </div>
                    <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${meta.color}`}>
                      <EstadoIcon size={12} /> {meta.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-4">
                    <button
                      onClick={() => setFicha(c)}
                      className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                      <Eye size={14} /> Ver ficha
                    </button>
                    {esArrendador && c.estado === 'vigente' && (
                      <button
                        disabled={ocupado}
                        onClick={() => finalizar(c)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium disabled:opacity-50"
                      >
                        {ocupado ? <Loader2 size={14} className="animate-spin" /> : <Archive size={14} />} Finalizar
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {ficha && <FichaContrato contrato={ficha} onClose={() => setFicha(null)} />}
    </div>
  )
}
