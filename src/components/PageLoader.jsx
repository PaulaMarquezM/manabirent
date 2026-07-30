export default function PageLoader({ label = 'Cargando contenido...' }) {
  return (
    <div
      className="min-h-[50vh] flex items-center justify-center px-4 text-sm text-gray-500"
      role="status"
      aria-live="polite"
    >
      <span className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-primary-200 border-t-primary-700" />
      {label}
    </div>
  )
}
