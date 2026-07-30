import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import PageLoader from './components/PageLoader'

const Home = lazy(() => import('./pages/Home'))
const PropertyDetail = lazy(() => import('./pages/PropertyDetail'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const PublishProperty = lazy(() => import('./pages/PublishProperty'))
const MyProperties = lazy(() => import('./pages/MyProperties'))
const Solicitudes = lazy(() => import('./pages/Solicitudes'))
const Contratos = lazy(() => import('./pages/Contratos'))
const AdminPanel = lazy(() => import('./pages/AdminPanel'))

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/inmueble/:id" element={<PropertyDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Register />} />

            {/* Rutas Protegidas por Rol */}
            <Route
              path="/publicar"
              element={
                <ProtectedRoute allowedRoles={['arrendador']}>
                  <PublishProperty />
                </ProtectedRoute>
              }
            />
            <Route
              path="/publicar/:id"
              element={
                <ProtectedRoute allowedRoles={['arrendador']}>
                  <PublishProperty />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mis-propiedades"
              element={
                <ProtectedRoute allowedRoles={['arrendador']}>
                  <MyProperties />
                </ProtectedRoute>
              }
            />

            {/* Módulo 3: Gestión de Contratos */}
            <Route
              path="/solicitudes"
              element={
                <ProtectedRoute allowedRoles={['arrendador', 'arrendatario']}>
                  <Solicitudes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contratos"
              element={
                <ProtectedRoute allowedRoles={['arrendador', 'arrendatario']}>
                  <Contratos />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
