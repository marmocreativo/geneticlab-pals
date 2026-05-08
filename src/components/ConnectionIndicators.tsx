import { Wifi, WifiOff, Database, DatabaseZap, MapPin } from 'lucide-react'
import { useConnectionStatus } from '@/hooks/useConnectionStatus'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

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

  const wifiLabel = !online ? 'Sin red' : `Red ${quality}`
  const wifiDesc = !online
    ? 'No hay conexión a internet.'
    : quality === 'mala' ? 'Señal débil. Puede haber problemas de carga.'
    : quality === 'regular' ? 'Señal regular.'
    : 'Conexión estable.'

  const supabaseLabel = supabaseOk === null ? 'Verificando...' : supabaseOk ? 'Base de datos OK' : 'Error de base de datos'
  const supabaseDesc = supabaseOk === null
    ? 'Comprobando conexión con la base de datos.'
    : supabaseOk ? 'La base de datos responde correctamente.'
    : 'No se puede conectar con la base de datos. Los datos pueden no guardarse.'

  const gpsLabel = gpsStatus === 'disponible' ? 'GPS disponible'
    : gpsStatus === 'denegado' ? 'GPS denegado'
    : gpsStatus === 'verificando' ? 'Verificando GPS...'
    : ''
  const gpsDesc = gpsStatus === 'disponible' ? 'El GPS está activo y listo para validar visitas.'
    : gpsStatus === 'denegado' ? 'Permiso de ubicación denegado. Es necesario para validar visitas.'
    : 'Comprobando disponibilidad del GPS.'

  const Item = ({ icon, label, desc }: { icon: React.ReactNode; label: string; desc: string }) => (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center justify-center rounded p-0.5 hover:bg-accent transition-colors">
          {icon}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="end">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-1">{desc}</p>
      </PopoverContent>
    </Popover>
  )

  return (
    <div className="flex items-center gap-1.5">
      <Item icon={wifiIcon()} label={wifiLabel} desc={wifiDesc} />
      <Item icon={supabaseIcon()} label={supabaseLabel} desc={supabaseDesc} />
      {gpsStatus !== 'no-soportado' && (
        <Item icon={gpsIcon()} label={gpsLabel} desc={gpsDesc} />
      )}
    </div>
  )
}