import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { ConnectionIndicators } from '@/components/ConnectionIndicators'
import { ContactosOffcanvas } from '@/components/contactos/ContactosOffcanvas'
import { useContactosDuplicados } from '@/hooks/useContactosDuplicados'
import { VideoPopupModal } from '@/components/VideoPopupModal'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  Settings,
  Menu,
  LogOut,
  User,
  BookOpen,
  Calendar,
  Stethoscope,
  PenTool,
  RefreshCw,
  ScrollText,
  Wrench,
  Download,
  Contact 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { APP_VERSION } from '@/lib/version'
import { BtnNotificaciones } from '@/components/admin/BtnNotificaciones'
import { BtnAyuda } from '@/components/BtnAyuda'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: ('admin' | 'pal')[]
}

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/admin', icon: LayoutDashboard, roles: ['admin'] },
  { title: 'Agenda', href: '/admin/agenda', icon: Calendar, roles: ['admin'] },
  { title: 'Actividades', href: '/admin/actividades', icon: PenTool, roles: ['admin'] },
  { title: 'Pacientes', href: '/admin/pacientes', icon: Stethoscope, roles: ['admin'] },
  { title: 'Usuarios', href: '/admin/usuarios', icon: Users, roles: ['admin'] },
  { title: 'Catálogos', href: '/admin/catalogos', icon: BookOpen, roles: ['admin'] },
  { title: 'Instituciones', href: '/admin/instituciones', icon: Building2, roles: ['admin'] },
  { title: 'Mantenimiento', href: '/admin/mantenimiento', icon: Wrench, roles: ['admin'] },
  
  { title: 'Configuraciones', href: '/admin/configuraciones', icon: Settings, roles: ['admin'] },
  { title: 'Reportes', href: '/admin/reportes', icon: FileText, roles: ['admin'] },
  { title: 'Logs', href: '/admin/logs', icon: ScrollText, roles: ['admin'] },
  { title: 'Dashboard', href: '/pal', icon: LayoutDashboard, roles: ['pal'] },
  { title: 'Agenda', href: '/pal/calendario', icon: Calendar, roles: ['pal'] },
  { title: 'Actividades', href: '/pal/actividades', icon: PenTool, roles: ['pal'] },
  { title: 'Pacientes', href: '/pal/pacientes', icon: Stethoscope, roles: ['pal'] },
]


async function forceUpdate() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    for (const registration of registrations) {
      await registration.unregister()
    }
  }
  if ('caches' in window) {
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map(name => caches.delete(name)))
  }
  window.location.reload()
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [contactosOpen, setContactosOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const { user, role, signOut, nombreCompleto } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const handleForceUpdate = async () => {
    setRefreshing(true)
    await forceUpdate()
  }

  const filteredNavItems = navItems.filter(item =>
    role && item.roles.includes(role)
  )

  const NavLinks = () => (
    <nav className="space-y-1">
      {filteredNavItems.map((item) => {
        const Icon = item.icon
        const isActive = location.pathname === item.href
        const isHijo = item.href === '/admin/mantenimiento'
        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isHijo && 'ml-4 text-xs',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Icon className="h-5 w-5" />
            {item.title}
          </Link>
        )
      })}
    </nav>
  )

  const VersionInfo = () => (
    <div className="px-3 py-2 space-y-0.5">
      <p className="text-[10px] text-muted-foreground">v{APP_VERSION}</p>
    </div>
  )

  const ForceUpdateButton = () => (
    <Button
      variant="outline"
      size="sm"
      className="w-full justify-start gap-2 text-xs"
      onClick={handleForceUpdate}
      disabled={refreshing}
    >
      <RefreshCw className={cn('h-3 w-3', refreshing && 'animate-spin')} />
      {refreshing ? 'Actualizando...' : 'Forzar actualización'}
    </Button>
  )

  const { puedeInstalar, instalar } = usePWAInstall()
  const { cantidadDuplicados, refetch: refetchDuplicados } = useContactosDuplicados()

  return (
    <div className="h-screen flex bg-gradient-to-b from-background to-white">

      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-64 flex-col border-r bg-gradient-to-b from-white to-primary/20">
        <div className="p-6">
          <img src="/logo.svg" alt="Aliado Presente Logo" className="h-32 w-auto" />
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-muted-foreground">
              {role === 'admin' ? 'Panel Administrativo' : 'Panel PAL'}
            </p>
            <Badge variant={role === 'admin' ? 'default' : 'secondary'} className="text-xs">
              {role?.toUpperCase()}
            </Badge>
          </div>
        </div>

        <div className="flex-1 px-4 overflow-auto">
          <NavLinks />
        </div>

        <div className="p-4 border-t space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-xs relative"
            onClick={() => setContactosOpen(true)}
          >
            <Contact className="h-3 w-3" />
            Contactos
            {cantidadDuplicados > 0 && (
              <Badge variant="destructive" className="ml-auto text-[10px] h-4 px-1.5">
                {cantidadDuplicados}
              </Badge>
            )}
          </Button>
          <VersionInfo />
          {role === 'admin' && <BtnNotificaciones />}
          {puedeInstalar && (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 text-xs"
              onClick={instalar}
            >
              <Download className="h-3 w-3" />
              Instalar app
            </Button>
          )}
          <ForceUpdateButton />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-3">
                <User className="h-5 w-5" />
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium truncate">{nombreCompleto ?? user?.user_metadata?.nombre_completo}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 bg-transparent px-4">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-64 p-0 bg-gradient-to-b from-white to-primary">
              <div className="p-6">
                <img src="/logo.svg" alt="Aliado Presente Logo" className="h-32 w-auto" />
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground">
                    {role === 'admin' ? 'Panel Administrativo' : 'Panel PAL'}
                  </p>
                  <Badge variant={role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                    {role?.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="flex-1 px-4 overflow-auto">
                <NavLinks />
              </div>

              <div className="p-4 border-t space-y-2">
                <VersionInfo />
                {role === 'admin' && <BtnNotificaciones />}
                {puedeInstalar && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2 text-xs"
                    onClick={instalar}
                  >
                    <Download className="h-3 w-3" />
                    Instalar app
                  </Button>
                )}
                <ForceUpdateButton />
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{nombreCompleto ?? user?.user_metadata?.nombre_completo}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar Sesión
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Título mobile */}
          <div className="flex-1 min-w-0 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold leading-tight">Aliado Presente v.{APP_VERSION}</p>
            </div>
            <ConnectionIndicators />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2 max-w-[120px]">
                <User className="h-4 w-4 shrink-0" />
                <span className="text-xs truncate">
                  {nombreCompleto ?? user?.user_metadata?.nombre_completo?.split(' ')[0]}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div>
                  <p className="text-sm font-medium">{nombreCompleto ?? user?.user_metadata?.nombre_completo}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto pb-20 lg:pb-8">
          {children}
        </div>
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-border/40">
        <div className="flex justify-between px-1 py-1.5">
          {filteredNavItems.slice(0, 4).map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex flex-col items-center px-1.5 py-1.5 rounded-lg transition-colors min-w-0 flex-1',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4.5 w-4.5 mb-0.5" />
                <span className="text-[10px] font-medium truncate max-w-full leading-tight">{item.title}</span>
              </Link>
            )
          })}
          <button
            type="button"
            onClick={() => setContactosOpen(true)}
            className="relative flex flex-col items-center px-1.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground min-w-0 flex-1"
          >
            <div className="relative">
              <Contact className="h-4.5 w-4.5 mb-0.5" />
              {cantidadDuplicados > 0 && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive" />
              )}
            </div>
            <span className="text-[10px] font-medium truncate max-w-full leading-tight">Contactos</span>
          </button>
          {role === 'pal' && <BtnAyuda />}
        </div>
      </nav>
      <ContactosOffcanvas
        open={contactosOpen}
        onOpenChange={setContactosOpen}
        onFusionCompletada={refetchDuplicados}
      />
      <PWAInstallPrompt />
      {role === 'pal' && <VideoPopupModal />}
    </div>
  )
}