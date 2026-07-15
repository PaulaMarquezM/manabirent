import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import PropertyDetail from './pages/PropertyDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import PublishProperty from './pages/PublishProperty'
import MyProperties from './pages/MyProperties'
import Solicitudes from './pages/Solicitudes'
import Contratos from './pages/Contratos'
import AdminPanel from './pages/AdminPanel'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
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
      </BrowserRouter>
    </AuthProvider>
  )
}
