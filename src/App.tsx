import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Login from '@/pages/auth/Login'
import MainLayout from '@/components/layout/MainLayout'
import Dashboard from '@/pages/admin/Dashboard'
import ContactosDashboard from '@/pages/pal/ContactosDashboard'
import { ContactosPage } from '@/pages/pal/ContactosPage'
import Usuarios from '@/pages/admin/Usuarios'
import CatalogosPage from '@/pages/admin/CatalogosPage'
import ConfiguracionesPage from '@/pages/admin/ConfiguracionesPage'
import { MedicosPage } from '@/pages/admin/MedicosPage'
import { PacientesPage } from '@/pages/admin/PacientesPage'
import FichasTratamientoPage from './pages/pal/FichasTratamientoPage';

function App() {
  const { user, role, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <MainLayout>
      <Routes>
        {role === 'admin' ? (
          <>
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/admin/usuarios" element={<Usuarios />} />
            <Route path="/admin/catalogos" element={<CatalogosPage />} />
            <Route path="/admin/medicos" element={<MedicosPage />} />
            <Route path="/admin/pacientes" element={<PacientesPage />} />
            <Route path="/admin/instituciones" element={<div>Instituciones (próximamente)</div>} />
            <Route path="/admin/configuraciones" element={<ConfiguracionesPage />} />
            <Route path="/admin/reportes" element={<div>Reportes (próximamente)</div>} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </>
        ) : (
          <>
            <Route path="/fichas-tratamiento" element={<FichasTratamientoPage />} />
            <Route path="/pal/contactos" element={<ContactosPage />} />
            <Route path="/pal/dashboard" element={<ContactosDashboard />} />
            <Route path="/pal/instituciones" element={<div>Instituciones (próximamente)</div>} />
            <Route path="/pal/fichas" element={<div>Fichas (próximamente)</div>} />
            <Route path="*" element={<Navigate to="/pal/contactos" replace />} />
          </>
        )}
      </Routes>
    </MainLayout>
  )
}

export default App