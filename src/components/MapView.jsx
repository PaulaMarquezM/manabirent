import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function MapView({ properties, center = [-1.0, -80.6], zoom = 9 }) {
  const propertiesWithLocation = properties.filter((p) => p.lat && p.lng)

  return (
    <MapContainer center={center} zoom={zoom} className="w-full h-full" style={{ minHeight: '400px' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {propertiesWithLocation.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={new L.DivIcon({
          html: `<div style="background:#1d6fa4;color:white;font-size:11px;font-weight:bold;padding:3px 7px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid white;white-space:nowrap;">$${p.precio}</div>`,
          className: '',
          iconAnchor: [25, 12],
        })}>
          <Popup>
            <div className="text-sm" style={{ minWidth: '160px' }}>
              <img src={p.fotos[0]} alt={p.title} style={{ width: '100%', height: '90px', objectFit: 'cover', borderRadius: '6px', marginBottom: '6px' }} />
              <p style={{ fontWeight: 600, marginBottom: '2px' }}>{p.title}</p>
              <p style={{ color: '#666', fontSize: '11px', marginBottom: '4px' }}>{p.sector}, {p.ciudad}</p>
              <p style={{ color: '#1d6fa4', fontWeight: 'bold', marginBottom: '6px' }}>${p.precio}/mes</p>
              <a href={`/inmueble/${p.id}`} style={{ background: '#1d6fa4', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', textDecoration: 'none' }}>Ver detalle</a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
