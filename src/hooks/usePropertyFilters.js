import { useCallback, useMemo, useState } from 'react'

const INITIAL_FILTERS = {
  busqueda: '',
  ciudad: '',
  tipo: '',
  precioMax: '',
  soloDisponibles: true,
}

export function usePropertyFilters(properties) {
  const [filters, setFilters] = useState(INITIAL_FILTERS)

  const updateFilter = useCallback((name, value) => {
    setFilters((current) => ({ ...current, [name]: value }))
  }, [])

  const clearFilters = useCallback(() => setFilters(INITIAL_FILTERS), [])

  const filteredProperties = useMemo(() => {
    const query = filters.busqueda.trim().toLocaleLowerCase('es')

    return properties.filter((property) => {
      if (filters.soloDisponibles && !property.disponible) return false
      if (filters.ciudad && property.ciudad !== filters.ciudad) return false
      if (filters.tipo && property.tipo !== filters.tipo) return false
      if (filters.precioMax && property.precio > Number(filters.precioMax)) return false

      if (query) {
        return [property.title, property.sector, property.ciudad]
          .some((value) => value.toLocaleLowerCase('es').includes(query))
      }

      return true
    })
  }, [filters, properties])

  const hasActiveFilters = Boolean(
    filters.ciudad || filters.tipo || filters.precioMax || !filters.soloDisponibles,
  )

  return {
    filters,
    filteredProperties,
    hasActiveFilters,
    updateFilter,
    clearFilters,
  }
}
