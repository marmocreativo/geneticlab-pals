import { useState } from 'react'
import { Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { usePWAInstall } from '@/hooks/usePWAInstall'

export function PWAInstallPrompt() {
  const { puedeInstalar, instalar } = usePWAInstall()
  const [dismissed, setDismissed] = useState(false)

  const handleInstall = async () => {
    await instalar()
  }

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('pwa-prompt-dismissed', 'true')
  }

  if (
    !puedeInstalar ||
    dismissed ||
    sessionStorage.getItem('pwa-prompt-dismissed')
  ) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <Card className="border-primary/20 bg-white/95 backdrop-blur-sm shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">Instalar Aliado Presente</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Instala la app para acceso rápido y uso sin conexión.
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleInstall} className="text-xs h-8">
                  <Download className="w-3 h-3 mr-1" />
                  Instalar
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDismiss} className="text-xs h-8">
                  Ahora no
                </Button>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleDismiss} className="w-6 h-6 p-0 shrink-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}