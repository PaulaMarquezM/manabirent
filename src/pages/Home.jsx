import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Grid,
  Map,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import PropertyCard from '../components/PropertyCard'
import { listPublicProperties } from '../lib/properties'
import { properties as propiedadesDemo } from '../data/mockData'
import { useDisclosure } from '../hooks/useDisclosure'
import { usePropertyFilters } from '../hooks/usePropertyFilters'

const MapView = lazy(() => import('../components/MapView'))

const ciudades = ['Manta', 'Portoviejo']

function obtenerServiciosDisponibles(properties) {
  const servicios = properties.flatMap((property) => {
    if (Array.isArray(property.servicios)) {
      return property.servicios
    }

    if (typeof property.servicios === 'string') {
      return property.servicios.split(',')
    }

    return []
  })

  return [...new Set(
    servicios
      .map((servicio) => String(servicio).trim())
      .filter(Boolean),
  )].sort((a, b) => a.localeCompare(b, 'es'))
}

export default function Home() {
  const [vista, setVista] = useState('grid')
  const [properties, setProperties] = useState([])
  const [cargando, setCargando] = useState(true)
  const errorCarga = ''
  const {
    isOpen: mostrarFiltros,
    toggle: alternarFiltros,
  } = useDisclosure()
  const {
    filters: filtros,
    filteredProperties: propiedadesFiltradas,
    hasActiveFilters: filtrosActivos,
    updateFilter: actualizarFiltro,
    toggleService: alternarServicio,
    clearFilters: limpiarFiltros,
  } = usePropertyFilters(properties)
  const serviciosDisponibles = useMemo(
    () => obtenerServiciosDisponibles(properties),
    [properties],
  )

  useEffect(() => {
    let activo = true

    listPublicProperties()
      .then((data) => {
        if (activo) setProperties(data.length > 0 ? data : propiedadesDemo)
      })
      .catch(() => {
        // Mantiene el catálogo utilizable si la base aún no tiene aplicada la
        // vista pública o los datos de demostración.
        if (activo) setProperties(propiedadesDemo)
      })
      .finally(() => {
        if (activo) {
          setCargando(false)
        }
      })

    return () => {
      activo = false
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Encabezado principal */}
      <div className="bg-gradient-to-br from-primary-800 to-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              Encuentra tu hogar en Manabí
            </h1>

            <p className="text-blue-200 text-base sm:text-lg max-w-xl mx-auto">
              Publicaciones de arriendo en Manta y Portoviejo,
              con verificación municipal visible cuando corresponda.
            </p>
          </div>

          {/* Barra de búsqueda */}
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col gap-2 rounded-xl bg-white p-2 shadow-lg sm:flex-row">
              <label className="flex min-h-11 min-w-0 flex-1 items-center gap-2 px-3">
                <Search
                  size={18}
                  className="text-gray-400"
                />

                <span className="sr-only">
                  Buscar inmuebles
                </span>

                <input
                  type="text"
                  placeholder="Busca por parroquia, ciudad o tipo..."
                  className="w-full outline-none text-gray-800 text-sm"
                  value={filtros.busqueda}
                  onChange={(event) =>
                    actualizarFiltro(
                      'busqueda',
                      event.target.value,
                    )
                  }
                />
              </label>

              <button
                type="button"
                onClick={alternarFiltros}
                aria-expanded={mostrarFiltros}
                aria-controls="property-filters"
                className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  mostrarFiltros
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <SlidersHorizontal size={16} />

                Filtros

                {filtrosActivos && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-500 px-1 text-xs text-white">
                    !
                  </span>
                )}
              </button>
            </div>

            {/* Panel de filtros */}
            {mostrarFiltros && (
              <div
                id="property-filters"
                className="mt-2 rounded-xl border border-gray-100 bg-white p-4 shadow-lg"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Ciudad */}
                  <div>
                    <label
                      htmlFor="filter-city"
                      className="mb-1 block text-xs font-medium text-gray-500"
                    >
                      Ciudad
                    </label>

                    <select
                      id="filter-city"
                      value={filtros.ciudad}
                      onChange={(event) =>
                        actualizarFiltro(
                          'ciudad',
                          event.target.value,
                        )
                      }
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-primary-500"
                    >
                      <option value="">Todas</option>

                      {ciudades.map((ciudad) => (
                        <option
                          key={ciudad}
                          value={ciudad}
                        >
                          {ciudad}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tipo */}
                  <div>
                    <label
                      htmlFor="filter-type"
                      className="mb-1 block text-xs font-medium text-gray-500"
                    >
                      Tipo
                    </label>

                    <select
                      id="filter-type"
                      value={filtros.tipo}
                      onChange={(event) =>
                        actualizarFiltro(
                          'tipo',
                          event.target.value,
                        )
                      }
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-primary-500"
                    >
                      <option value="">Todos</option>
                      <option value="habitacion">
                        Habitación
                      </option>
                      <option value="departamento">
                        Departamento
                      </option>
                      <option value="suite">
                        Suite
                      </option>
                      <option value="casa">
                        Casa
                      </option>
                    </select>
                  </div>

                  {/* Precio mínimo */}
                  <div>
                    <label
                      htmlFor="filter-min-price"
                      className="mb-1 block text-xs font-medium text-gray-500"
                    >
                      Precio mín. ($/mes)
                    </label>

                    <input
                      id="filter-min-price"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Ej: 150"
                      value={filtros.precioMin}
                      onChange={(event) =>
                        actualizarFiltro(
                          'precioMin',
                          event.target.value,
                        )
                      }
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-primary-500"
                    />
                  </div>

                  {/* Precio máximo */}
                  <div>
                    <label
                      htmlFor="filter-max-price"
                      className="mb-1 block text-xs font-medium text-gray-500"
                    >
                      Precio máx. ($/mes)
                    </label>

                    <input
                      id="filter-max-price"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Ej: 400"
                      value={filtros.precioMax}
                      onChange={(event) =>
                        actualizarFiltro(
                          'precioMax',
                          event.target.value,
                        )
                      }
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                {/* Servicios */}
                <fieldset className="mt-4 border-t border-gray-100 pt-4">
                  <legend className="mb-2 text-xs font-medium text-gray-500">
                    Servicios disponibles
                  </legend>

                  {serviciosDisponibles.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {serviciosDisponibles.map((servicio) => {
                        const seleccionado =
                          filtros.servicios.includes(servicio)

                        return (
                          <label
                            key={servicio}
                            className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-xs transition-colors ${
                              seleccionado
                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={seleccionado}
                              onChange={() =>
                                alternarServicio(servicio)
                              }
                              className="rounded text-primary-600"
                            />

                            {servicio}
                          </label>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">
                      Las propiedades publicadas todavía no tienen
                      servicios registrados.
                    </p>
                  )}
                </fieldset>

                {/* Disponibilidad y limpiar */}
                <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={filtros.soloDisponibles}
                      onChange={(event) =>
                        actualizarFiltro(
                          'soloDisponibles',
                          event.target.checked,
                        )
                      }
                      className="rounded text-primary-600"
                    />

                    Solo disponibles
                  </label>

                  {filtrosActivos && (
                    <button
                      type="button"
                      onClick={limpiarFiltros}
                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                    >
                      <X size={14} />
                      Limpiar filtros
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cantidad de resultados y tipo de vista */}
      <div className="border-b border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-800">
              {propiedadesFiltradas.length}
            </span>{' '}
            inmuebles encontrados
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setVista('grid')}
              aria-label="Ver resultados en cuadrícula"
              aria-pressed={vista === 'grid'}
              className={`rounded-lg p-2 ${
                vista === 'grid'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-400 hover:bg-gray-100'
              }`}
            >
              <Grid size={18} />
            </button>

            <button
              type="button"
              onClick={() => setVista('mapa')}
              aria-label="Ver resultados en el mapa"
              aria-pressed={vista === 'mapa'}
              className={`rounded-lg p-2 ${
                vista === 'mapa'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-400 hover:bg-gray-100'
              }`}
            >
              <Map size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Resultados */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {cargando ? (
          <div className="py-16 text-center text-gray-400">
            Cargando inmuebles...
          </div>
        ) : errorCarga ? (
          <div className="py-16 text-center text-red-600">
            {errorCarga}
          </div>
        ) : vista === 'grid' ? (
          propiedadesFiltradas.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {propiedadesFiltradas.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-gray-400">
              <Search
                size={40}
                className="mx-auto mb-3 opacity-40"
              />

              <p className="text-lg font-medium text-gray-600">
                Sin resultados
              </p>

              <p className="text-sm">
                Intenta modificar o limpiar los filtros.
              </p>

              <button
                type="button"
                onClick={limpiarFiltros}
                className="mt-4 text-sm text-primary-600 underline"
              >
                Limpiar búsqueda
              </button>
            </div>
          )
        ) : (
          <div className="h-[420px] overflow-hidden rounded-xl shadow-md sm:h-[520px] lg:h-[600px]">
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center bg-gray-100 text-gray-400">
                  Cargando mapa...
                </div>
              }
            >
              <MapView properties={propiedadesFiltradas} />
            </Suspense>
          </div>
        )}
      </div>

      {/* Información inferior */}
      <div className="mt-12 bg-primary-800 text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 gap-6 px-4 py-8 text-center sm:grid-cols-3">
          <div>
            <div className="text-3xl font-bold text-accent-500">
              {properties.length}
            </div>

            <div className="mt-1 text-sm text-blue-200">
              Inmuebles publicados
            </div>
          </div>

          <div>
            <div className="text-3xl font-bold text-accent-500">
              2
            </div>

            <div className="mt-1 text-sm text-blue-200">
              Ciudades: Manta y Portoviejo
            </div>
          </div>

          <div>
            <div className="text-3xl font-bold text-accent-500">
              0
            </div>

            <div className="mt-1 text-sm text-blue-200">
              Estafas reportadas en la plataforma
            </div>
          </div>
        </div>

        <div className="border-t border-primary-600 px-4 py-4 text-center text-xs text-blue-300">
          ManabíRent — Prefectura de Manabí · PUCE Manabí 2026 ·
          Cumple LOPDP Ecuador
        </div>
      </div>
    </div>
  )
}
