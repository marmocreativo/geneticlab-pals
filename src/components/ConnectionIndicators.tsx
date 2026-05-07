import { Wifi, WifiOff, Database, DatabaseZap, MapPin } from 'lucide-react'
import { useConnectionStatus } from '@/hooks/useConnectionStatus'

export function ConnectionIndicators() {
  const { online, quality, supabaseOk, gpsStatus } = useConnectionStatus()

  const wifiIcon = () => {
    if (!online) return <WifiOff className="h-4 w-4 text-red-500" />
    if (quality === 'mala') return <Wifi className="h-4 w-4 text-orange-500" />
    if (quality === 'regular') return <Wifi className="h-4 w-4 text-yellow-500" />
    return <Wifi className="h-4 w-4 text-green-500" />
  }

  const supabaseIcon = () => {
    if (supabaseOk === null) return <Database className="h-4 w-4 text-muted-foreground" />
    if (!supabaseOk) return <DatabaseZap className="h-4 w-4 text-red-500" />
    return <Database className="h-4 w-4 text-green-500" />
  }

  const gpsIcon = () => {
    if (gpsStatus === 'no-soportado') return null
    if (gpsStatus === 'denegado') return <MapPin className="h-4 w-4 text-red-500" />
    if (gpsStatus === 'verificando') return <MapPin className="h-4 w-4 text-muted-foreground" />
    return <MapPin className="h-4 w-4 text-green-500" />
  }

  return (
    <div className="flex items-center gap-1.5">
      <div title={!online ? 'Sin red' : `Red ${quality}`}>
        {wifiIcon()}
      </div>
      <div title={
        supabaseOk === null ? 'Verificando base de datos...' :
        supabaseOk ? 'Base de datos OK' :
        'Error de base de datos'
      }>
        {supabaseIcon()}
      </div>
      <div title={
        gpsStatus === 'disponible' ? 'GPS disponible' :
        gpsStatus === 'denegado' ? 'GPS denegado - necesario para validar visitas' :
        gpsStatus === 'verificando' ? 'Verificando GPS...' : ''
      }>
        {gpsIcon()}
      </div>
    </div>
  )
}