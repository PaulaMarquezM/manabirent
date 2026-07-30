import { useEffect, useState, Suspense, lazy } from 'react'
import { Search, SlidersHorizontal, Map, Grid, X } from 'lucide-react'
import PropertyCard from '../components/PropertyCard'
import { listPublicProperties } from '../lib/properties'
import { useDisclosure } from '../hooks/useDisclosure'
import { usePropertyFilters } from '../hooks/usePropertyFilters'

const MapView = lazy(() => import('../components/MapView'))
const ciudades = ['Manta', 'Portoviejo']

export default function Home() {
  const [vista, setVista] = useState('grid')
  const [properties, setProperties] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')
  const { isOpen: mostrarFiltros, toggle: alternarFiltros } = useDisclosure()
  const {
    filters: filtros,
    filteredProperties: propiedadesFiltradas,
    hasActiveFilters: filtrosActivos,
    updateFilter: actualizarFiltro,
    clearFilters: limpiarFiltros,
  } = usePropertyFilters(properties)

  useEffect(() => {
    let activo = true
    listPublicProperties()
      .then((data) => { if (activo) setProperties(data) })
      .catch(() => {
        if (activo) setErrorCarga('No pudimos cargar los inmuebles. Intenta nuevamente.')
      })
      .finally(() => { if (activo) setCargando(false) })
    return () => { activo = false }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-800 to-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              Encuentra tu hogar en Manabí
            </h1>
            <p className="text-blue-200 text-base sm:text-lg max-w-xl mx-auto">
              Publicaciones de arriendo en Manta y Portoviejo, con verificación municipal visible cuando corresponda.
            </p>
          </div>

          {/* Barra de búsqueda */}
          <div className="max-w-2xl mx-auto">
            <div className="flex flex-col gap-2 rounded-xl bg-white p-2 shadow-lg sm:flex-row">
              <label className="flex min-h-11 min-w-0 flex-1 items-center gap-2 px-3">
                <Search size={18} className="text-gray-400" />
                <span className="sr-only">Buscar inmuebles</span>
                <input
                  type="text"
                  placeholder="Busca por sector, ciudad o tipo..."
                  className="w-full outline-none text-gray-800 text-sm"
                  value={filtros.busqueda}
                  onChange={(e) => actualizarFiltro('busqueda', e.target.value)}
                />
              </label>
              <button
                onClick={alternarFiltros}
                aria-expanded={mostrarFiltros}
                aria-controls="property-filters"
                className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${mostrarFiltros ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <SlidersHorizontal size={16} />
                Filtros
                {filtrosActivos && <span className="bg-accent-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">!</span>}
              </button>
            </div>

            {/* Filtros expandibles */}
            {mostrarFiltros && (
              <div id="property-filters" className="mt-2 rounded-xl border border-gray-100 bg-white p-4 shadow-lg">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label htmlFor="filter-city" className="text-xs text-gray-500 font-medium block mb-1">Ciudad</label>
                    <select
                      id="filter-city"
                      value={filtros.ciudad}
                      onChange={(e) => actualizarFiltro('ciudad', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-primary-500"
                    >
                      <option value="">Todas</option>
                      {ciudades.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="filter-type" className="text-xs text-gray-500 font-medium block mb-1">Tipo</label>
                    <select
                      id="filter-type"
                      value={filtros.tipo}
                      onChange={(e) => actualizarFiltro('tipo', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-primary-500"
                    >
                      <option value="">Todos</option>
                      <option value="habitacion">Habitación</option>
                      <option value="departamento">Departamento</option>
                      <option value="suite">Suite</option>
                      <option value="casa">Casa</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="filter-price" className="text-xs text-gray-500 font-medium block mb-1">Precio máx. ($/mes)</label>
                    <input
                      id="filter-price"
                      type="number"
                      placeholder="Ej: 400"
                      value={filtros.precioMax}
                      onChange={(e) => actualizarFiltro('precioMax', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-primary-500"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filtros.soloDisponibles}
                      onChange={(e) => actualizarFiltro('soloDisponibles', e.target.checked)}
                      className="rounded text-primary-600"
                    />
                    Solo disponibles
                  </label>
                  {filtrosActivos && (
                    <button onClick={limpiarFiltros} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
                      <X size={12} /> Limpiar filtros
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <p className="text-gray-500 text-sm">
            <span className="font-semibold text-gray-800">{propiedadesFiltradas.length}</span> inmuebles encontrados
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVista('grid')}
              aria-label="Ver resultados en cuadrícula"
              aria-pressed={vista === 'grid'}
              className={`p-2 rounded-lg ${vista === 'grid' ? 'bg-primary-100 text-primary-700' : 'text-gray-400 hover:bg-gray-100'}`}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setVista('mapa')}
              aria-label="Ver resultados en el mapa"
              aria-pressed={vista === 'mapa'}
              className={`p-2 rounded-lg ${vista === 'mapa' ? 'bg-primary-100 text-primary-700' : 'text-gray-400 hover:bg-gray-100'}`}
            >
              <Map size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {cargando ? (
          <div className="py-16 text-center text-gray-400">Cargando inmuebles...</div>
        ) : errorCarga ? (
          <div className="py-16 text-center text-red-600">{errorCarga}</div>
        ) : vista === 'grid' ? (
          propiedadesFiltradas.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {propiedadesFiltradas.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <Search size={40} className="mx-auto mb-3 opacity-40" />
              <p className="text-lg font-medium text-gray-600">Sin resultados</p>
              <p className="text-sm">Intenta con otros filtros</p>
              <button onClick={limpiarFiltros} className="mt-4 text-primary-600 text-sm underline">Limpiar búsqueda</button>
            </div>
          )
        ) : (
          <div className="h-[420px] overflow-hidden rounded-xl shadow-md sm:h-[520px] lg:h-[600px]">
            <Suspense fallback={<div className="h-full bg-gray-100 flex items-center justify-center text-gray-400">Cargando mapa...</div>}>
              <MapView properties={propiedadesFiltradas} />
            </Suspense>
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="bg-primary-800 text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-accent-500">{properties.length}</div>
            <div className="text-blue-200 text-sm mt-1">Inmuebles publicados</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-accent-500">2</div>
            <div className="text-blue-200 text-sm mt-1">Ciudades: Manta y Portoviejo</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-accent-500">0</div>
            <div className="text-blue-200 text-sm mt-1">Estafas reportadas en la plataforma</div>
          </div>
        </div>
        <div className="border-t border-primary-600 text-center text-blue-300 text-xs py-4 px-4">
          ManabíRent — Prefectura de Manabí · PUCE Manabí 2026 · Cumple LOPDP Ecuador
        </div>
      </div>
    </div>
  )
}
