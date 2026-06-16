// pages/pal/PalDashboard.tsx
import { useNavigate } from 'react-router-dom'
import { Calendar, PenTool, Stethoscope } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useState, useEffect } from 'react'
import BiometricPromptDialog, { shouldShowBiometricPrompt } from '@/components/BiometricPromptDialog'
import { useWebAuthn } from '@/hooks/useWebAuthn'

export default function PalDashboard() {
  const navigate = useNavigate()

  const [showBiometricDialog, setShowBiometricDialog] = useState(false)
    const { getCredentials, isSupported } = useWebAuthn()

    useEffect(() => {
      const checkBiometric = async () => {
        if (!isSupported()) return
        if (!shouldShowBiometricPrompt()) return

        const credentials = await getCredentials()
        if (credentials && credentials.length === 0) {
          setShowBiometricDialog(true)
        }
      }
      checkBiometric()
    }, [])

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <img src="/logo.svg" alt="Aliado Presente Logo" className="h-24 w-auto mx-auto" />
        <h1 className="text-3xl font-bold text-center mb-2">Bienvenido</h1>
        <p className="text-muted-foreground text-center">
          Selecciona una opción para continuar
        </p>
      </div>

      <div className="space-y-4">
      {/* Primera fila - Agenda (botón grande horizontal) */}
      <Card 
        className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-95 bg-primary text-primary-foreground overflow-hidden"
        onClick={() => navigate('/pal/calendario')}
      >
        <CardContent className="relative flex items-center justify-start p-6 min-h-[100px]">
          <div className="z-10">
            <h3 className="text-3xl font-bold mb-1">Agenda</h3>
            <p className="text-primary-foreground/80">Ver calendario de visitas</p>
          </div>
          <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 h-40 w-40 opacity-20 rotate-12" />
        </CardContent>
      </Card>

      {/* Segunda fila - Actividades y Censo (dos botones) */}
      <div className="grid grid-cols-2 gap-4">
        <Card 
          className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-95 bg-secondary text-secondary-foreground overflow-hidden"
          onClick={() => navigate('/pal/actividades')}
        >
          <CardContent className="relative flex flex-col justify-center p-4 min-h-[120px]">
            <div className="z-10">
              <h3 className="text-xl font-bold mb-1">Actividades</h3>
              <p className="text-secondary-foreground/80 text-sm">Registrar actividades</p>
            </div>
            <PenTool className="absolute right-2 top-1/2 -translate-y-1/2 h-20 w-20 opacity-20 -rotate-12" />
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-95 bg-accent text-accent-foreground overflow-hidden"
          onClick={() => navigate('/pal/pacientes')}
        >
          <CardContent className="relative flex flex-col justify-center p-4 min-h-[120px]">
            <div className="z-10">
              <h3 className="text-xl font-bold mb-1">Censo Pacientes</h3>
              <p className="text-accent-foreground/80 text-sm">Gestión de pacientes</p>
            </div>
            <Stethoscope className="absolute right-2 top-1/2 -translate-y-1/2 h-20 w-20 opacity-20 rotate-12" />
          </CardContent>
        </Card>
      </div>

      <BiometricPromptDialog
        open={showBiometricDialog}
        onClose={() => setShowBiometricDialog(false)}
      />
    </div>
    </div>
  )
}