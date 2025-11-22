import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Login from '@/pages/auth/Login'
import MainLayout from '@/components/layout/MainLayout'
import Dashboard from '@/pages/admin/Dashboard'
import VisitasDashboard from '@/pages/pal/VisitasDashboard'
import VisitaDetailsPage from '@/pages/pal/VisitaDetailsPage'
import ContactosPage from '@/pages/pal/ContactosPage'
import InstitucionesPagePal from '@/pages/pal/InstitucionesPage'
import FichasPage from '@/pages/pal/FichasPage'
import Usuarios from '@/pages/admin/Usuarios'
import CatalogosPage from '@/pages/admin/CatalogosPage'
import ConfiguracionesPage from '@/pages/admin/ConfiguracionesPage'
import InstitucionesPage from '@/pages/admin/InstitucionesPage'
import ReportesPage from '@/pages/admin/ReportesPage'
import OfflineFallback from "@/pages/OfflineFallback"
import { Toaster } from 'sonner'

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
        <Route path="/offline" element={<OfflineFallback />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <>
      <Routes>
        <Route path="/offline" element={<OfflineFallback />} />
        <Route path="*" element={
          <MainLayout>
            <Routes>
              {role === 'admin' ? (
                <>
                  <Route path="/admin" element={<Dashboard />} />
                  <Route path="/admin/usuarios" element={<Usuarios />} />
                  <Route path="/admin/catalogos" element={<CatalogosPage />} />
                  <Route path="/admin/instituciones" element={<InstitucionesPage />} />
                  <Route path="/admin/configuraciones" element={<ConfiguracionesPage />} />
                  <Route path="/admin/reportes" element={<ReportesPage />} />
                  <Route path="*" element={<Navigate to="/admin" replace />} />
                </>
              ) : (
                <>
                  {/* Dashboard principal: calendario de visitas */}
                  <Route path="/pal" element={<VisitasDashboard />} />
                  <Route path="/pal/calendario" element={<VisitasDashboard />} />
                  
                  {/* Detalles de visita */}
                  <Route path="/pal/visitas/:visitaId" element={<VisitaDetailsPage />} />
                  
                  {/* Otras páginas PAL */}
                  <Route path="/pal/instituciones" element={<InstitucionesPagePal />} />
                  <Route path="/pal/contactos" element={<ContactosPage />} />
                  <Route path="/pal/fichas" element={<FichasPage />} />
                  
                  {/* Redirect por defecto al calendario */}
                  <Route path="*" element={<Navigate to="/pal" replace />} />
                </>
              )}
            </Routes>
          </MainLayout>
        } />
      </Routes>
      <Toaster />
    </>
  )
}

export default App