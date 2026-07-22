import { supabase } from './supabase'

async function consultar(tabla, orden = 'created_at') {
  const { data, error } = await supabase.from(tabla).select('*').order(orden, { ascending: false })
  if (error) throw error
  return data || []
}

export async function cargarPanelMunicipal() {
  const [propiedades, contratos, incidencias, perfiles] = await Promise.all([
    consultar('propiedades'),
    consultar('contratos'),
    consultar('incidencias'),
    consultar('perfiles'),
  ])

  return { propiedades, contratos, incidencias, perfiles }
}

export async function actualizarPublicacion(id, activa, administradorId, motivo = '') {
  const { data, error } = await supabase
    .from('propiedades')
    .update({
      publicacion_activa: activa,
      motivo_moderacion: activa ? null : motivo.trim() || 'Publicación inhabilitada por el Municipio.',
      moderada_at: new Date().toISOString(),
      moderada_por: administradorId || null,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function actualizarCuenta(id, activa, administradorId, motivo = '') {
  const { data, error } = await supabase
    .from('perfiles')
    .update({
      cuenta_activa: activa,
      motivo_inhabilitacion: activa ? null : motivo.trim() || 'Cuenta inhabilitada por el Municipio.',
      moderada_at: new Date().toISOString(),
      moderada_por: administradorId || null,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function consultarCuentaActiva(userId) {
  if (!userId) return true
  const { data, error } = await supabase
    .from('perfiles')
    .select('cuenta_activa, motivo_inhabilitacion')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data || { cuenta_activa: true, motivo_inhabilitacion: null }
}
