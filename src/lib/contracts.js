import { supabase } from './supabase'

// Suma meses a una fecha (YYYY-MM-DD) y devuelve la fecha resultante ISO.
function sumarMeses(fechaISO, meses) {
  const d = new Date(fechaISO)
  d.setMonth(d.getMonth() + Number(meses || 0))
  return d.toISOString().slice(0, 10)
}

// ---------------------------------------------------------------------------
// RF-06 — El arrendatario envía una solicitud de arriendo
// ---------------------------------------------------------------------------

/**
 * Crea una solicitud de arriendo para una propiedad.
 * @param {object} propiedad - fila de la tabla propiedades (real, con UUID)
 * @param {object} arrendatario - { id, nombre, email, telefono, rol }
 * @param {object} datos - { fecha_inicio, meses, mensaje }
 */
export async function createSolicitud(propiedad, arrendatario, datos) {
  if (!arrendatario?.id) {
    throw new Error('Debes iniciar sesión como arrendatario para enviar una solicitud.')
  }

  if (arrendatario.rol && arrendatario.rol !== 'arrendatario') {
    throw new Error('Solo los arrendatarios pueden enviar solicitudes de arriendo.')
  }

  if (!propiedad?._real && !String(propiedad?.id || '').includes('-')) {
    throw new Error('Solo se pueden solicitar inmuebles registrados en la plataforma.')
  }

  if (propiedad.estado && propiedad.estado !== 'disponible') {
    throw new Error('Este inmueble no está disponible para recibir solicitudes.')
  }

  if (propiedad.disponible === false) {
    throw new Error('Este inmueble no está disponible para recibir solicitudes.')
  }

  const existente = await solicitudExistente(propiedad.id, arrendatario.id)
  if (existente) {
    throw new Error('Ya tienes una solicitud pendiente o aprobada para este inmueble.')
  }

  const registro = {
    propiedad_id: propiedad.id,
    arrendador_id: propiedad.arrendador_id || null,
    arrendatario_id: arrendatario.id || null,

    propiedad_titulo: propiedad.titulo,
    propiedad_ciudad: propiedad.ciudad,
    propiedad_sector: propiedad.sector,
    precio: propiedad.precio,
    arrendador_nombre: propiedad.arrendador_nombre || null,

    arrendatario_nombre: arrendatario.nombre || null,
    arrendatario_email: arrendatario.email || null,
    arrendatario_telefono: arrendatario.telefono || null,

    mensaje: datos.mensaje || null,
    fecha_inicio: datos.fecha_inicio || null,
    meses: Number(datos.meses) || propiedad.min_meses || 3,
    estado: 'pendiente',
  }

  const { data, error } = await supabase
    .from('solicitudes')
    .insert(registro)
    .select()
    .single()
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

  const { data: existente, error: errExistente } = await supabase
    .from('contratos')
    .select('*')
    .eq('solicitud_id', solicitud.id)
    .maybeSingle()
  if (errExistente) throw errExistente
  if (existente) return existente

  const fechaInicio = solicitud.fecha_inicio || new Date().toISOString().slice(0, 10)
  const fechaFin = sumarMeses(fechaInicio, solicitud.meses)

  const contrato = {
    solicitud_id: solicitud.id,
    propiedad_id: solicitud.propiedad_id,
    arrendador_id: solicitud.arrendador_id,
    arrendatario_id: solicitud.arrendatario_id,

    propiedad_titulo: solicitud.propiedad_titulo,
    propiedad_ciudad: solicitud.propiedad_ciudad,
    propiedad_sector: solicitud.propiedad_sector,
    arrendador_nombre: solicitud.arrendador_nombre,
    arrendatario_nombre: solicitud.arrendatario_nombre,
    arrendatario_email: solicitud.arrendatario_email,
    precio_mensual: solicitud.precio,
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
    meses: solicitud.meses,
    estado: 'vigente',
  }

  // 1) Crear la ficha del contrato
  const { data: contratoCreado, error: errContrato } = await supabase
    .from('contratos')
    .insert(contrato)
    .select()
    .single()
  if (errContrato) throw errContrato

  // 2) Marcar la solicitud como aprobada
  const { error: errSol } = await supabase
    .from('solicitudes')
    .update({ estado: 'aprobada', respuesta: 'Solicitud aprobada. Se generó la ficha digital del contrato.' })
    .eq('id', solicitud.id)
  if (errSol) throw errSol

  // 3) Rechazar las otras solicitudes pendientes del mismo inmueble.
  if (solicitud.propiedad_id) {
    const { error: errOtras } = await supabase
      .from('solicitudes')
      .update({
        estado: 'rechazada',
        respuesta: 'El inmueble ya fue asignado a otra solicitud aprobada.',
      })
      .eq('propiedad_id', solicitud.propiedad_id)
      .eq('estado', 'pendiente')
      .neq('id', solicitud.id)
    if (errOtras) throw errOtras
  }

  // 4) La propiedad pasa a 'arrendada'
  if (solicitud.propiedad_id) {
    const { error: errPropiedad } = await supabase
      .from('propiedades')
      .update({ estado: 'arrendada' })
      .eq('id', solicitud.propiedad_id)
    if (errPropiedad) throw errPropiedad
  }

  return contratoCreado
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

  const { data, error } = await supabase
    .from('solicitudes')
    .update({ estado: 'rechazada', respuesta: respuesta || 'Solicitud rechazada por el arrendador.' })
    .eq('id', id)
    .select()
    .single()
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
    .from('contratos')
    .update({ estado: 'finalizado' })
    .eq('id', contrato.id)
    .select()
    .single()
  if (error) throw error

  if (contrato.propiedad_id) {
    const { error: errPropiedad } = await supabase
      .from('propiedades')
      .update({ estado: 'disponible' })
      .eq('id', contrato.propiedad_id)
    if (errPropiedad) throw errPropiedad
  }
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
