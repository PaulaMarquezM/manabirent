import { Link } from 'react-router-dom'
import { MapPin, Star, CheckCircle, Clock } from 'lucide-react'

const tipoLabel = {
  habitacion: 'Habitación',
  departamento: 'Departamento',
  suite: 'Suite',
  casa: 'Casa',
}

const tipoColor = {
  habitacion: 'bg-green-100 text-green-700',
  departamento: 'bg-blue-100 text-blue-700',
  suite: 'bg-purple-100 text-purple-700',
  casa: 'bg-orange-100 text-orange-700',
}

export default function PropertyCard({ property }) {
  return (
    <Link to={`/inmueble/${property.id}`} className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="relative h-48 overflow-hidden">
        <img
          src={property.fotos[0]}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {!property.disponible && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">No disponible</span>
          </div>
        )}
        <span className={`absolute top-3 left-3 text-xs font-semibold px-2 py-1 rounded-full ${tipoColor[property.tipo]}`}>
          {tipoLabel[property.tipo]}
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-800 text-sm leading-tight mb-2 line-clamp-2 group-hover:text-primary-600">
          {property.title}
        </h3>

        <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
          <MapPin size={12} />
          <span>{property.sector}, {property.ciudad}</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xl font-bold text-primary-700">${property.precio}</span>
            <span className="text-gray-400 text-xs">/mes</span>
          </div>

          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1 text-amber-500">
              <Star size={12} fill="currentColor" />
              <span className="text-xs font-semibold text-gray-700">{property.calificacion}</span>
              <span className="text-xs text-gray-400">({property.num_resenas})</span>
            </div>
            {property.arrendador.verificado && (
              <div className="flex items-center gap-1 text-green-600 text-xs">
                <CheckCircle size={11} />
                <span>Verificado</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1 text-gray-400 text-xs">
          <Clock size={11} />
          <span>Mín. {property.min_meses} {property.min_meses === 1 ? 'mes' : 'meses'}</span>
        </div>
      </div>
    </Link>
  )
}
