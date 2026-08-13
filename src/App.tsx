import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Login from '@/pages/auth/Login'
import MainLayout from '@/components/layout/MainLayout'
import Dashboard from '@/pages/admin/Dashboard'
import PalDashboard from '@/pages/pal/PalDashboard'
import VisitasAgenda from '@/pages/pal/VisitasAgenda'
import VisitasDia from '@/pages/pal/VisitasDia'
import VisitaDetailsPage from '@/pages/pal/VisitaDetailsPage'
import ContactosPage from '@/pages/pal/ContactosPage'
import InstitucionesPagePal from '@/pages/pal/InstitucionesPage'
import ActividadesPage from '@/pages/pal/ActividadesPage'
import PacientesPage from '@/pages/pal/PacientesPage'
import FechasTratamientoPage  from '@/pages/pal/FechasTratamientoPage'
import FichasPage from '@/pages/pal/FichasPage'
import Usuarios from '@/pages/admin/Usuarios'
import CatalogosPage from '@/pages/admin/CatalogosPage'
import ConfiguracionesPage from '@/pages/admin/ConfiguracionesPage'
import InstitucionesPage from '@/pages/admin/InstitucionesPage'
import ReportesPage from '@/pages/admin/ReportesPage'
import AdminAgendaPage from '@/pages/admin/AdminAgendaPage'
import AdminVisitasPage from '@/pages/admin/AdminVisitasPage'
import AdminActividadesPage from '@/pages/admin/AdminActividadesPage'
import AdminPacientesPage from '@/pages/admin/AdminPacientesPage'
import AdminVisitaDetailPage from '@/pages/admin/AdminVisitaDetailPage'
import AdminUsuarioDetailPage from '@/pages/admin/AdminUsuarioDetailPage'
import AdminInstitucionDetailPage from '@/pages/admin/AdminInstitucionDetailPage'
import AdminLogsPage from '@/pages/admin/AdminLogsPage'
import MantenimientoPage from '@/pages/admin/MantenimientoPage'
import FusionarInstitucionesPage from '@/pages/admin/FusionarInstitucionesPage'
import RepararCoordenadasPage from '@/pages/admin/RepararCoordenadasPage'
import AdminTicketsPage from '@/pages/admin/AdminTicketsPage'
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
                  <Route path="/admin/agenda" element={<AdminAgendaPage />} />
                  <Route path="/admin/visitas" element={<AdminVisitasPage />} />
                  <Route path="/admin/visitas/:visitaId" element={<AdminVisitaDetailPage />} />
                  <Route path="/admin/actividades" element={<AdminActividadesPage />} />
                  <Route path="/admin/pacientes" element={<AdminPacientesPage />} />
                  <Route path="/admin/usuarios" element={<Usuarios />} />
                  <Route path="/admin/usuarios/:userId" element={<AdminUsuarioDetailPage />} />
                  <Route path="/admin/instituciones/:institucionId" element={<AdminInstitucionDetailPage />} />
                  <Route path="/admin/catalogos" element={<CatalogosPage />} />
                  <Route path="/admin/instituciones" element={<InstitucionesPage />} />
                  <Route path="/admin/configuraciones" element={<ConfiguracionesPage />} />
                  <Route path="/admin/reportes" element={<ReportesPage />} />
                  <Route path="/admin/logs" element={<AdminLogsPage />} />
                  <Route path="/admin/tickets" element={<AdminTicketsPage />} />
                  <Route path="/admin/mantenimiento" element={<MantenimientoPage />} />
                  <Route path="/admin/mantenimiento/fusionar" element={<FusionarInstitucionesPage />} />
                  <Route path="/admin/mantenimiento/coordenadas" element={<RepararCoordenadasPage />} />
                  <Route path="*" element={<Navigate to="/admin" replace />} />
                </>
              ) : (
                <>
                  {/* Dashboard principal: vista de bienvenida */}
                  <Route path="/pal" element={<PalDashboard />} />
                  
                  {/* Agenda: calendario de visitas */}
                  <Route path="/pal/calendario" element={<VisitasAgenda />} />
                  
                  {/* Vista de día específico */}
                  <Route path="/pal/visitas-dia/:fecha" element={<VisitasDia />} />
                  
                  {/* Detalles de visita simplificado */}
                  <Route path="/pal/visitas/:visitaId" element={<VisitaDetailsPage />} />
                  
                  {/* Nuevas páginas del dashboard */}
                  <Route path="/pal/actividades" element={<ActividadesPage />} />
                  <Route path="/pal/pacientes" element={<PacientesPage />} />
                  <Route path="/pal/pacientes/:fichaId/fechas" element={<FechasTratamientoPage />} />
                  
                  {/* Otras páginas PAL existentes */}
                  <Route path="/pal/instituciones" element={<InstitucionesPagePal />} />
                  <Route path="/pal/contactos" element={<ContactosPage />} />
                  <Route path="/pal/fichas" element={<FichasPage />} />
                  
                  {/* Redirect por defecto al dashboard principal */}
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