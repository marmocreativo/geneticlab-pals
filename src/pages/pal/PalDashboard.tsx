// pages/pal/PalDashboard.tsx
import { useNavigate } from 'react-router-dom'
import { Calendar, PenTool, Stethoscope } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function PalDashboard() {
  const navigate = useNavigate()

  const menuItems = [
    {
      title: 'Agenda',
      icon: Calendar,
      path: '/pal/calendario',
      description: 'Ver calendario de visitas'
    },
    {
      title: 'Actividades',
      icon: PenTool,
      path: '/pal/actividades',
      description: 'Registrar actividades'
    },
    {
      title: 'Censo Pacientes',
      icon: Stethoscope,
      path: '/pal/pacientes',
      description: 'Gestión de pacientes'
    }
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">Bienvenido</h1>
        <p className="text-muted-foreground text-center">
          Selecciona una opción para continuar
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <Card 
            key={item.path}
            className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95"
            onClick={() => navigate(item.path)}
          >
            <CardContent className="flex flex-col items-center justify-center p-8 min-h-[200px]">
              <item.icon className="h-16 w-16 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2 text-center">
                {item.title}
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}