import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt'
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
  PenTool
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: ('admin' | 'pal')[]
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    roles: ['admin']
  },
  {
    title: 'Agenda',
    href: '/admin/agenda',
    icon: Calendar,
    roles: ['admin']
  },
  {
    title: 'Actividades',
    href: '/admin/actividades',
    icon: PenTool,
    roles: ['admin']
  },
  {
    title: 'Pacientes',
    href: '/admin/pacientes',
    icon: Stethoscope,
    roles: ['admin']
  },
  {
    title: 'Usuarios',
    href: '/admin/usuarios',
    icon: Users,
    roles: ['admin']
  },
  {
    title: 'Catálogos',
    href: '/admin/catalogos',
    icon: BookOpen,
    roles: ['admin']
  },
  {
    title: 'Instituciones',
    href: '/admin/instituciones',
    icon: Building2,
    roles: ['admin']
  },
  {
    title: 'Configuraciones',
    href: '/admin/configuraciones',
    icon: Settings,
    roles: ['admin']
  },
  {
    title: 'Reportes',
    href: '/admin/reportes',
    icon: FileText,
    roles: ['admin']
  },
  {
    title: 'Dashboard',
    href: '/pal',
    icon: LayoutDashboard,
    roles: ['pal']
  },
  {
    title: 'Agenda',
    href: '/pal/calendario',
    icon: Calendar,
    roles: ['pal']
  },
  {
    title: 'Actividades',
    href: '/pal/actividades',
    icon: PenTool,
    roles: ['pal']
  },
  {
    title: 'Pacientes',
    href: '/pal/pacientes',
    icon: Stethoscope,
    roles: ['pal']
  }
]

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, role, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const filteredNavItems = navItems.filter(item => 
    role && item.roles.includes(role)
  )

  const NavLinks = () => (
    <nav className="space-y-1">
      {filteredNavItems.map((item) => {
        const Icon = item.icon
        const isActive = location.pathname === item.href
        
        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
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

  return (
    <div className="h-screen flex bg-gradient-to-b from-muted/50 to-white">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-64 flex-col border-r bg-card">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Control PALs</h1>
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

        <div className="p-4 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-3">
                <User className="h-5 w-5" />
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium truncate">{user?.user_metadata?.nombre_completo}</p>
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
            
            <SheetContent side="left" className="w-64 p-0">
              <div className="p-6">
                <h1 className="text-2xl font-bold">Control PALs</h1>
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
              
              <div className="p-4 border-t">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user?.user_metadata?.nombre_completo}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 mt-2"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar Sesión
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Control PALs</h1>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div>
                  <p className="text-sm font-medium">{user?.user_metadata?.nombre_completo}</p>
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
        <div className="flex justify-around py-2">
          {filteredNavItems.slice(0, 4).map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex flex-col items-center px-3 py-2 rounded-lg transition-colors min-w-0',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium truncate">{item.title}</span>
              </Link>
            )
          })}
        </div>
      </nav>
      <PWAInstallPrompt />
    </div>
  )
}