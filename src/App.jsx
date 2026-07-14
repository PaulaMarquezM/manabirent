import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import PropertyDetail from './pages/PropertyDetail'
import Login from './pages/Login'
import PublishProperty from './pages/PublishProperty'
import MyProperties from './pages/MyProperties'
import AdminPanel from './pages/AdminPanel'

export default function App() {
  const [user, setUser] = useState(null)

  return (
    <BrowserRouter>
      <Navbar user={user} onLogout={() => setUser(null)} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/inmueble/:id" element={<PropertyDetail />} />
        <Route path="/login" element={<Login onLogin={setUser} />} />
        <Route path="/publicar" element={<PublishProperty user={user} />} />
        <Route path="/publicar/:id" element={<PublishProperty user={user} />} />
        <Route path="/mis-propiedades" element={<MyProperties user={user} />} />
        <Route path="/admin" element={<AdminPanel user={user} />} />
      </Routes>
    </BrowserRouter>
  )
}
