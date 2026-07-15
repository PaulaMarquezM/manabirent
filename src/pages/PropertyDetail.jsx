import { useState, useEffect, Suspense, lazy } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Star, CheckCircle, Phone, Clock, FileText, ChevronLeft, ChevronRight, KeyRound, Loader2 } from 'lucide-react'
import { properties } from '../data/mockData'
import { getProperty } from '../lib/properties'
import { useAuth } from '../context/AuthContext'
import RequestRentalModal from '../components/RequestRentalModal'

const MapView = lazy(() => import('../components/MapView'))

const servicioIcono = {
  WiFi: '📶',
  'Agua caliente': '🚿',
  Parqueadero: '🚗',
  'Cocina equipada': '🍳',
  'Cocina compartida': '🍳',
  'Cocina integral': '🍳',
  'Aire acondicionado': '❄️',
  'Smart TV': '📺',
  'Seguridad 24/7': '🔒',
  Seguridad: '🔒',
  'Lavandería': '👕',
  'Limpieza semanal': '🧹',
  Patio: '🌿',
  BBQ: '🔥',
  'Área de lavado': '👕',
  'WiFi fibra óptica': '🚀',
  'Escritorio de trabajo': '💼',
  'Baño privado': '🚿',
}

// Convierte una fila real de la tabla `propiedades` a la forma que espera esta
// pantalla (que originalmente se diseñó para los datos mock).
function normalizarPropiedadDB(row) {
  return {
    ...row,
    title: row.titulo,
    disponible: row.estado === 'disponible',
    calificacion: 0,
    num_resenas: 0,
    resenas: [],
    arrendador: {
      nombre: row.arrendador_nombre || 'Arrendador',
      telefono: row.arrendador_telefono || '',
      verificado: row.verificacion === 'aprobada',
      miembro_desde: row.created_at ? new Date(row.created_at).getFullYear().toString() : '',
    },
    _real: true,
  }
}

export default function PropertyDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const esUUID = Boolean(id && id.includes('-')) // los ids mock son numéricos

  const [property, setProperty] = useState(
    esUUID ? null : properties.find((p) => p.id === Number(id)) || null
  )
  const [cargando, setCargando] = useState(esUUID)
  const [fotoIdx, setFotoIdx] = useState(0)
  const [contratoVisible, setContratoVisible] = useState(false)
  const [solicitarOpen, setSolicitarOpen] = useState(false)

  useEffect(() => {
    if (!esUUID) return
    let activo = true
    getProperty(id)
      .then((row) => { if (activo) setProperty(normalizarPropiedadDB(row)) })
      .catch(() => { if (activo) setProperty(null) })
      .finally(() => { if (activo) setCargando(false) })
    return () => { activo = false }
  }, [id, esUUID])

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        <Loader2 className="animate-spin mr-2" size={20} /> Cargando inmueble...
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p className="text-gray-500 text-lg">Inmueble no encontrado.</p>
        <Link to="/" className="text-primary-600 underline text-sm">Volver al inicio</Link>
      </div>
    )
  }

  const prevFoto = () => setFotoIdx((i) => (i === 0 ? property.fotos.length - 1 : i - 1))
  const nextFoto = () => setFotoIdx((i) => (i === property.fotos.length - 1 ? 0 : i + 1))

  // ¿Puede este visitante solicitar el arriendo? (solo inmuebles reales disponibles)
  const puedeSolicitar = property._real && property.disponible
  const clicSolicitar = () => {
    if (!user) return navigate('/login')
    setSolicitarOpen(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <Link to="/" className="flex items-center gap-1 text-primary-600 hover:text-primary-800 text-sm mb-5">
          <ArrowLeft size={16} /> Volver a resultados
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda */}
          <div className="lg:col-span-2 space-y-5">
            {/* Galería */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
              <div className="relative h-72 sm:h-96">
                <img
                  src={property.fotos[fotoIdx]}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
                {property.fotos.length > 1 && (
                  <>
                    <button onClick={prevFoto} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5">
                      <ChevronLeft size={20} />
                    </button>
                    <button onClick={nextFoto} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5">
                      <ChevronRight size={20} />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {property.fotos.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setFotoIdx(i)}
                          className={`w-2 h-2 rounded-full transition-colors ${i === fotoIdx ? 'bg-white' : 'bg-white/50'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
              {/* Miniaturas */}
              {property.fotos.length > 1 && (
                <div className="flex gap-2 p-3">
                  {property.fotos.map((foto, i) => (
                    <button key={i} onClick={() => setFotoIdx(i)} className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === fotoIdx ? 'border-primary-500' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                      <img src={foto} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info principal */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h1 className="text-xl font-bold text-gray-800 leading-tight">{property.title}</h1>
                {!property.disponible && (
                  <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap">No disponible</span>
                )}
              </div>

              <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                <MapPin size={14} />
                <span>{property.sector}, {property.ciudad}, Manabí</span>
              </div>

              <div className="flex items-center gap-4 mb-4">
                {property.num_resenas > 0 && (
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill={i < Math.round(property.calificacion) ? 'currentColor' : 'none'} />
                    ))}
                    <span className="text-gray-700 font-semibold text-sm ml-1">{property.calificacion}</span>
                    <span className="text-gray-400 text-xs">({property.num_resenas} reseñas)</span>
                  </div>
                )}
                {property.arrendador.verificado && (
                  <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                    <CheckCircle size={13} />
                    Verificado por municipio
                  </div>
                )}
              </div>

              <p className="text-gray-600 text-sm leading-relaxed mb-4">{property.descripcion}</p>

              <div className="flex items-center gap-1 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                <Clock size={14} />
                <span>Estancia mínima: <strong>{property.min_meses} {property.min_meses === 1 ? 'mes' : 'meses'}</strong></span>
              </div>
            </div>

            {/* Servicios */}
            {property.servicios?.length > 0 && (
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h2 className="font-semibold text-gray-800 mb-3">Servicios incluidos</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {property.servicios.map((s) => (
                    <div key={s} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                      <span>{servicioIcono[s] || '✓'}</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reglas */}
            {property.reglas && (
              <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
                <h2 className="font-semibold text-amber-800 mb-2">Reglas de convivencia</h2>
                <p className="text-amber-700 text-sm">{property.reglas}</p>
              </div>
            )}

            {/* Mapa */}
            {property.lat && property.lng && (
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h2 className="font-semibold text-gray-800 mb-3">Ubicación</h2>
                <div className="h-56 rounded-lg overflow-hidden">
                  <Suspense fallback={<div className="h-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">Cargando mapa...</div>}>
                    <MapView properties={[property]} center={[property.lat, property.lng]} zoom={15} />
                  </Suspense>
                </div>
              </div>
            )}

            {/* Reseñas */}
            {property.resenas?.length > 0 && (
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h2 className="font-semibold text-gray-800 mb-4">Reseñas de arrendatarios</h2>
                <div className="space-y-4">
                  {property.resenas.map((r, i) => (
                    <div key={i} className="border-b border-gray-50 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-semibold text-sm">
                          {r.autor[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-700">{r.autor}</p>
                          <p className="text-xs text-gray-400">{r.fecha}</p>
                        </div>
                        <div className="ml-auto flex items-center gap-0.5 text-amber-400">
                          {[...Array(5)].map((_, j) => (
                            <Star key={j} size={11} fill={j < r.nota ? 'currentColor' : 'none'} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 pl-10">{r.texto}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Columna derecha - Contacto y Contrato */}
          <div className="space-y-4">
            {/* Precio y contacto */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 sticky top-20">
              <div className="text-center mb-4">
                <span className="text-3xl font-bold text-primary-700">${property.precio}</span>
                <span className="text-gray-400 text-sm">/mes</span>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold">
                    {property.arrendador.nombre[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{property.arrendador.nombre}</p>
                    {property.arrendador.miembro_desde && (
                      <p className="text-xs text-gray-500">Miembro desde {property.arrendador.miembro_desde}</p>
                    )}
                  </div>
                </div>
                {property.arrendador.verificado && (
                  <div className="flex items-center gap-1 text-green-600 text-xs font-medium bg-green-50 rounded-lg px-3 py-1.5">
                    <CheckCircle size={12} />
                    Identidad verificada por el municipio
                  </div>
                )}
              </div>

              {/* RF-06: Solicitar arriendo (solo inmuebles reales disponibles) */}
              {puedeSolicitar && (!user || user.rol === 'arrendatario') && (
                <button
                  onClick={clicSolicitar}
                  className="flex items-center justify-center gap-2 w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-semibold text-sm mb-3 transition-colors"
                >
                  <KeyRound size={16} />
                  Solicitar arriendo
                </button>
              )}

              {property.disponible && property.arrendador.telefono ? (
                <a
                  href={`https://wa.me/593${property.arrendador.telefono.slice(1)}?text=Hola, vi tu inmueble "${property.title}" en ManabíRent y me interesa.`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold text-sm mb-3 transition-colors"
                >
                  <Phone size={16} />
                  Contactar por WhatsApp
                </a>
              ) : !property.disponible ? (
                <div className="bg-gray-100 text-gray-400 py-3 rounded-xl text-center text-sm font-medium mb-3">
                  No disponible actualmente
                </div>
              ) : null}

              <button
                onClick={() => setContratoVisible(!contratoVisible)}
                className="flex items-center justify-center gap-2 w-full border-2 border-primary-600 text-primary-600 hover:bg-primary-50 py-3 rounded-xl font-semibold text-sm transition-colors"
              >
                <FileText size={16} />
                {contratoVisible ? 'Ocultar contrato' : 'Ver contrato estándar'}
              </button>
            </div>

            {/* Contrato digital */}
            {contratoVisible && (
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={16} className="text-primary-600" />
                  <h3 className="font-semibold text-gray-800 text-sm">Contrato de Arriendo Estándar</h3>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600 leading-relaxed space-y-2 font-mono">
                  <p className="text-center font-bold text-gray-800 text-sm">CONTRATO DE ARRENDAMIENTO</p>
                  <p className="text-center text-gray-500">ManabíRent — Prefectura de Manabí</p>
                  <hr className="my-2" />
                  <p><strong>ARRENDADOR:</strong> {property.arrendador.nombre}</p>
                  <p><strong>INMUEBLE:</strong> {property.title}</p>
                  <p><strong>UBICACIÓN:</strong> {property.sector}, {property.ciudad}, Manabí</p>
                  <p><strong>CANON MENSUAL:</strong> USD ${property.precio}</p>
                  <p><strong>PLAZO MÍNIMO:</strong> {property.min_meses} meses</p>
                  <p><strong>SERVICIOS INCLUIDOS:</strong> {property.servicios?.join(', ')}</p>
                  <hr className="my-2" />
                  <p className="text-gray-500 italic">
                    El arrendatario y arrendador declaran conocer y aceptar las condiciones establecidas. Este contrato cumple con la Ley de Inquilinato del Ecuador y la LOPDP. Verificado por el Municipio de {property.ciudad}.
                  </p>
                  <hr className="my-2" />
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="text-center">
                      <div className="border-t border-gray-400 pt-1 mt-6">
                        <p>Arrendador</p>
                        <p className="text-gray-400">{property.arrendador.nombre}</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="border-t border-gray-400 pt-1 mt-6">
                        <p>Arrendatario</p>
                        <p className="text-gray-400">______________</p>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => window.print()}
                  className="w-full mt-3 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Imprimir / Guardar PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {solicitarOpen && user && (
        <RequestRentalModal
          propiedad={property}
          arrendatario={{ id: user.id, nombre: user.nombre, email: user.email }}
          onClose={() => setSolicitarOpen(false)}
        />
      )}
    </div>
  )
}
