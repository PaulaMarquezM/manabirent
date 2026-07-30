import { supabase, FOTOS_BUCKET } from './supabase'

// Coordenadas aproximadas del centro de cada ciudad, usadas como valor por
// defecto cuando el formulario no captura una ubicación exacta en el mapa.
const CENTRO_CIUDAD = {
  Manta: { lat: -0.9677, lng: -80.7089 },
  Portoviejo: { lat: -1.0546, lng: -80.4545 },
}

// Deriva el flag booleano `disponible` (que consumen Home/PropertyCard) a
// partir del campo `estado`, para no romper esos componentes.
function conDisponible(row) {
  if (!row) return row
  return { ...row, disponible: row.estado === 'disponible' }
}

/** Adapta una fila segura de Supabase al formato visual de la aplicación. */
export function normalizeProperty(row) {
  if (!row) return row
  return {
    ...conDisponible(row),
    title: row.titulo,
    fotos: row.fotos || [],
    calificacion: 0,
    num_resenas: 0,
    resenas: [],
    arrendador: {
      nombre: row.arrendador_nombre || 'Arrendador',
      telefono: '',
      verificado: row.verificacion === 'aprobada',
      miembro_desde: row.created_at
        ? new Date(row.created_at).getFullYear().toString()
        : '',
    },
    _real: true,
  }
}

// ---------------------------------------------------------------------------
// Subida de fotos a Storage
// ---------------------------------------------------------------------------

/**
 * Sube una lista de File al bucket de Storage y devuelve sus URLs públicas.
 * @param {File[]} files
 * @param {string} carpeta - auth.uid del arrendador
 * @returns {Promise<string[]>}
 */
export async function uploadFotos(files, carpeta = 'anon') {
  if (!carpeta || carpeta === 'anon') {
    throw new Error('Debes iniciar sesión para subir fotografías')
  }
  const urls = []
  for (const file of files) {
    const ext = file.name.split('.').pop()
    const nombre = `${carpeta}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage
      .from(FOTOS_BUCKET)
      .upload(nombre, file, { cacheControl: '3600', upsert: false })
    if (error) throw error
    const { data } = supabase.storage.from(FOTOS_BUCKET).getPublicUrl(nombre)
    urls.push(data.publicUrl)
  }
  return urls
}

// ---------------------------------------------------------------------------
// CRUD de propiedades (RF-04)
// ---------------------------------------------------------------------------

/** Lista propiedades, opcionalmente filtradas por arrendador (email). */
export async function listProperties({ arrendadorEmail } = {}) {
  let query = supabase
    .from('propiedades')
    .select('*')
    .order('created_at', { ascending: false })

  if (arrendadorEmail) query = query.eq('arrendador_email', arrendadorEmail)

  const { data, error } = await query
  if (error) throw error
  return (data || []).map(conDisponible)
}

/** Catálogo público: usa una vista que excluye datos personales y moderación. */
export async function listPublicProperties() {
  const { data, error } = await supabase
    .from('propiedades_publicas')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(normalizeProperty)
}

/** Detalle público seguro de una propiedad disponible. */
export async function getPublicProperty(id) {
  const { data, error } = await supabase
    .from('propiedades_publicas')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return normalizeProperty(data)
}

/** Obtiene una propiedad por id. */
export async function getProperty(id) {
  const { data, error } = await supabase
    .from('propiedades')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return conDisponible(data)
}

/**
 * Crea una propiedad. Sube las fotos (File[]) a Storage antes de insertar.
 * @param {object} form - datos del formulario
 * @param {File[]} fotos - archivos de imagen a subir
 * @param {object} arrendador - { nombre, email, telefono }
 */
export async function createProperty(form, fotos = [], arrendador = {}) {
  const carpeta = arrendador.id
  const fotosUrls = fotos.length ? await uploadFotos(fotos, carpeta) : []
  const centro = CENTRO_CIUDAD[form.ciudad] || {}

  const registro = {
    titulo: form.titulo,
    tipo: form.tipo,
    ciudad: form.ciudad,
    sector: form.sector,
    precio: Number(form.precio),
    descripcion: form.descripcion,
    servicios: form.servicios || [],
    reglas: form.reglas || null,
    min_meses: Number(form.min_meses) || 3,
    lat: form.lat ?? centro.lat ?? null,
    lng: form.lng ?? centro.lng ?? null,
    fotos: fotosUrls,
    estado: 'disponible',
    verificacion: 'pendiente',
    arrendador_id: arrendador.id || null,
    arrendador_nombre: arrendador.nombre || null,
    arrendador_email: arrendador.email || null,
    arrendador_telefono: arrendador.telefono || null,
  }

  const { data, error } = await supabase
    .from('propiedades')
    .insert(registro)
    .select()
    .single()
  if (error) throw error
  return conDisponible(data)
}

/**
 * Edita una propiedad. Si `nuevasFotos` trae File[], las sube y las concatena.
 */
export async function updateProperty(id, form, nuevasFotos = [], arrendador = {}) {
  const carpeta = arrendador.id
  const nuevasUrls = nuevasFotos.length ? await uploadFotos(nuevasFotos, carpeta) : []

  const cambios = {
    titulo: form.titulo,
    tipo: form.tipo,
    ciudad: form.ciudad,
    sector: form.sector,
    precio: Number(form.precio),
    descripcion: form.descripcion,
    servicios: form.servicios || [],
    reglas: form.reglas || null,
    min_meses: Number(form.min_meses) || 3,
  }
  // Fotos existentes (URLs) que se conservan + las nuevas subidas.
  const fotosExistentes = (form.fotos || []).filter((f) => typeof f === 'string')
  cambios.fotos = [...fotosExistentes, ...nuevasUrls]

  const { data, error } = await supabase
    .from('propiedades')
    .update(cambios)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return conDisponible(data)
}

/** RF-05: cambia el estado operativo del inmueble. */
export async function setEstado(id, estado) {
  const validos = ['disponible', 'arrendada', 'mantenimiento']
  if (!validos.includes(estado)) throw new Error(`Estado inválido: ${estado}`)
  const { data, error } = await supabase
    .from('propiedades')
    .update({ estado })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return conDisponible(data)
}

/** "Deshabilitar" = ponerla en mantenimiento (soft, no borra datos). */
export async function disableProperty(id) {
  return setEstado(id, 'mantenimiento')
}

/** Elimina una propiedad definitivamente. */
export async function deleteProperty(id) {
  const { error } = await supabase.from('propiedades').delete().eq('id', id)
  if (error) throw error
}
