import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
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
  MapPin,
  FileCheck
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
    title: 'Mis Contactos',
    href: '/pal/contactos',
    icon: Users,
    roles: ['pal']
  },
  {
    title: 'Nuevo Contacto',
    href: '/pal/contactos/nuevo',
    icon: FileCheck,
    roles: ['pal']
  },
  {
    title: 'Instituciones',
    href: '/pal/instituciones',
    icon: MapPin,
    roles: ['pal']
  },
  {
    title: 'Fichas',
    href: '/pal/fichas',
    icon: FileText,
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
    <div className="flex min-h-screen">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Control PALs</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-muted-foreground">
              {role === 'admin' ? 'Panel Administrativo' : 'Panel PAL'}
            </p>
            <Badge variant={role === 'admin' ? 'default' : 'secondary'} className="text-xs">
              {role || 'Sin rol'}
            </Badge>
          </div>
        </div>
        <div className="flex-1 px-3 py-4">
          <NavLinks />
        </div>
        <div className="p-4 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start">
                <User className="mr-2 h-4 w-4" />
                <span className="truncate">{user?.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled className="text-xs">
                Rol: <Badge variant="outline" className="ml-2">{role || 'N/A'}</Badge>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header Mobile */}
        <header className="md:hidden border-b bg-card p-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Control PALs</h1>
            <Badge variant={role === 'admin' ? 'default' : 'secondary'} className="text-xs mt-1">
              {role || 'Sin rol'}
            </Badge>
          </div>
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
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
                    {role || 'Sin rol'}
                  </Badge>
                </div>
              </div>
              <div className="px-3 py-4">
                <NavLinks />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        {/* Main */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}