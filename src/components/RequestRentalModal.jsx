import { useEffect, useState } from 'react'
import { X, CheckCircle, Loader2, AlertTriangle, Send } from 'lucide-react'
import { createSolicitud, solicitudExistente } from '../lib/contracts'

export default function RequestRentalModal({ propiedad, arrendatario, onClose }) {
  const hoy = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    fecha_inicio: hoy,
    meses: String(propiedad.min_meses || 3),
    mensaje: '',
  })
  const [enviando, setEnviando] = useState(false)
  const [verificando, setVerificando] = useState(true)
  const [solicitudActiva, setSolicitudActiva] = useState(null)
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)

  useEffect(() => {
    let activo = true
    solicitudExistente(propiedad.id, arrendatario.id)
      .then((data) => {
        if (activo) setSolicitudActiva(data)
      })
      .catch((err) => {
        if (activo) setError(err.message || 'No se pudo validar si ya existe una solicitud.')
      })
      .finally(() => {
        if (activo) setVerificando(false)
      })
    return () => { activo = false }
  }, [propiedad.id, arrendatario.id])

  const enviar = async (e) => {
    e.preventDefault()
    setError('')
    if (solicitudActiva) {
      setError('Ya tienes una solicitud pendiente o aprobada para este inmueble.')
      return
    }
    setEnviando(true)
    try {
      await createSolicitud(propiedad, arrendatario, form)
      setOk(true)
    } catch (err) {
      setError(err.message || 'No se pudo enviar la solicitud.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-black/50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        {ok ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">¡Solicitud enviada!</h2>
            <p className="text-gray-500 text-sm mb-6">
              El arrendador revisará tu solicitud para <strong>{propiedad.titulo}</strong>. Podrás ver el estado en “Mis solicitudes”.
            </p>
            <button onClick={onClose} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold">
              Entendido
            </button>
          </div>
        ) : (
          <form onSubmit={enviar}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-800">Solicitar arriendo</h2>
              <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-gray-50 rounded-xl p-3 text-sm">
                <p className="font-semibold text-gray-800">{propiedad.titulo}</p>
                <p className="text-gray-500 text-xs mt-0.5">{propiedad.sector}, {propiedad.ciudad} · ${propiedad.precio}/mes</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Fecha de inicio</label>
                  <input
                    type="date"
                    required
                    min={hoy}
                    value={form.fecha_inicio}
                    onChange={(e) => setForm((f) => ({ ...f, fecha_inicio: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Meses</label>
                  <select
                    value={form.meses}
                    onChange={(e) => setForm((f) => ({ ...f, meses: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500"
                  >
                    {[3, 6, 12, 18, 24].map((m) => (
                      <option key={m} value={m} disabled={m < (propiedad.min_meses || 1)}>
                        {m} meses
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Mensaje al arrendador (opcional)</label>
                <textarea
                  rows={3}
                  value={form.mensaje}
                  onChange={(e) => setForm((f) => ({ ...f, mensaje: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 resize-none"
                  placeholder="Preséntate, cuéntale por qué te interesa el inmueble..."
                />
              </div>

              {error && (
                <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-center gap-2">
                  <AlertTriangle size={15} /> {error}
                </p>
              )}

              {solicitudActiva && (
                <p className="text-amber-700 text-sm bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center gap-2">
                  <AlertTriangle size={15} /> Ya tienes una solicitud {solicitudActiva.estado} para este inmueble.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-100">
              <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando || verificando || Boolean(solicitudActiva)}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold"
              >
                {enviando || verificando ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {verificando ? 'Validando...' : enviando ? 'Enviando...' : 'Enviar solicitud'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
