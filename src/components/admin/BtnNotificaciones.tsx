import { Bell, BellOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { toast } from 'sonner'

export function BtnNotificaciones() {
  const { suscrito, soportado, suscribir, desuscribir } = usePushNotifications()

  if (!soportado) return null

  const handleClick = async () => {
    if (suscrito) {
      const ok = await desuscribir()
      if (ok) toast.success('Notificaciones desactivadas')
      else toast.error('Error al desactivar notificaciones')
    } else {
      const ok = await suscribir()
      if (ok) toast.success('Notificaciones activadas')
      else toast.error('No se pudo activar las notificaciones')
    }
  }

  return (
    <Button
      variant={suscrito ? 'default' : 'outline'}
      size="sm"
      onClick={handleClick}
    >
      {suscrito ? (
        <>
          <Bell className="w-4 h-4 mr-2" />
          Notificaciones activas
        </>
      ) : (
        <>
          <BellOff className="w-4 h-4 mr-2" />
          Activar notificaciones
        </>
      )}
    </Button>
  )
}