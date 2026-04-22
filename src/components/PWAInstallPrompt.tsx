// src/components/PWAInstallPrompt.tsx
import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Verificar si ya está instalado
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isInWebAppiOS = (window.navigator as any).standalone
      const isInWebAppChrome = window.matchMedia('(display-mode: minimal-ui)').matches
      
      return isStandalone || isInWebAppiOS || isInWebAppChrome
    }

    setIsInstalled(checkIfInstalled())

    // Escuchar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Mostrar el prompt después de un breve delay
      setTimeout(() => {
        setShowPrompt(true)
      }, 3000) // 3 segundos después de cargar
    }

    // Escuchar cuando se instala
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('PWA instalada')
      }
      
      setDeferredPrompt(null)
      setShowPrompt(false)
    } catch (error) {
      console.error('Error instalando PWA:', error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // No mostrar de nuevo en esta sesión
    sessionStorage.setItem('pwa-prompt-dismissed', 'true')
  }

  // No mostrar si ya está instalado o si fue dismissado
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null
  }

  // No mostrar si ya fue dismissado en esta sesión
  if (sessionStorage.getItem('pwa-prompt-dismissed')) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <Card className="border-primary/20 bg-white/95 backdrop-blur-sm shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Download className="w-5 h-5 text-primary" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">
                Instalar Aliado Presente
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Instala la app en tu dispositivo para un acceso más rápido y trabajar sin conexión.
              </p>
              
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleInstall}
                  className="text-xs h-8"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Instalar
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleDismiss}
                  className="text-xs h-8"
                >
                  Ahora no
                </Button>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="w-6 h-6 p-0 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}