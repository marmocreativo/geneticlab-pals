// pages/pal/VisitaDetailsPage.tsx
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Navigation,
  CheckCircle,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  CalendarX,
  Camera,
  Image as ImageIcon,
  Trash2,
  Upload
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
    if (visita.tipo_visita === 'presencial' && bucketReady) {
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

   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        toast.error('Solo se permiten archivos de imagen')
        return
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen debe ser menor a 5MB')
        return
      }

      setFotoSeleccionada(file)
      
      // Crear preview
      const reader = new FileReader()
      reader.onload = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Limpiar el input
      e.target.value = ''
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
      <div className="flex-1 p-4 space-y-4">
        {/* Información básica con acciones integradas */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              {visita.tipo_visita === 'presencial' ? (
                <MapPin className="h-5 w-5 text-blue-600" />
              ) : (
                <Phone className="h-5 w-5 text-green-600" />
              )}
              <div className="flex-1">
                <h2 className="font-medium text-lg">{visita.institucion?.nombre}</h2>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  <span>{format(new Date(visita.fecha_visita), 'dd MMM', { locale: es })}</span>
                  <span>{format(new Date(visita.fecha_visita), 'HH:mm')}</span>
                  <Badge variant="outline" className="text-xs">
                    {visita.tipo_visita === 'presencial' ? 'Presencial' : 'Telefónica'}
                  </Badge>
                </div>
              </div>
              
              {/* Botones de acción como iconos */}
              <div className="flex gap-1">
                {/* Reagendar - solo si está programada */}
                {visita.estado === 'programada' && (
                  <Button 
                    onClick={() => setShowReagendarDialog(true)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="Reagendar visita"
                  >
                    <CalendarX className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Estado GPS si está validado */}
            {visita.tipo_visita === 'presencial' && visita.validacion_gps && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded text-sm mb-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-green-700">Ubicación validada ({visita.distancia_metros}m)</span>
              </div>
            )}

            {/* Dirección colapsable */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDireccion(!showDireccion)}
              className="w-full justify-between h-8 text-xs p-2"
            >
              Ver dirección
              {showDireccion ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>

            {showDireccion && (
              <div className="mt-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground">
                {visita.institucion?.direccion}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Acciones principales */}
        {visita.estado === 'programada' && (
          <Card>
            <CardContent className="p-4 space-y-4">
              {/* Validar GPS para visitas presenciales */}
              {visita.tipo_visita === 'presencial' && !visita.validacion_gps && (
                <div>
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm mb-3">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-yellow-700">Primero valida tu ubicación</span>
                  </div>
                  
                  <Button 
                    onClick={handleValidarGPS}
                    disabled={validandoGPS}
                    className="w-full"
                  >
                    {validandoGPS ? (
                      <>
                        <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Validando ubicación...
                      </>
                    ) : (
                      <>
                        <Navigation className="h-4 w-4 mr-2" />
                        Validar GPS
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Confirmar asistencia - disponible cuando GPS está validado o es telefónica */}
              {(visita.tipo_visita === 'telefono' || visita.validacion_gps) && (
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={handleConfirmarAsistencia}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {visita.tipo_visita === 'presencial' && bucketReady ? 'Confirmar + Foto' : 'Confirmar'}
                  </Button>
                  <Button 
                    onClick={handleMarcarFalta}
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Marcar falta
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
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
          <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded text-sm">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-green-700">Visita confirmada exitosamente</span>
          </div>
        )}

        {visita.estado === 'falto' && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded text-sm">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-red-700">Falta registrada</span>
          </div>
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