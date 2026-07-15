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
export async function aprobarSolicitud(solicitud) {
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
    .update({ estado: 'aprobada' })
    .eq('id', solicitud.id)
  if (errSol) throw errSol

  // 3) La propiedad pasa a 'arrendada'
  if (solicitud.propiedad_id) {
    await supabase
      .from('propiedades')
      .update({ estado: 'arrendada' })
      .eq('id', solicitud.propiedad_id)
  }

  return contratoCreado
}

/** Rechaza una solicitud, con nota opcional. */
export async function rechazarSolicitud(id, respuesta = null) {
  const { data, error } = await supabase
    .from('solicitudes')
    .update({ estado: 'rechazada', respuesta })
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
    .from('contratos')
    .update({ estado: 'finalizado' })
    .eq('id', contrato.id)
    .select()
    .single()
  if (error) throw error

  if (contrato.propiedad_id) {
    await supabase
      .from('propiedades')
      .update({ estado: 'disponible' })
      .eq('id', contrato.propiedad_id)
  }
  return data
}
