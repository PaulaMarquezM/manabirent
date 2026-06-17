import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Upload, CheckCircle, PlusCircle, X } from 'lucide-react'
import { ciudades, sectoresPorCiudad } from '../data/mockData'

const SERVICIOS_OPCIONES = [
  'WiFi', 'Agua caliente', 'Parqueadero', 'Cocina equipada', 'Cocina compartida',
  'Aire acondicionado', 'Smart TV', 'Seguridad 24/7', 'Lavandería',
  'Limpieza semanal', 'Patio', 'Baño privado', 'Área de lavado',
]

export default function PublishProperty({ user }) {
  const navigate = useNavigate()
  const [paso, setPaso] = useState(1)
  const [enviado, setEnviado] = useState(false)
  const [form, setForm] = useState({
    titulo: '',
    tipo: '',
    ciudad: '',
    sector: '',
    precio: '',
    descripcion: '',
    servicios: [],
    reglas: '',
    min_meses: '3',
    fotos: [],
  })

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 px-4">
        <p className="text-gray-600">Debes iniciar sesión para publicar un inmueble.</p>
        <Link to="/login" className="bg-primary-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-primary-700">Iniciar sesión</Link>
      </div>
    )
  }

  const toggleServicio = (s) => {
    setForm((f) => ({
      ...f,
      servicios: f.servicios.includes(s) ? f.servicios.filter((x) => x !== s) : [...f.servicios, s],
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setEnviado(true)
  }

  const sectores = form.ciudad ? sectoresPorCiudad[form.ciudad] || [] : []

  if (enviado) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">¡Solicitud enviada!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Tu inmueble ha sido enviado para revisión por el municipio. Recibirás confirmación en un plazo de 48-72 horas hábiles.
          </p>
          <div className="bg-amber-50 rounded-xl p-4 text-left text-sm text-amber-700 mb-6">
            <p className="font-semibold mb-1">Próximos pasos:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>El municipio verificará tu identidad y documentos</li>
              <li>Se revisará la información del inmueble</li>
              <li>Recibirás aprobación o comentarios para corrección</li>
              <li>Tu inmueble aparecerá publicado en la plataforma</li>
            </ol>
          </div>
          <Link to="/" className="bg-primary-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-primary-700 inline-block">
            Ver todos los inmuebles
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link to="/" className="flex items-center gap-1 text-primary-600 hover:text-primary-800 text-sm mb-6">
          <ArrowLeft size={16} /> Volver
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Publicar inmueble</h1>
          <p className="text-gray-500 text-sm mt-1">Completa la información para enviar tu inmueble a verificación municipal.</p>
        </div>

        {/* Indicador de pasos */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((p) => (
            <div key={p} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${paso >= p ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                {paso > p ? <CheckCircle size={16} /> : p}
              </div>
              <span className={`text-xs hidden sm:block ${paso >= p ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>
                {p === 1 ? 'Datos básicos' : p === 2 ? 'Servicios y reglas' : 'Fotos y envío'}
              </span>
              {p < 3 && <div className={`flex-1 h-0.5 ${paso > p ? 'bg-primary-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            {/* Paso 1: Datos básicos */}
            {paso === 1 && (
              <>
                <h2 className="font-semibold text-gray-700 text-base">Información del inmueble</h2>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Título del anuncio *</label>
                  <input
                    type="text"
                    required
                    value={form.titulo}
                    onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500"
                    placeholder="Ej: Departamento amoblado cerca de ULEAM"
                    maxLength={80}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Tipo de inmueble *</label>
                    <select
                      required
                      value={form.tipo}
                      onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500"
                    >
                      <option value="">Selecciona...</option>
                      <option value="habitacion">Habitación</option>
                      <option value="departamento">Departamento</option>
                      <option value="suite">Suite / Estudio</option>
                      <option value="casa">Casa</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Estancia mínima *</label>
                    <select
                      required
                      value={form.min_meses}
                      onChange={(e) => setForm((f) => ({ ...f, min_meses: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500"
                    >
                      <option value="3">3 meses</option>
                      <option value="6">6 meses</option>
                      <option value="12">12 meses</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Ciudad *</label>
                    <select
                      required
                      value={form.ciudad}
                      onChange={(e) => setForm((f) => ({ ...f, ciudad: e.target.value, sector: '' }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500"
                    >
                      <option value="">Selecciona...</option>
                      {ciudades.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Sector *</label>
                    <select
                      required
                      value={form.sector}
                      onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500"
                      disabled={!form.ciudad}
                    >
                      <option value="">Selecciona...</option>
                      {sectores.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Precio mensual (USD) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      type="number"
                      required
                      min="50"
                      max="5000"
                      value={form.precio}
                      onChange={(e) => setForm((f) => ({ ...f, precio: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-sm outline-none focus:border-primary-500"
                      placeholder="250"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Descripción *</label>
                  <textarea
                    required
                    value={form.descripcion}
                    onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                    rows={4}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500 resize-none"
                    placeholder="Describe el inmueble: tamaño, distribución, ambiente, acceso a transporte..."
                    minLength={50}
                  />
                  <p className="text-xs text-gray-400 text-right mt-1">{form.descripcion.length} caracteres (mín. 50)</p>
                </div>
              </>
            )}

            {/* Paso 2: Servicios y reglas */}
            {paso === 2 && (
              <>
                <h2 className="font-semibold text-gray-700 text-base">Servicios y reglas de convivencia</h2>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Servicios incluidos</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SERVICIOS_OPCIONES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleServicio(s)}
                        className={`text-xs px-3 py-2 rounded-lg border transition-all text-left ${form.servicios.includes(s) ? 'bg-primary-50 border-primary-400 text-primary-700 font-medium' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                      >
                        {form.servicios.includes(s) ? '✓ ' : ''}{s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Reglas de convivencia *</label>
                  <textarea
                    required
                    value={form.reglas}
                    onChange={(e) => setForm((f) => ({ ...f, reglas: e.target.value }))}
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500 resize-none"
                    placeholder="Ej: No mascotas. No fumar. Pago puntual el 1ro de cada mes."
                  />
                </div>

                <div className="bg-blue-50 rounded-xl p-4 text-xs text-blue-700">
                  <p className="font-semibold mb-1">Información sobre verificación municipal:</p>
                  <p>El municipio revisará que las condiciones de tu anuncio sean verídicas. Tendrás que presentar documentos de propiedad o contrato de subarriendo autorizado.</p>
                </div>
              </>
            )}

            {/* Paso 3: Fotos */}
            {paso === 3 && (
              <>
                <h2 className="font-semibold text-gray-700 text-base">Fotos del inmueble</h2>
                <p className="text-sm text-gray-500">Mínimo 3 fotos reales del inmueble. Las fotos de stock o no representativas serán rechazadas.</p>

                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-primary-300 transition-colors cursor-pointer">
                  <Upload size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm font-medium text-gray-600">Arrastra fotos aquí o haz clic para seleccionar</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG hasta 5MB c/u · Mínimo 3 fotos</p>
                  <p className="text-xs text-primary-500 mt-3 font-medium">(En el prototipo esta función es simulada)</p>
                </div>

                {/* Fotos de muestra */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80',
                    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80',
                    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80',
                  ].map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <div className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center hover:border-primary-300 cursor-pointer">
                    <PlusCircle size={24} className="text-gray-300" />
                  </div>
                </div>

                <div className="bg-amber-50 rounded-xl p-4 text-xs text-amber-700">
                  <p className="font-semibold mb-1">Al enviar este formulario confirmas que:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>La información proporcionada es verídica</li>
                    <li>Eres el propietario o tienes autorización para subarrendar</li>
                    <li>Aceptas los términos de ManabíRent y cumplimiento de la LOPDP</li>
                    <li>El municipio puede realizar visitas de verificación</li>
                  </ul>
                </div>
              </>
            )}
          </div>

          {/* Navegación pasos */}
          <div className="flex items-center justify-between mt-6">
            {paso > 1 ? (
              <button
                type="button"
                onClick={() => setPaso(paso - 1)}
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                ← Anterior
              </button>
            ) : (
              <div />
            )}

            {paso < 3 ? (
              <button
                type="button"
                onClick={() => setPaso(paso + 1)}
                className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold"
              >
                Siguiente →
              </button>
            ) : (
              <button
                type="submit"
                className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2"
              >
                <CheckCircle size={16} />
                Enviar para verificación
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
