import { supabase } from './supabase'

// ---------------------------------------------------------------------------
// RF-06 — El arrendatario envía una solicitud de arriendo
// ---------------------------------------------------------------------------

/**
 * Crea una solicitud de arriendo para una propiedad.
 * @param {object} propiedad - fila de la tabla propiedades (real, con UUID)
 * @param {object} arrendatario - { id, nombre, email, telefono, rol }
 * @param {object} datos - { fecha_inicio, meses, mensaje }
 */
export async function createSolicitud(propiedad, arrendatarioOrDatos, maybeDatos) {
  const datos = maybeDatos || arrendatarioOrDatos
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
    .limit(1)
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
export async function aprobarSolicitud(solicitud, arrendadorId) {
  if (!solicitud?.id) throw new Error('Solicitud inválida.')
  if (solicitud.estado !== 'pendiente') {
    throw new Error('Solo se pueden aprobar solicitudes pendientes.')
  }
  if (arrendadorId && solicitud.arrendador_id !== arrendadorId) {
    throw new Error('Solo el arrendador del inmueble puede aprobar esta solicitud.')
  }

  const { data, error } = await supabase
    .rpc('aprobar_solicitud', { p_solicitud_id: solicitud.id })
  if (error) throw error
  return data
}

/** Rechaza una solicitud, con nota opcional. */
export async function rechazarSolicitud(solicitud, respuesta = null, arrendadorId = null) {
  const id = typeof solicitud === 'string' ? solicitud : solicitud?.id
  if (!id) throw new Error('Solicitud inválida.')
  if (typeof solicitud === 'object' && solicitud.estado !== 'pendiente') {
    throw new Error('Solo se pueden rechazar solicitudes pendientes.')
  }
  if (typeof solicitud === 'object' && arrendadorId && solicitud.arrendador_id !== arrendadorId) {
    throw new Error('Solo el arrendador del inmueble puede rechazar esta solicitud.')
  }

  const { data, error } = await supabase.rpc('rechazar_solicitud', {
    p_solicitud_id: id,
    p_respuesta: respuesta || 'Solicitud rechazada por el arrendador.',
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
  if (!['arrendador', 'arrendatario'].includes(rol)) {
    throw new Error('Rol inválido para consultar contratos.')
  }
  if (!userId) {
    throw new Error('Debes iniciar sesión para consultar el historial contractual.')
  }

  const columna = rol === 'arrendador' ? 'arrendador_id' : 'arrendatario_id'
  const { data, error } = await supabase
    .from('contratos')
    .select('*')
    .eq(columna, userId)
  if (error) throw error

  return (data || []).sort((a, b) => {
    const fechaA = a.created_at || a.fecha_inicio || ''
    const fechaB = b.created_at || b.fecha_inicio || ''
    return String(fechaB).localeCompare(String(fechaA))
  })
}

/**
 * Finaliza un contrato vigente y libera la propiedad (vuelve a 'disponible').
 */
export async function finalizarContrato(contrato) {
  if (!contrato?.id) throw new Error('Contrato inválido.')
  if (contrato.estado !== 'vigente') {
    throw new Error('Solo se pueden finalizar contratos vigentes.')
  }

  const { data, error } = await supabase
    .rpc('finalizar_contrato', { p_contrato_id: contrato.id })
  if (error) throw error
  return data
}

// ---------------------------------------------------------------------------
// RF-09 — Reporte de incidencias de mantenimiento
// ---------------------------------------------------------------------------

/**
 * Lista las incidencias registradas por un arrendatario.
 */
export async function listIncidenciasArrendatario(arrendatarioId) {
  if (!arrendatarioId) {
    throw new Error('Debes iniciar sesión para consultar tus reportes.')
  }

  const { data, error } = await supabase
    .from('incidencias')
    .select('*')
    .eq('arrendatario_id', arrendatarioId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

/**
 * Lista las incidencias recibidas por el arrendador de los inmuebles.
 */
export async function listIncidenciasArrendador(arrendadorId) {
  if (!arrendadorId) {
    throw new Error('Debes iniciar sesión para consultar las incidencias recibidas.')
  }

  const { data, error } = await supabase
    .from('incidencias')
    .select('*')
    .eq('arrendador_id', arrendadorId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

/**
 * Recupera la trazabilidad de una lista de incidencias. RLS limita los
 * resultados a las incidencias donde el usuario es arrendador o arrendatario.
 */
export async function listHistorialIncidencias(incidenciaIds) {
  const ids = [...new Set((incidenciaIds || []).filter(Boolean))]
  if (ids.length === 0) return []

  const { data, error } = await supabase
    .from('incidencias_historial')
    .select('*')
    .in('incidencia_id', ids)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

/**
 * RF-10: actualiza el estado mediante una RPC segura. La base registra el
 * cambio en incidencias_historial dentro de la misma transacción.
 */
export async function actualizarEstadoIncidencia(incidencia, estado, comentario = '') {
  if (!incidencia?.id) throw new Error('Incidencia inválida.')
  if (!['reportada', 'en_proceso', 'resuelta'].includes(estado)) {
    throw new Error('Estado de incidencia inválido.')
  }
  if (incidencia.estado === estado) {
    throw new Error('Selecciona un estado diferente al actual.')
  }

  const { data, error } = await supabase.rpc('actualizar_estado_incidencia', {
    p_incidencia_id: incidencia.id,
    p_estado: estado,
    p_comentario: comentario.trim() || null,
  })
  if (error) throw error
  return data
}

/**
 * Registra un reporte de falla o solicitud de mantenimiento asociado a un
 * contrato activo del arrendatario.
 */
export async function createIncidencia(contrato, arrendatario, datos) {
  if (!arrendatario?.id) {
    throw new Error('Debes iniciar sesión como arrendatario para registrar una incidencia.')
  }

  if (arrendatario.rol && arrendatario.rol !== 'arrendatario') {
    throw new Error('Solo los arrendatarios pueden registrar incidencias.')
  }

  if (!contrato?.id) {
    throw new Error('Selecciona un contrato válido.')
  }

  if (contrato.estado !== 'vigente') {
    throw new Error('Solo se pueden reportar incidencias sobre contratos vigentes.')
  }

  if (contrato.arrendatario_id !== arrendatario.id) {
    throw new Error('No puedes reportar incidencias sobre contratos de otro usuario.')
  }

  const registro = {
    contrato_id: contrato.id,
    propiedad_id: contrato.propiedad_id || null,
    arrendador_id: contrato.arrendador_id || null,
    arrendatario_id: arrendatario.id,

    propiedad_titulo: contrato.propiedad_titulo || null,
    propiedad_ciudad: contrato.propiedad_ciudad || null,
    propiedad_sector: contrato.propiedad_sector || null,
    arrendador_nombre: contrato.arrendador_nombre || null,
    arrendatario_nombre: arrendatario.nombre || contrato.arrendatario_nombre || null,
    arrendatario_email: arrendatario.email || contrato.arrendatario_email || null,

    categoria: datos.categoria,
    prioridad: datos.prioridad,
    titulo: datos.titulo?.trim(),
    descripcion: datos.descripcion?.trim(),
    estado: 'reportada',
  }

  const { data, error } = await supabase
    .from('incidencias')
    .insert(registro)
    .select()
    .single()
  if (error) throw error
  return data
}
