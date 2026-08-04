import { useCallback, useMemo, useState } from 'react'

const INITIAL_FILTERS = {
  busqueda: '',
  ciudad: '',
  tipo: '',
  precioMin: '',
  precioMax: '',
  servicios: [],
  soloDisponibles: true,
}

function normalizarTexto(valor) {
  return String(valor ?? '')
    .trim()
    .toLocaleLowerCase('es')
}

function normalizarServicios(servicios) {
  if (Array.isArray(servicios)) {
    return servicios
      .map(normalizarTexto)
      .filter(Boolean)
  }

  if (typeof servicios === 'string') {
    return servicios
      .split(',')
      .map(normalizarTexto)
      .filter(Boolean)
  }

  return []
}

export function usePropertyFilters(properties) {
  const [filters, setFilters] = useState(INITIAL_FILTERS)

  const updateFilter = useCallback((name, value) => {
    setFilters((current) => ({
      ...current,
      [name]: value,
    }))
  }, [])

  const toggleService = useCallback((service) => {
    setFilters((current) => {
      const selected = current.servicios.includes(service)

      return {
        ...current,
        servicios: selected
          ? current.servicios.filter((item) => item !== service)
          : [...current.servicios, service],
      }
    })
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      ...INITIAL_FILTERS,
      servicios: [],
    })
  }, [])

  const filteredProperties = useMemo(() => {
    const query = normalizarTexto(filters.busqueda)

    const precioMinimo =
      filters.precioMin === '' ? null : Number(filters.precioMin)

    const precioMaximo =
      filters.precioMax === '' ? null : Number(filters.precioMax)

    return properties.filter((property) => {
      if (filters.soloDisponibles && !property.disponible) {
        return false
      }

      if (filters.ciudad && property.ciudad !== filters.ciudad) {
        return false
      }

      if (filters.tipo && property.tipo !== filters.tipo) {
        return false
      }

      const precioPropiedad = Number(property.precio)

      if (
        precioMinimo !== null &&
        Number.isFinite(precioMinimo) &&
        (!Number.isFinite(precioPropiedad) ||
          precioPropiedad < precioMinimo)
      ) {
        return false
      }

      if (
        precioMaximo !== null &&
        Number.isFinite(precioMaximo) &&
        (!Number.isFinite(precioPropiedad) ||
          precioPropiedad > precioMaximo)
      ) {
        return false
      }

      if (filters.servicios.length > 0) {
        const serviciosPropiedad = normalizarServicios(
          property.servicios,
        )

        const cumpleServicios = filters.servicios.every((service) =>
          serviciosPropiedad.includes(normalizarTexto(service)),
        )

        if (!cumpleServicios) {
          return false
        }
      }

      if (query) {
        const camposBusqueda = [
          property.title,
          property.titulo,
          property.sector,
          property.ciudad,
          property.tipo,
        ]

        const coincide = camposBusqueda.some((value) =>
          normalizarTexto(value).includes(query),
        )

        if (!coincide) {
          return false
        }
      }

      return true
    })
  }, [filters, properties])

  const hasActiveFilters = Boolean(
    filters.busqueda ||
      filters.ciudad ||
      filters.tipo ||
      filters.precioMin ||
      filters.precioMax ||
      filters.servicios.length > 0 ||
      !filters.soloDisponibles,
  )

  return {
    filters,
    filteredProperties,
    hasActiveFilters,
    updateFilter,
    toggleService,
    clearFilters,
  }
}