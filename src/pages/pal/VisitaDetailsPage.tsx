// pages/pal/VisitaDetailsPage.tsx
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { 
  ArrowLeft, 
  MapPin, 
  Navigation,
  CheckCircle,
  AlertCircle,
  XCircle,
  CalendarX,
  Camera,
  Image as ImageIcon,
  Trash2,
  Upload,
  MoreHorizontal,
  Clock,
  Calendar,
  Wifi
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import CameraCapture from '@/components/common/CameraCapture'
import { useVisitas } from '@/hooks/useVisitas'
import { useConfiguraciones } from '@/hooks/useConfiguraciones'
import { useFotosEvidencia } from '@/hooks/useFotosEvidencia'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Visita } from '@/types/visita'

const VisitaDetailsPage: React.FC = () => {
  const { visitaId } = useParams<{ visitaId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { getVisitaById, validarGPS, confirmarAsistencia, marcarFalta, updateVisita } = useVisitas()
  const { getConfiguracionNumber } = useConfiguraciones()
  const { fotos, loading: fotosLoading, uploading, bucketReady, fetchFotosByVisita, subirFoto, eliminarFoto } = useFotosEvidencia()
  
  const [visita, setVisita] = useState<Visita | null>(null)
  const [loading, setLoading] = useState(true)
  const [validandoGPS, setValidandoGPS] = useState(false)
  const [showDireccion, setShowDireccion] = useState(false)
  const [showReagendarDialog, setShowReagendarDialog] = useState(false)
  const [nuevaFecha, setNuevaFecha] = useState('')
  const [nuevaHora, setNuevaHora] = useState('')
  const [showEvidenciaDialog, setShowEvidenciaDialog] = useState(false)
  const [fotoSeleccionada, setFotoSeleccionada] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Obtener fecha del estado de navegación
  const selectedDate = location.state?.selectedDate

  useEffect(() => {
    if (visitaId) {
      fetchVisitaDetails()
    }
  }, [visitaId])

  // Cargar fotos cuando la visita esté confirmada
  useEffect(() => {
    if (visita && visita.estado === 'asistio' && bucketReady) {
      fetchFotosByVisita(visita.id)
    }
  }, [visita, bucketReady])

  const fetchVisitaDetails = async () => {
    if (!visitaId) return
    
    try {
      setLoading(true)
      const visitaData = await getVisitaById(visitaId)
      setVisita(visitaData)
    } catch (error) {
      console.error('Error fetching visita:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVolver = () => {
    if (selectedDate) {
      const fechaString = format(selectedDate, 'yyyy-MM-dd')
      navigate(`/pal/visitas-dia/${fechaString}`)
    } else {
      navigate('/pal/calendario')
    }
  }

  const handleReagendar = async () => {
    if (!visita || !nuevaFecha || !nuevaHora) return

    try {
      const nuevaFechaVisita = new Date(`${nuevaFecha}T${nuevaHora}`)
      
      await updateVisita(visita.id, {
        fecha_visita: nuevaFechaVisita.toISOString()
      })

      toast.success('Visita reagendada. Los administradores han sido notificados.')
      setShowReagendarDialog(false)
      await fetchVisitaDetails()
    } catch (error) {
      toast.error('Error al reagendar la visita')
    }
  }

  const handleValidarGPS = async () => {
    if (!visita) return

    setValidandoGPS(true)
    
    try {
      if (!navigator.geolocation) {
        toast.error('Tu dispositivo no tiene GPS disponible')
        setValidandoGPS(false)
        return
      }

      toast.info('Obteniendo tu ubicación...', { duration: 2000 })

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          const distanciaPermitida = getConfiguracionNumber('distancia_validacion_gps') || 100

          try {
            const resultado = await validarGPS(visita.id, latitude, longitude, distanciaPermitida)

            setVisita(prev => prev ? {
              ...prev,
              validacion_gps: resultado.validacion_gps,
              latitud_registro: resultado.latitud_registro,
              longitud_registro: resultado.longitud_registro,
              distancia_metros: resultado.distancia_metros
            } : null)

          } catch (error) {
            console.error('Error en validarGPS:', error)
          } finally {
            setValidandoGPS(false)
          }
        },
        (error) => {
          console.error('Error de geolocalización:', error)
          setValidandoGPS(false)
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              toast.error('Debes permitir el acceso a la ubicación')
              break
            case error.POSITION_UNAVAILABLE:
              toast.error('No se pudo obtener tu ubicación')
              break
            case error.TIMEOUT:
              toast.error('Tiempo de espera agotado')
              break
            default:
              toast.error('Error al obtener la ubicación')
              break
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 30000
        }
      )
    } catch (error) {
      console.error('Error general:', error)
      toast.error('Error inesperado al validar ubicación')
      setValidandoGPS(false)
    }
  }

  const handleConfirmarAsistencia = async () => {
    if (!visita) return
    
    // Para visitas presenciales, requerir evidencia fotográfica
    if (bucketReady) {
      setShowEvidenciaDialog(true)
      return
    }
    
    // Para visitas telefónicas, confirmar directamente
    try {
      const visitaActualizada = await confirmarAsistencia(visita.id)
      setVisita(visitaActualizada)
      toast.success('Asistencia confirmada exitosamente')
    } catch (error) {
      console.error('Error confirming attendance:', error)
    }
  }

  const handleMarcarFalta = async () => {
    if (!visita) return
    try {
      const visitaActualizada = await marcarFalta(visita.id)
      setVisita(visitaActualizada)
      toast.success('Falta registrada')
    } catch (error) {
      console.error('Error marking absence:', error)
    }
  }

  const handleSubirEvidencia = async () => {
    if (!visita || !fotoSeleccionada) return

    try {
      const result = await subirFoto(visita.id, fotoSeleccionada)
      
      if (result) {
        // Confirmar la visita después de subir la evidencia
        const visitaActualizada = await confirmarAsistencia(visita.id)
        setVisita(visitaActualizada)
        
        // Limpiar estado
        setShowEvidenciaDialog(false)
        setFotoSeleccionada(null)
        setPreviewUrl(null)
        
        toast.success('Visita confirmada con evidencia fotográfica')
      }
    } catch (error) {
      console.error('Error subiendo evidencia:', error)
    }
  }

  const handleEliminarFoto = async (fotoId: string, url: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta foto?')) {
      await eliminarFoto(fotoId, url)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'programada':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Programada</Badge>
      case 'asistio':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Asistió</Badge>
      case 'falto':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Faltó</Badge>
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!visita) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
          <h3 className="font-medium mb-2">Visita no encontrada</h3>
          <Button onClick={handleVolver} size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto min-h-screen flex flex-col">
      {/* Header fijo */}
      <div className="sticky top-0 bg-background border-b p-4 z-10">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleVolver}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          {getEstadoBadge(visita.estado)}
        </div>
      </div>

      {/* Contenido scrolleable */}
      <div className="flex-1 p-4 space-y-6">
        {/* 1. INSTITUCIÓN - Carta con degradado */}
        <Card className="bg-gradient-to-r from-primary to-accent text-primary-foreground overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-1">{visita.institucion?.nombre}</h1>
                <div className="text-primary-foreground/80 text-sm">
                  Visita programada
                </div>
              </div>
              
              {/* Menú de opciones */}
              {visita.estado === 'programada' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary-foreground hover:bg-white/20">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowReagendarDialog(true)}>
                      <CalendarX className="h-4 w-4 mr-2" />
                      Reagendar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowDireccion(!showDireccion)}>
                      <MapPin className="h-4 w-4 mr-2" />
                      {showDireccion ? 'Ocultar dirección' : 'Ver dirección'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 2. DATOS DE LA VISITA - Píldoras */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(visita.fecha_visita), 'dd MMM yyyy', { locale: es })}
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(visita.fecha_visita), 'HH:mm')}
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Wifi className="h-3 w-3" />
              Presencial
            </Badge>
          </div>

          {/* Dirección colapsable */}
          {showDireccion && (
            <Card>
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    {visita.institucion?.direccion}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* SEPARADOR */}
        <div className="border-t border-dashed"></div>

        {/* 3. VALIDACIÓN GPS */}
        {visita.estado === 'programada' && !visita.validacion_gps && (
          <Card 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={handleValidarGPS}
          >
            <CardContent className="p-6 text-center">
              <div className="relative inline-block mb-3">
                <Navigation className={`h-12 w-12 text-primary ${validandoGPS ? 'animate-pulse' : ''}`} />
                {validandoGPS && (
                  <div className="absolute inset-0 border-2 border-primary rounded-full animate-ping"></div>
                )}
              </div>
              <h3 className="font-semibold mb-1">Validar Ubicación</h3>
              <p className="text-sm text-muted-foreground">
                {validandoGPS ? 'Obteniendo ubicación...' : 'Toca para validar tu GPS'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Estado GPS validado */}
        {visita.validacion_gps && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4 py-0">
              <div className="flex items-center gap-3 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <div>
                  <p className="font-medium">Ubicación validada</p>
                  <p className="text-sm">Distancia: {visita.distancia_metros}m</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 4. CONFIRMAR VISITA */}
        {visita.estado === 'programada' && visita.validacion_gps && (
          <Card 
            className="cursor-pointer hover:bg-green-50 transition-colors border-green-200"
            onClick={handleConfirmarAsistencia}
          >
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-1 text-green-700">Confirmar Visita</h3>
              <p className="text-sm text-muted-foreground">
                {bucketReady ? 'Incluir evidencia fotográfica' : 'Marcar como completada'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Botón discreto para marcar falta */}
        {visita.estado === 'programada' && visita.validacion_gps && (
          <Button 
            onClick={handleMarcarFalta}
            variant="outline"
            size="sm"
            className="w-full text-muted-foreground border-muted-foreground/20 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Marcar falta
          </Button>
        )}

        {/* Fotos de evidencia para visitas confirmadas */}
        {visita.estado === 'asistio' && bucketReady && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-sm flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Evidencia Fotográfica
                </h3>
                <span className="text-xs text-muted-foreground">{fotos.length} foto(s)</span>
              </div>

              {fotosLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : fotos.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {fotos.map((foto) => (
                    <div key={foto.id} className="relative group">
                      <img 
                        src={foto.url_storage} 
                        alt="Evidencia"
                        className="w-full aspect-square object-cover rounded border"
                      />
                      <Button
                        onClick={() => handleEliminarFoto(foto.id, foto.url_storage)}
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  No hay fotos de evidencia
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Mensajes informativos para estados finales */}
        {visita.estado === 'asistio' && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Visita confirmada exitosamente</span>
              </div>
            </CardContent>
          </Card>
        )}

        {visita.estado === 'falto' && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 text-red-700">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Falta registrada</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de Reagendar */}
      <Dialog open={showReagendarDialog} onOpenChange={setShowReagendarDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reagendar Visita</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs">
              <AlertCircle className="h-4 w-4 inline mr-2 text-yellow-600" />
              Los administradores serán notificados de este cambio
            </div>
            
            <div>
              <Label htmlFor="nueva-fecha">Nueva Fecha</Label>
              <Input
                id="nueva-fecha"
                type="date"
                value={nuevaFecha}
                onChange={(e) => setNuevaFecha(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="nueva-hora">Nueva Hora</Label>
              <Input
                id="nueva-hora"
                type="time"
                value={nuevaHora}
                onChange={(e) => setNuevaHora(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowReagendarDialog(false)} className="flex-1">
                Cancelar
              </Button>
              <Button 
                onClick={handleReagendar}
                disabled={!nuevaFecha || !nuevaHora}
                className="flex-1"
              >
                Reagendar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Evidencia Fotográfica */}
      <Dialog open={showEvidenciaDialog} onOpenChange={setShowEvidenciaDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Evidencia Fotográfica
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs">
              <AlertCircle className="h-4 w-4 inline mr-2 text-blue-600" />
              Sube una foto como evidencia de tu visita presencial
            </div>

            {/* Preview de la imagen */}
            {previewUrl && (
              <div className="text-center space-y-3">
                <img 
                  src={previewUrl} 
                  alt="Preview"
                  className="w-full max-w-xs mx-auto rounded border"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFotoSeleccionada(null)
                    setPreviewUrl(null)
                  }}
                >
                  Cambiar foto
                </Button>
              </div>
            )}

            {/* Componente de captura */}
            {!fotoSeleccionada && (
              <CameraCapture
                onPhotoCapture={(file) => {
                  setFotoSeleccionada(file)
                  const reader = new FileReader()
                  reader.onload = () => {
                    setPreviewUrl(reader.result as string)
                  }
                  reader.readAsDataURL(file)
                }}
                onCancel={() => setShowEvidenciaDialog(false)}
              />
            )}
            
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowEvidenciaDialog(false)
                  setFotoSeleccionada(null)
                  setPreviewUrl(null)
                }} 
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSubirEvidencia}
                disabled={!fotoSeleccionada || uploading}
                className="flex-1"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Confirmar Visita
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default VisitaDetailsPage