import { supabase } from './supabase'

// ---------------------------------------------------------------------------
// RF-06 — El arrendatario envía una solicitud de arriendo
// ---------------------------------------------------------------------------

/**
 * Crea una solicitud de arriendo para una propiedad.
 * @param {object} propiedad - inmueble público (real, con UUID)
 * @param {object} datos - { fecha_inicio, meses, mensaje }
 */
export async function createSolicitud(propiedad, datos) {
  const { data, error } = await supabase
    .rpc('crear_solicitud', {
      p_propiedad_id: propiedad.id,
      p_fecha_inicio: datos.fecha_inicio || null,
      p_meses: Number(datos.meses) || propiedad.min_meses || 3,
      p_mensaje: datos.mensaje || null,
    })
  if (error) throw error
  return data
}

/** ¿El arrendatario ya tiene una solicitud pendiente/aprobada para esta propiedad? */
export async function solicitudExistente(propiedadId, arrendatarioId) {
  const { data, error } = await supabase
    .from('solicitudes')
    .select('id, estado')
    .eq('propiedad_id', propiedadId)
    .eq('arrendatario_id', arrendatarioId)
    .in('estado', ['pendiente', 'aprobada'])
    .maybeSingle()
  if (error) throw error
  return data
}

// ---------------------------------------------------------------------------
// Listados de solicitudes
// ---------------------------------------------------------------------------

/** Solicitudes recibidas por un arrendador (dueño). */
export async function listSolicitudesRecibidas(arrendadorId) {
  const { data, error } = await supabase
    .from('solicitudes')
    .select('*')
    .eq('arrendador_id', arrendadorId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

/** Solicitudes enviadas por un arrendatario. */
export async function listMisSolicitudes(arrendatarioId) {
  const { data, error } = await supabase
    .from('solicitudes')
    .select('*')
    .eq('arrendatario_id', arrendatarioId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

// ---------------------------------------------------------------------------
// RF-07 — El arrendador aprueba/rechaza y genera la ficha del contrato
// ---------------------------------------------------------------------------

/**
 * Aprueba una solicitud: crea el contrato (ficha digital), marca la solicitud
 * como aprobada y pone la propiedad en estado 'arrendada'.
 * @returns {object} el contrato creado
 */
export async function aprobarSolicitud(solicitud) {
  const { data, error } = await supabase
    .rpc('aprobar_solicitud', { p_solicitud_id: solicitud.id })
  if (error) throw error
  return data
}

/** Rechaza una solicitud, con nota opcional. */
export async function rechazarSolicitud(id, respuesta = null) {
  const { data, error } = await supabase
    .rpc('rechazar_solicitud', {
      p_solicitud_id: id,
      p_respuesta: respuesta,
    })
  if (error) throw error
  return data
}

// ---------------------------------------------------------------------------
// RF-08 — Historial contractual (vigentes y finalizados) para ambos roles
// ---------------------------------------------------------------------------

/**
 * Lista los contratos de un usuario según su rol.
 * @param {'arrendador'|'arrendatario'} rol
 * @param {string} userId - auth.uid
 */
export async function listContratos(rol, userId) {
  const columna = rol === 'arrendador' ? 'arrendador_id' : 'arrendatario_id'
  const { data, error } = await supabase
    .from('contratos')
    .select('*')
    .eq(columna, userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

/**
 * Finaliza un contrato vigente y libera la propiedad (vuelve a 'disponible').
 */
export async function finalizarContrato(contrato) {
  const { data, error } = await supabase
    .rpc('finalizar_contrato', { p_contrato_id: contrato.id })
  if (error) throw error
  return data
}
